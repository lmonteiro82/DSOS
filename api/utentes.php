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

// Handle _method override for forms
if ($method === 'POST' && isset($_POST['_method'])) {
    $method = $_POST['_method'];
}

// GET - Listar utentes
if ($method === 'GET') {
    try {
        $query = "SELECT role, lar_id FROM users WHERE id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $_SESSION['user_id']);
        $stmt->execute();
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user['role'] === 'admin_geral') {
            $query = "SELECT u.*, l.nome as lar_nome FROM utentes u 
                      JOIN lares l ON u.lar_id = l.id 
                      WHERE u.ativo = 1 ORDER BY u.nome";
            $stmt = $db->prepare($query);
        } else {
            $query = "SELECT u.*, l.nome as lar_nome FROM utentes u 
                      JOIN lares l ON u.lar_id = l.id 
                      WHERE u.lar_id = :lar_id AND u.ativo = 1 ORDER BY u.nome";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':lar_id', $user['lar_id']);
        }

        $stmt->execute();
        $utentes = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['success' => true, 'data' => $utentes]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erro: ' . $e->getMessage()]);
    }
}

// POST - Criar utente
else if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    // Sanitize emergency contact phone
    if (isset($data->contacto_emergencia_telefone)) {
        $data->contacto_emergencia_telefone = preg_replace('/[^0-9+\s]/', '', $data->contacto_emergencia_telefone);
        $data->contacto_emergencia_telefone = substr($data->contacto_emergencia_telefone, 0, 16);
    }

    try {
        // Verificar se número de utente já existe
        $query = "SELECT id FROM utentes WHERE numero_utente = :numero_utente";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':numero_utente', $data->numero_utente);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Número de utente já existe']);
            exit();
        }

        $query = "INSERT INTO utentes (nome, data_nascimento, numero_utente, lar_id, 
                  contacto_emergencia_nome, contacto_emergencia_telefone, 
                  contacto_emergencia_relacao, observacoes) 
                  VALUES (:nome, :data_nascimento, :numero_utente, :lar_id, 
                  :contacto_nome, :contacto_telefone, :contacto_relacao, :observacoes)";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':nome', $data->nome);
        $stmt->bindParam(':data_nascimento', $data->data_nascimento);
        $stmt->bindParam(':numero_utente', $data->numero_utente);
        $stmt->bindParam(':lar_id', $data->lar_id);
        $stmt->bindParam(':contacto_nome', $data->contacto_emergencia_nome);
        $stmt->bindParam(':contacto_telefone', $data->contacto_emergencia_telefone);
        $stmt->bindParam(':contacto_relacao', $data->contacto_emergencia_relacao);
        $stmt->bindParam(':observacoes', $data->observacoes);

        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'message' => 'Utente criado com sucesso',
                'id' => $db->lastInsertId()
            ]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erro: ' . $e->getMessage()]);
    }
}

// PUT - Atualizar utente
else if ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"));
    // Sanitize emergency contact phone
    if (isset($data->contacto_emergencia_telefone)) {
        $data->contacto_emergencia_telefone = preg_replace('/[^0-9+\s]/', '', $data->contacto_emergencia_telefone);
        $data->contacto_emergencia_telefone = substr($data->contacto_emergencia_telefone, 0, 16);
    }

    try {
        $query = "UPDATE utentes SET nome = :nome, data_nascimento = :data_nascimento, 
                  contacto_emergencia_nome = :contacto_nome, 
                  contacto_emergencia_telefone = :contacto_telefone, 
                  contacto_emergencia_relacao = :contacto_relacao, 
                  observacoes = :observacoes WHERE id = :id";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':nome', $data->nome);
        $stmt->bindParam(':data_nascimento', $data->data_nascimento);
        $stmt->bindParam(':contacto_nome', $data->contacto_emergencia_nome);
        $stmt->bindParam(':contacto_telefone', $data->contacto_emergencia_telefone);
        $stmt->bindParam(':contacto_relacao', $data->contacto_emergencia_relacao);
        $stmt->bindParam(':observacoes', $data->observacoes);
        $stmt->bindParam(':id', $data->id);

        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Utente atualizado com sucesso']);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erro: ' . $e->getMessage()]);
    }
}

// DELETE - Desativar utente
else if ($method === 'DELETE') {
    // Support both JSON and form data
    if (isset($_POST['id'])) {
        $id = $_POST['id'];
    } else {
        parse_str(file_get_contents("php://input"), $data);
        $id = $data['id'] ?? null;
    }
    
    try {
        $query = "UPDATE utentes SET ativo = 0 WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $id);

        if ($stmt->execute()) {
            // Remover administrações associadas às terapêuticas do utente
            $delAdm = $db->prepare("DELETE a FROM administracoes a JOIN terapeuticas t ON a.terapeutica_id = t.id WHERE t.utente_id = :id");
            $delAdm->bindParam(':id', $id);
            $delAdm->execute();

            // Remover terapêuticas do utente (horários são apagados por cascade)
            $delTer = $db->prepare("DELETE FROM terapeuticas WHERE utente_id = :id");
            $delTer->bindParam(':id', $id);
            $delTer->execute();

            // Remover todos os stocks associados ao utente
            $del = $db->prepare("DELETE FROM stocks WHERE utente_id = :id");
            $del->bindParam(':id', $id);
            $del->execute();

            // If form submission, redirect back
            if (isset($_POST['id'])) {
                header('Location: ../app.html#utentes');
                exit();
            }
            echo json_encode(['success' => true, 'message' => 'Utente desativado com sucesso e dados associados (terapêuticas, administrações, stocks) removidos']);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erro: ' . $e->getMessage()]);
    }
}
?>
