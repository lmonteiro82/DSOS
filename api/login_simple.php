<?php
// Configuração básica
error_reporting(0);
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Se for OPTIONS request, retornar sucesso
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Processar apenas POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Método não permitido']);
    exit();
}

try {
    // Ler input
    $input = file_get_contents('php://input');
    $data = json_decode($input);
    
    // Validar dados
    if (!$data || !isset($data->email) || !isset($data->password)) {
        echo json_encode([
            'success' => false, 
            'message' => 'Email e password são obrigatórios',
            'debug' => [
                'input' => $input,
                'parsed' => $data
            ]
        ]);
        exit();
    }
    
    // Conectar à base de dados
    require_once '../config/database.php';
    $database = new Database();
    $db = $database->connect();
    
    // Buscar utilizador
    $query = "SELECT u.*, l.nome as lar_nome 
              FROM users u 
              LEFT JOIN lares l ON u.lar_id = l.id 
              WHERE u.email = :email AND u.ativo = 1";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':email', $data->email);
    $stmt->execute();
    
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Verificar password
    if ($user && password_verify($data->password, $user['password'])) {
        // Login bem-sucedido
        session_start();
        $_SESSION['user_id'] = $user['id'];
        
        // Remover password do retorno
        unset($user['password']);
        
        echo json_encode([
            'success' => true,
            'user' => $user,
            'message' => 'Login efetuado com sucesso'
        ]);
    } else {
        // Login falhado
        echo json_encode([
            'success' => false,
            'message' => 'Email ou password incorretos'
        ]);
    }
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Erro no servidor: ' . $e->getMessage()
    ]);
}
?>
