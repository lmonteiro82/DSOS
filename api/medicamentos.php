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


# Handle _method override for forms
if ($method === 'POST' && isset($_POST['_method'])) {
    $method = $_POST['_method'];
}

// GET - Listar medicamentos
if ($method === 'GET') {
    try {
        $query = "SELECT role, lar_id FROM users WHERE id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $_SESSION['user_id']);
        $stmt->execute();
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user['role'] === 'admin_geral') {
            $query = "SELECT m.*, l.nome as lar_nome FROM medicamentos m 
                      JOIN lares l ON m.lar_id = l.id 
                      WHERE m.ativo = 1 ORDER BY m.nome";
            $stmt = $db->prepare($query);
        } else {
            $query = "SELECT m.*, l.nome as lar_nome FROM medicamentos m 
                      JOIN lares l ON m.lar_id = l.id 
                      WHERE m.lar_id = :lar_id AND m.ativo = 1 ORDER BY m.nome";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':lar_id', $user['lar_id']);
        }

        $stmt->execute();
        $medicamentos = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['success' => true, 'data' => $medicamentos]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erro: ' . $e->getMessage()]);
    }
}

// POST - Criar medicamento
else if ($method === 'POST') {
    // Verificar permissões - técnicos não podem criar medicamentos
    $query = "SELECT role FROM users WHERE id = :user_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $_SESSION['user_id']);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user['role'] === 'tecnico') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Sem permissões para criar medicamentos']);
        exit();
    }
    
    $data = json_decode(file_get_contents("php://input"));

    $minimo = isset($data->minimo) ? (int)$data->minimo : 0;

    if ($minimo < 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'O mínimo tem de ser um número igual ou superior a 0']);
        exit();
    }

    try {
        $sos = isset($data->sos) ? (int)$data->sos : 0;
        
        $query = "INSERT INTO medicamentos (nome, principio_ativo, marca, dose, toma, sos, minimo, lar_id) 
                  VALUES (:nome, :principio_ativo, :marca, :dose, :toma, :sos, :minimo, :lar_id)";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':nome', $data->nome);
        $stmt->bindParam(':principio_ativo', $data->principio_ativo);
        $stmt->bindParam(':marca', $data->marca);
        $stmt->bindParam(':dose', $data->dose);
        $stmt->bindParam(':toma', $data->toma);
        $stmt->bindValue(':sos', $sos, PDO::PARAM_INT);
        $stmt->bindValue(':minimo', $minimo, PDO::PARAM_INT);
        $stmt->bindParam(':lar_id', $data->lar_id);

        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'message' => 'Medicamento criado com sucesso',
                'id' => $db->lastInsertId()
            ]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erro: ' . $e->getMessage()]);
    }
}

// PUT - Atualizar medicamento
else if ($method === 'PUT') {
    // Verificar permissões - técnicos não podem editar medicamentos
    $query = "SELECT role FROM users WHERE id = :user_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $_SESSION['user_id']);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user['role'] === 'tecnico') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Sem permissões para editar medicamentos']);
        exit();
    }
    
    $data = json_decode(file_get_contents("php://input"));

    $minimo = isset($data->minimo) ? (int)$data->minimo : 0;

    if ($minimo < 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'O mínimo tem de ser um número igual ou superior a 0']);
        exit();
    }

    try {
        $sos = isset($data->sos) ? (int)$data->sos : 0;
        
        $query = "UPDATE medicamentos SET nome = :nome, principio_ativo = :principio_ativo, 
                  marca = :marca, dose = :dose, toma = :toma, sos = :sos, minimo = :minimo WHERE id = :id";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':nome', $data->nome);
        $stmt->bindParam(':principio_ativo', $data->principio_ativo);
        $stmt->bindParam(':marca', $data->marca);
        $stmt->bindParam(':dose', $data->dose);
        $stmt->bindParam(':toma', $data->toma);
        $stmt->bindValue(':sos', $sos, PDO::PARAM_INT);
        $stmt->bindValue(':minimo', $minimo, PDO::PARAM_INT);
        $stmt->bindParam(':id', $data->id);

        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Medicamento atualizado com sucesso']);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erro: ' . $e->getMessage()]);
    }
}

// DELETE - Desativar medicamento
else if ($method === 'DELETE') {
    // Verificar permissões - técnicos não podem eliminar medicamentos
    $query = "SELECT role FROM users WHERE id = :user_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $_SESSION['user_id']);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user['role'] === 'tecnico') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Sem permissões para eliminar medicamentos']);
        exit();
    }
    
    // Support both JSON and form data
    if (isset($_POST['id'])) {
        $id = $_POST['id'];
    } else {
        parse_str(file_get_contents("php://input"), $data);
        $id = $data['id'] ?? null;
    }
    
    try {
        $query = "UPDATE medicamentos SET ativo = 0 WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $id);

        if ($stmt->execute()) {
            // If form submission, redirect back
            if (isset($_POST['id'])) {
                header('Location: ../app.html#medicamentos');
                exit();
            }
            echo json_encode(['success' => true, 'message' => 'Medicamento desativado com sucesso']);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erro: ' . $e->getMessage()]);
    }
}
?>
