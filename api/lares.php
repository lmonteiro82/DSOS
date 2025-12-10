<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers, Content-Type, Access-Control-Allow-Methods, Authorization, X-Requested-With');

require_once '../config/database.php';

session_start();

// Verificar autenticação
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Não autorizado']);
    exit();
}

$database = new Database();
$db = $database->connect();

$method = $_SERVER['REQUEST_METHOD'];
$request_uri = $_SERVER['REQUEST_URI'];

// GET - Listar lares
if ($method === 'GET') {
    try {
        // Obter dados do utilizador
        $query = "SELECT role, lar_id FROM users WHERE id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $_SESSION['user_id']);
        $stmt->execute();
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user['role'] === 'admin_geral') {
            $query = "SELECT * FROM lares WHERE ativo = 1 ORDER BY nome";
            $stmt = $db->prepare($query);
        } else {
            $query = "SELECT * FROM lares WHERE id = :lar_id AND ativo = 1";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':lar_id', $user['lar_id']);
        }

        $stmt->execute();
        $lares = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['success' => true, 'data' => $lares]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erro: ' . $e->getMessage()]);
    }
}

// POST - Criar lar
else if ($method === 'POST') {
    // Verificar se é admin geral
    $query = "SELECT role FROM users WHERE id = :user_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $_SESSION['user_id']);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user['role'] !== 'admin_geral') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Sem permissões']);
        exit();
    }

    $data = json_decode(file_get_contents("php://input"));

    try {
        $query = "INSERT INTO lares (nome, morada, telefone, email, capacidade) 
                  VALUES (:nome, :morada, :telefone, :email, :capacidade)";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':nome', $data->nome);
        $stmt->bindParam(':morada', $data->morada);
        $stmt->bindParam(':telefone', $data->telefone);
        $stmt->bindParam(':email', $data->email);
        $stmt->bindParam(':capacidade', $data->capacidade);

        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'message' => 'Lar criado com sucesso',
                'id' => $db->lastInsertId()
            ]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erro: ' . $e->getMessage()]);
    }
}

// PUT - Atualizar lar
else if ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"));

    try {
        $query = "UPDATE lares SET nome = :nome, morada = :morada, telefone = :telefone, 
                  email = :email, capacidade = :capacidade WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':nome', $data->nome);
        $stmt->bindParam(':morada', $data->morada);
        $stmt->bindParam(':telefone', $data->telefone);
        $stmt->bindParam(':email', $data->email);
        $stmt->bindParam(':capacidade', $data->capacidade);
        $stmt->bindParam(':id', $data->id);

        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Lar atualizado com sucesso']);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erro: ' . $e->getMessage()]);
    }
}

// DELETE - Desativar lar
else if ($method === 'DELETE') {
    parse_str(file_get_contents("php://input"), $data);
    
    try {
        $query = "UPDATE lares SET ativo = 0 WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $data['id']);

        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Lar desativado com sucesso']);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erro: ' . $e->getMessage()]);
    }
}
?>
