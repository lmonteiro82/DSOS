<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, POST, PUT');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers, Content-Type, Access-Control-Allow-Methods, Authorization, X-Requested-With');

require_once '../config/database.php';

session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Não autorizado']);
    exit();
}

$database = new Database();
$db = $database->connect();

$method = $_SERVER['REQUEST_METHOD'];

// GET - Listar administrações
if ($method === 'GET') {
    try {
        $query = "SELECT role, lar_id FROM users WHERE id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $_SESSION['user_id']);
        $stmt->execute();
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user['role'] === 'admin_geral') {
            $query = "SELECT a.*, t.tipo as terapeutica_tipo, 
                      u.nome as utente_nome, m.nome as medicamento_nome,
                      us1.nome as administrado_por_nome, us2.nome as validada_por_nome
                      FROM administracoes a
                      JOIN terapeuticas t ON a.terapeutica_id = t.id
                      JOIN utentes u ON t.utente_id = u.id
                      JOIN medicamentos m ON t.medicamento_id = m.id
                      JOIN users us1 ON a.administrado_por = us1.id
                      LEFT JOIN users us2 ON a.validada_por = us2.id
                      ORDER BY a.data_hora DESC";
            $stmt = $db->prepare($query);
        } else {
            $query = "SELECT a.*, t.tipo as terapeutica_tipo,
                      u.nome as utente_nome, m.nome as medicamento_nome,
                      us1.nome as administrado_por_nome, us2.nome as validada_por_nome
                      FROM administracoes a
                      JOIN terapeuticas t ON a.terapeutica_id = t.id
                      JOIN utentes u ON t.utente_id = u.id
                      JOIN medicamentos m ON t.medicamento_id = m.id
                      JOIN users us1 ON a.administrado_por = us1.id
                      LEFT JOIN users us2 ON a.validada_por = us2.id
                      WHERE u.lar_id = :lar_id
                      ORDER BY a.data_hora DESC";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':lar_id', $user['lar_id']);
        }

        $stmt->execute();
        $administracoes = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['success' => true, 'data' => $administracoes]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erro: ' . $e->getMessage()]);
    }
}

// POST - Registar administração
else if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    try {
        $query = "INSERT INTO administracoes (terapeutica_id, data_hora, administrada, 
                  motivo_nao_administracao, observacoes, administrado_por) 
                  VALUES (:terapeutica_id, :data_hora, :administrada, :motivo, 
                  :observacoes, :administrado_por)";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':terapeutica_id', $data->terapeutica_id);
        $stmt->bindParam(':data_hora', $data->data_hora);
        $stmt->bindParam(':administrada', $data->administrada);
        $stmt->bindParam(':motivo', $data->motivo_nao_administracao);
        $stmt->bindParam(':observacoes', $data->observacoes);
        $stmt->bindParam(':administrado_por', $_SESSION['user_id']);

        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'message' => 'Administração registada com sucesso',
                'id' => $db->lastInsertId()
            ]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erro: ' . $e->getMessage()]);
    }
}

// PUT - Validar administração
else if ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"));

    try {
        $db->beginTransaction();

        // Atualizar administração
        $query = "UPDATE administracoes SET validada = 1, validada_por = :validada_por, 
                  data_validacao = NOW() WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':validada_por', $_SESSION['user_id']);
        $stmt->bindParam(':id', $data->id);
        $stmt->execute();

        // Se foi administrada, atualizar stock
        if ($data->administrada) {
            // Obter informações da terapêutica
            $query = "SELECT t.utente_id, t.medicamento_id 
                      FROM administracoes a
                      JOIN terapeuticas t ON a.terapeutica_id = t.id
                      WHERE a.id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $data->id);
            $stmt->execute();
            $info = $stmt->fetch(PDO::FETCH_ASSOC);

            // Decrementar stock
            $query = "UPDATE stocks SET quantidade = quantidade - 1 
                      WHERE medicamento_id = :medicamento_id AND utente_id = :utente_id 
                      AND quantidade > 0";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':medicamento_id', $info['medicamento_id']);
            $stmt->bindParam(':utente_id', $info['utente_id']);
            $stmt->execute();
        }

        $db->commit();

        echo json_encode(['success' => true, 'message' => 'Administração validada com sucesso']);
    } catch (PDOException $e) {
        $db->rollBack();
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erro: ' . $e->getMessage()]);
    }
}
?>
