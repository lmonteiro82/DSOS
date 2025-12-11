<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers, Content-Type, Access-Control-Allow-Methods, Authorization, X-Requested-With');

require_once '../config/database.php';

$database = new Database();
$db = $database->connect();

$method = $_SERVER['REQUEST_METHOD'];
$request_uri = $_SERVER['REQUEST_URI'];
$action = $_GET['action'] ?? '';

// Login
if ($method === 'POST' && ($action === 'login' || strpos($request_uri, '/login') !== false)) {
    $raw_input = file_get_contents("php://input");
    $data = json_decode($raw_input);
    
    // Debug
    if ($data === null) {
        http_response_code(400);
        echo json_encode([
            'success' => false, 
            'message' => 'JSON inválido',
            'raw_input' => $raw_input,
            'json_error' => json_last_error_msg()
        ]);
        exit();
    }
    
    if (!isset($data->email) || !isset($data->password)) {
        http_response_code(400);
        echo json_encode([
            'success' => false, 
            'message' => 'Email e password são obrigatórios',
            'received' => $data
        ]);
        exit();
    }

    try {
        $query = "SELECT u.*, l.nome as lar_nome FROM users u 
                  LEFT JOIN lares l ON u.lar_id = l.id 
                  WHERE u.email = :email AND u.ativo = 1";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':email', $data->email);
        $stmt->execute();

        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user && password_verify($data->password, $user['password'])) {
            // Gerar token simples (em produção usar JWT)
            $token = bin2hex(random_bytes(32));
            
            // Guardar token na sessão ou base de dados
            session_start();
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['nome'] = $user['nome'];
            $_SESSION['token'] = $token;

            unset($user['password']);

            echo json_encode([
                'success' => true,
                'token' => $token,
                'user' => $user
            ]);
        } else {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Credenciais inválidas']);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erro ao fazer login: ' . $e->getMessage()]);
    }
}

// Register
else if ($method === 'POST' && ($action === 'register' || strpos($request_uri, '/register') !== false)) {
    session_start();
    
    // Verificar autenticação
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Não autorizado']);
        exit();
    }

    $data = json_decode(file_get_contents("php://input"));

    try {
        // Verificar se email já existe
        $query = "SELECT id FROM users WHERE email = :email";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':email', $data->email);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Email já registado']);
            exit();
        }

        // Criar utilizador
        $hashed_password = password_hash($data->password, PASSWORD_DEFAULT);
        
        $query = "INSERT INTO users (nome, email, password, role, lar_id) 
                  VALUES (:nome, :email, :password, :role, :lar_id)";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':nome', $data->nome);
        $stmt->bindParam(':email', $data->email);
        $stmt->bindParam(':password', $hashed_password);
        $stmt->bindParam(':role', $data->role);
        $stmt->bindParam(':lar_id', $data->lar_id);

        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'message' => 'Utilizador criado com sucesso',
                'id' => $db->lastInsertId()
            ]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erro ao criar utilizador: ' . $e->getMessage()]);
    }
}

// Get current user
else if ($method === 'GET' && ($action === 'me' || strpos($request_uri, '/me') !== false)) {
    session_start();
    
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Não autorizado']);
        exit();
    }

    try {
        $query = "SELECT u.*, l.nome as lar_nome FROM users u 
                  LEFT JOIN lares l ON u.lar_id = l.id 
                  WHERE u.id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $_SESSION['user_id']);
        $stmt->execute();

        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        unset($user['password']);

        echo json_encode(['success' => true, 'data' => $user]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erro: ' . $e->getMessage()]);
    }
}

// Logout
else if ($method === 'POST' && ($action === 'logout' || strpos($request_uri, '/logout') !== false)) {
    session_start();
    session_destroy();
    echo json_encode(['success' => true, 'message' => 'Logout efetuado com sucesso']);
}

else {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Endpoint não encontrado']);
}
?>
