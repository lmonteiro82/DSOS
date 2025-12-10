<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
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

// GET - Listar terapêuticas
if ($method === 'GET') {
    try {
        $query = "SELECT role, lar_id FROM users WHERE id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $_SESSION['user_id']);
        $stmt->execute();
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user['role'] === 'admin_geral') {
            $query = "SELECT t.*, u.nome as utente_nome, m.nome as medicamento_nome, 
                      m.dose, m.toma, l.nome as lar_nome, us.nome as criado_por_nome
                      FROM terapeuticas t
                      JOIN utentes u ON t.utente_id = u.id
                      JOIN medicamentos m ON t.medicamento_id = m.id
                      JOIN lares l ON u.lar_id = l.id
                      JOIN users us ON t.criado_por = us.id
                      WHERE t.ativo = 1 ORDER BY t.created_at DESC";
            $stmt = $db->prepare($query);
        } else {
            $query = "SELECT t.*, u.nome as utente_nome, m.nome as medicamento_nome, 
                      m.dose, m.toma, l.nome as lar_nome, us.nome as criado_por_nome
                      FROM terapeuticas t
                      JOIN utentes u ON t.utente_id = u.id
                      JOIN medicamentos m ON t.medicamento_id = m.id
                      JOIN lares l ON u.lar_id = l.id
                      JOIN users us ON t.criado_por = us.id
                      WHERE u.lar_id = :lar_id AND t.ativo = 1 ORDER BY t.created_at DESC";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':lar_id', $user['lar_id']);
        }

        $stmt->execute();
        $terapeuticas = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Obter horários para cada terapêutica
        foreach ($terapeuticas as &$terapeutica) {
            $query = "SELECT * FROM terapeutica_horarios WHERE terapeutica_id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $terapeutica['id']);
            $stmt->execute();
            $terapeutica['horarios'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }

        echo json_encode(['success' => true, 'data' => $terapeuticas]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erro: ' . $e->getMessage()]);
    }
}

// POST - Criar terapêutica
else if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    try {
        $db->beginTransaction();

        $query = "INSERT INTO terapeuticas (utente_id, medicamento_id, tipo, data_inicio, 
                  data_fim, observacoes, criado_por) 
                  VALUES (:utente_id, :medicamento_id, :tipo, :data_inicio, :data_fim, 
                  :observacoes, :criado_por)";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':utente_id', $data->utente_id);
        $stmt->bindParam(':medicamento_id', $data->medicamento_id);
        $stmt->bindParam(':tipo', $data->tipo);
        $stmt->bindParam(':data_inicio', $data->data_inicio);
        $stmt->bindParam(':data_fim', $data->data_fim);
        $stmt->bindParam(':observacoes', $data->observacoes);
        $stmt->bindParam(':criado_por', $_SESSION['user_id']);

        $stmt->execute();
        $terapeutica_id = $db->lastInsertId();

        // Inserir horários (se não for SOS)
        if ($data->tipo !== 'sos' && isset($data->horarios)) {
            foreach ($data->horarios as $horario) {
                $query = "INSERT INTO terapeutica_horarios (terapeutica_id, hora, dias_semana) 
                          VALUES (:terapeutica_id, :hora, :dias_semana)";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':terapeutica_id', $terapeutica_id);
                $stmt->bindParam(':hora', $horario->hora);
                $dias_json = json_encode($horario->dias_semana);
                $stmt->bindParam(':dias_semana', $dias_json);
                $stmt->execute();
            }
        }

        $db->commit();

        echo json_encode([
            'success' => true,
            'message' => 'Terapêutica criada com sucesso',
            'id' => $terapeutica_id
        ]);
    } catch (PDOException $e) {
        $db->rollBack();
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erro: ' . $e->getMessage()]);
    }
}

// PUT - Atualizar terapêutica
else if ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"));

    try {
        $query = "UPDATE terapeuticas SET data_fim = :data_fim, observacoes = :observacoes, 
                  ativo = :ativo WHERE id = :id";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':data_fim', $data->data_fim);
        $stmt->bindParam(':observacoes', $data->observacoes);
        $stmt->bindParam(':ativo', $data->ativo);
        $stmt->bindParam(':id', $data->id);

        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Terapêutica atualizada com sucesso']);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erro: ' . $e->getMessage()]);
    }
}

// DELETE - Desativar terapêutica
else if ($method === 'DELETE') {
    parse_str(file_get_contents("php://input"), $data);
    
    try {
        $query = "UPDATE terapeuticas SET ativo = 0 WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $data['id']);

        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Terapêutica desativada com sucesso']);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erro: ' . $e->getMessage()]);
    }
}
?>
