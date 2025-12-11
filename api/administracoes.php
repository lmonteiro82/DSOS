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

// Handle _method override for forms
if ($method === 'POST' && isset($_POST['_method'])) {
    $method = $_POST['_method'];
}

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
                      us_ter.nome as terapeuta_nome,
                      us_admin.nome as administrado_por_nome,
                      us2.nome as validada_por_nome
                      FROM administracoes a
                      JOIN terapeuticas t ON a.terapeutica_id = t.id
                      JOIN utentes u ON t.utente_id = u.id
                      JOIN medicamentos m ON t.medicamento_id = m.id
                      JOIN users us_ter ON t.criado_por = us_ter.id
                      JOIN users us_admin ON a.administrado_por = us_admin.id
                      LEFT JOIN users us2 ON a.validada_por = us2.id
                      ORDER BY a.data_hora DESC";
            $stmt = $db->prepare($query);
        } else {
            $query = "SELECT a.*, t.tipo as terapeutica_tipo,
                      u.nome as utente_nome, m.nome as medicamento_nome,
                      us_ter.nome as terapeuta_nome,
                      us_admin.nome as administrado_por_nome,
                      us2.nome as validada_por_nome
                      FROM administracoes a
                      JOIN terapeuticas t ON a.terapeutica_id = t.id
                      JOIN utentes u ON t.utente_id = u.id
                      JOIN medicamentos m ON t.medicamento_id = m.id
                      JOIN users us_ter ON t.criado_por = us_ter.id
                      JOIN users us_admin ON a.administrado_por = us_admin.id
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
    // Support both JSON and form data
    if (isset($_POST['terapeutica_id'])) {
        $terapeutica_id = $_POST['terapeutica_id'];
        $data_hora = $_POST['data_hora'];
        $administrada = $_POST['administrada'] == '1' ? 1 : 0;
        $motivo = $administrada ? null : $_POST['motivo_nao_administracao'];
        $observacoes = $_POST['observacoes'] ?? null;
    } else {
        $data = json_decode(file_get_contents("php://input"));
        $terapeutica_id = $data->terapeutica_id;
        $data_hora = $data->data_hora;
        $administrada = $data->administrada;
        $motivo = $data->motivo_nao_administracao ?? null;
        $observacoes = $data->observacoes ?? null;
    }

    try {
        // Obter terapeuta associada à terapêutica
        $qTer = $db->prepare("SELECT criado_por FROM terapeuticas WHERE id = :tid");
        $qTer->bindParam(':tid', $terapeutica_id);
        $qTer->execute();
        $terRow = $qTer->fetch(PDO::FETCH_ASSOC);
        $terapeuta_id = $terRow ? intval($terRow['criado_por']) : $_SESSION['user_id'];

        $query = "INSERT INTO administracoes (terapeutica_id, data_hora, administrada, 
                  motivo_nao_administracao, observacoes, administrado_por, validada) 
                  VALUES (:terapeutica_id, :data_hora, :administrada, :motivo, 
                  :observacoes, :administrado_por, 0)";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':terapeutica_id', $terapeutica_id);
        $stmt->bindParam(':data_hora', $data_hora);
        $stmt->bindParam(':administrada', $administrada);
        $stmt->bindParam(':motivo', $motivo);
        $stmt->bindParam(':observacoes', $observacoes);
        $stmt->bindParam(':administrado_por', $terapeuta_id);

        if ($stmt->execute()) {
            $newId = $db->lastInsertId();

            // Se NÃO foi administrada, validar automaticamente
            if (!$administrada) {
                $auto = $db->prepare("UPDATE administracoes 
                                       SET validada = 1, validada_por = :uid, data_validacao = NOW()
                                       WHERE id = :id");
                $auto->bindParam(':uid', $_SESSION['user_id']);
                $auto->bindParam(':id', $newId);
                $auto->execute();
            }

            // If form submission, redirect back
            if (isset($_POST['terapeutica_id'])) {
                header('Location: ../app.html#administracoes?success=created');
                exit();
            }
            
            echo json_encode([
                'success' => true,
                'message' => 'Administração registada com sucesso',
                'id' => $newId
            ]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erro: ' . $e->getMessage()]);
    }
}

// PUT - Validar administração
else if ($method === 'PUT') {
    // Support both JSON and form data
    if (isset($_POST['id'])) {
        $id = $_POST['id'];
        $administrada = isset($_POST['administrada']) && $_POST['administrada'] == '1';
    } else {
        $data = json_decode(file_get_contents("php://input"));
        $id = $data->id;
        $administrada = $data->administrada ?? false;
    }

    try {
        $db->beginTransaction();

        // Atualizar administração
        $query = "UPDATE administracoes SET validada = 1, validada_por = :validada_por, 
                  data_validacao = NOW() WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':validada_por', $_SESSION['user_id']);
        $stmt->bindParam(':id', $id);
        $stmt->execute();

        $db->commit();

        // If form submission, redirect back
        if (isset($_POST['id'])) {
            header('Location: ../app.html#administracoes');
            exit();
        }

        echo json_encode(['success' => true, 'message' => 'Administração validada com sucesso']);
    } catch (PDOException $e) {
        $db->rollBack();
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erro: ' . $e->getMessage()]);
    }
}
?>
