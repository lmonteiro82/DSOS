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

// GET - Listar utilizadores
if ($method === 'GET') {
    try {
        // Verificar permissões - apenas admins podem listar utilizadores
        $query = "SELECT role, lar_id FROM users WHERE id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $_SESSION['user_id']);
        $stmt->execute();
        $currentUser = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($currentUser['role'] === 'tecnico') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Sem permissões para listar utilizadores']);
            exit();
        }

        if ($currentUser['role'] === 'admin_geral') {
            $query = "SELECT u.id, u.nome, u.email, u.role, u.lar_id, u.ativo, 
                      l.nome as lar_nome, u.created_at 
                      FROM users u 
                      LEFT JOIN lares l ON u.lar_id = l.id 
                      WHERE u.ativo = 1 
                      ORDER BY u.created_at DESC";
            $stmt = $db->prepare($query);
        } else {
            // Admin de lar só vê utilizadores do seu lar
            $query = "SELECT u.id, u.nome, u.email, u.role, u.lar_id, u.ativo, 
                      l.nome as lar_nome, u.created_at 
                      FROM users u 
                      LEFT JOIN lares l ON u.lar_id = l.id 
                      WHERE u.lar_id = :lar_id AND u.ativo = 1 
                      ORDER BY u.created_at DESC";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':lar_id', $currentUser['lar_id']);
        }

        $stmt->execute();
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['success' => true, 'data' => $users]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erro: ' . $e->getMessage()]);
    }
}

// POST - Criar utilizador
else if ($method === 'POST') {
    // Verificar permissões - técnicos não podem criar utilizadores
    $query = "SELECT role, lar_id FROM users WHERE id = :user_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $_SESSION['user_id']);
    $stmt->execute();
    $currentUser = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($currentUser['role'] === 'tecnico') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Sem permissões para criar utilizadores']);
        exit();
    }
    
    $data = json_decode(file_get_contents("php://input"));

    // IMPORTANTE: Não permitir criação de admin_geral
    if ($data->role === 'admin_geral') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Não é possível criar administradores globais']);
        exit();
    }

    // Validar que o role é válido
    if (!in_array($data->role, ['admin_lar', 'tecnico'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Role inválido']);
        exit();
    }

    try {
        // Verificar se email já existe
        $query = "SELECT id FROM users WHERE email = :email";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':email', $data->email);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Email já existe']);
            exit();
        }

        // Hash da password
        $password_hash = password_hash($data->password, PASSWORD_DEFAULT);

        $query = "INSERT INTO users (nome, email, password, role, lar_id) 
                  VALUES (:nome, :email, :password, :role, :lar_id)";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':nome', $data->nome);
        $stmt->bindParam(':email', $data->email);
        $stmt->bindParam(':password', $password_hash);
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
        echo json_encode(['success' => false, 'message' => 'Erro: ' . $e->getMessage()]);
    }
}

// PUT - Atualizar utilizador
else if ($method === 'PUT') {
    // Verificar permissões - técnicos não podem editar utilizadores
    $query = "SELECT role, lar_id FROM users WHERE id = :user_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $_SESSION['user_id']);
    $stmt->execute();
    $currentUser = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($currentUser['role'] === 'tecnico') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Sem permissões para editar utilizadores']);
        exit();
    }
    
    $data = json_decode(file_get_contents("php://input"));

    // IMPORTANTE: Não permitir alteração para admin_geral
    if (isset($data->role) && $data->role === 'admin_geral') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Não é possível alterar para administrador global']);
        exit();
    }

    try {
        // Se houver password, atualizar também
        if (isset($data->password) && !empty($data->password)) {
            $password_hash = password_hash($data->password, PASSWORD_DEFAULT);
            $query = "UPDATE users SET nome = :nome, email = :email, password = :password, 
                      role = :role, lar_id = :lar_id WHERE id = :id";
            
            $stmt = $db->prepare($query);
            $stmt->bindParam(':password', $password_hash);
        } else {
            $query = "UPDATE users SET nome = :nome, email = :email, role = :role, 
                      lar_id = :lar_id WHERE id = :id";
            
            $stmt = $db->prepare($query);
        }
        
        $stmt->bindParam(':nome', $data->nome);
        $stmt->bindParam(':email', $data->email);
        $stmt->bindParam(':role', $data->role);
        $stmt->bindParam(':lar_id', $data->lar_id);
        $stmt->bindParam(':id', $data->id);

        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Utilizador atualizado com sucesso']);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erro: ' . $e->getMessage()]);
    }
}

// DELETE - Desativar utilizador
else if ($method === 'DELETE') {
    // Verificar permissões - técnicos não podem eliminar utilizadores
    $query = "SELECT role, lar_id FROM users WHERE id = :user_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $_SESSION['user_id']);
    $stmt->execute();
    $currentUser = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($currentUser['role'] === 'tecnico') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Sem permissões para eliminar utilizadores']);
        exit();
    }
    
    $data = json_decode(file_get_contents("php://input"));
    
    try {
        // Não permitir eliminar admin_geral
        $query = "SELECT role FROM users WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $data->id);
        $stmt->execute();
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user['role'] === 'admin_geral') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Não é possível eliminar administradores globais']);
            exit();
        }
        
        $query = "UPDATE users SET ativo = 0 WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $data->id);

        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Utilizador desativado com sucesso']);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erro: ' . $e->getMessage()]);
    }
}
?>
