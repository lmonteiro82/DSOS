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
$request_uri = $_SERVER['REQUEST_URI'];

// GET - Listar stocks
if ($method === 'GET') {
    try {
        $query = "SELECT role, lar_id FROM users WHERE id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $_SESSION['user_id']);
        $stmt->execute();
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        // Stock por utente
        if (strpos($request_uri, '/utente') !== false) {
            $utente_id = $_GET['utente_id'] ?? null;
            
            if (!$utente_id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'ID do utente não fornecido']);
                exit();
            }

            $query = "SELECT s.*, m.nome as medicamento_nome, m.dose, m.toma, 
                      u.nome as utente_nome
                      FROM stocks s
                      JOIN medicamentos m ON s.medicamento_id = m.id
                      JOIN utentes u ON s.utente_id = u.id
                      WHERE s.utente_id = :utente_id
                      ORDER BY m.nome";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':utente_id', $utente_id);
        }
        // Stock geral do lar - mostra quantidade em stock
        else if (strpos($request_uri, '/geral') !== false) {
            if ($user['role'] === 'admin_geral') {
                $query = "SELECT m.id as medicamento_id, m.nome as medicamento_nome, 
                          m.dose, m.toma, l.nome as lar_nome,
                          COALESCE(SUM(s.quantidade), 0) as quantidade_total
                          FROM medicamentos m
                          JOIN lares l ON m.lar_id = l.id
                          LEFT JOIN stocks s ON s.medicamento_id = m.id
                          WHERE m.ativo = 1
                          GROUP BY m.id, l.id
                          ORDER BY l.nome, m.nome";
                $stmt = $db->prepare($query);
            } else {
                $query = "SELECT m.id as medicamento_id, m.nome as medicamento_nome, 
                          m.dose, m.toma,
                          COALESCE(SUM(s.quantidade), 0) as quantidade_total
                          FROM medicamentos m
                          LEFT JOIN stocks s ON s.medicamento_id = m.id
                          WHERE m.ativo = 1 AND m.lar_id = :lar_id
                          GROUP BY m.id
                          ORDER BY m.nome";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':lar_id', $user['lar_id']);
            }
        }
        // Todos os stocks - conta administrações validadas por utente e medicamento
        else {
            if ($user['role'] === 'admin_geral') {
                $query = "SELECT u.id as utente_id, u.nome as utente_nome, 
                          m.id as medicamento_id, m.nome as medicamento_nome, m.dose, m.toma,
                          l.nome as lar_nome,
                          COUNT(CASE WHEN a.validada = 1 AND a.administrada = 1 THEN 1 END) as quantidade
                          FROM utentes u
                          CROSS JOIN medicamentos m
                          JOIN lares l ON u.lar_id = l.id
                          LEFT JOIN terapeuticas t ON t.utente_id = u.id AND t.medicamento_id = m.id
                          LEFT JOIN administracoes a ON a.terapeutica_id = t.id
                          WHERE u.ativo = 1 AND m.ativo = 1
                          GROUP BY u.id, m.id, l.id
                          ORDER BY l.nome, u.nome, m.nome";
                $stmt = $db->prepare($query);
            } else {
                $query = "SELECT u.id as utente_id, u.nome as utente_nome,
                          m.id as medicamento_id, m.nome as medicamento_nome, m.dose, m.toma,
                          COUNT(CASE WHEN a.validada = 1 AND a.administrada = 1 THEN 1 END) as quantidade
                          FROM utentes u
                          CROSS JOIN medicamentos m
                          LEFT JOIN terapeuticas t ON t.utente_id = u.id AND t.medicamento_id = m.id
                          LEFT JOIN administracoes a ON a.terapeutica_id = t.id
                          WHERE u.ativo = 1 AND m.ativo = 1 AND u.lar_id = :lar_id AND m.lar_id = :lar_id
                          GROUP BY u.id, m.id
                          ORDER BY u.nome, m.nome";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':lar_id', $user['lar_id']);
            }
        }

        $stmt->execute();
        $stocks = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['success' => true, 'data' => $stocks]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erro: ' . $e->getMessage()]);
    }
}

// POST - Criar/Adicionar stock
else if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    try {
        // Verificar se já existe stock para este medicamento e utente
        $query = "SELECT id, quantidade FROM stocks 
                  WHERE medicamento_id = :medicamento_id AND utente_id = :utente_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':medicamento_id', $data->medicamento_id);
        $stmt->bindParam(':utente_id', $data->utente_id);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            // Atualizar quantidade existente
            $stock = $stmt->fetch(PDO::FETCH_ASSOC);
            $nova_quantidade = $stock['quantidade'] + $data->quantidade;
            
            $query = "UPDATE stocks SET quantidade = :quantidade, lote = :lote, 
                      data_validade = :data_validade WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':quantidade', $nova_quantidade);
            $stmt->bindParam(':lote', $data->lote);
            $stmt->bindParam(':data_validade', $data->data_validade);
            $stmt->bindParam(':id', $stock['id']);
            $stmt->execute();
            
            echo json_encode(['success' => true, 'message' => 'Stock atualizado com sucesso']);
        } else {
            // Criar novo stock
            $query = "INSERT INTO stocks (medicamento_id, utente_id, quantidade, 
                      quantidade_minima, lote, data_validade) 
                      VALUES (:medicamento_id, :utente_id, :quantidade, :quantidade_minima, 
                      :lote, :data_validade)";
            
            $stmt = $db->prepare($query);
            $stmt->bindParam(':medicamento_id', $data->medicamento_id);
            $stmt->bindParam(':utente_id', $data->utente_id);
            $stmt->bindParam(':quantidade', $data->quantidade);
            $stmt->bindParam(':quantidade_minima', $data->quantidade_minima);
            $stmt->bindParam(':lote', $data->lote);
            $stmt->bindParam(':data_validade', $data->data_validade);

            if ($stmt->execute()) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Stock criado com sucesso',
                    'id' => $db->lastInsertId()
                ]);
            }
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erro: ' . $e->getMessage()]);
    }
}

// PUT - Atualizar stock
else if ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"));

    try {
        $query = "UPDATE stocks SET quantidade = :quantidade, quantidade_minima = :quantidade_minima, 
                  lote = :lote, data_validade = :data_validade WHERE id = :id";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':quantidade', $data->quantidade);
        $stmt->bindParam(':quantidade_minima', $data->quantidade_minima);
        $stmt->bindParam(':lote', $data->lote);
        $stmt->bindParam(':data_validade', $data->data_validade);
        $stmt->bindParam(':id', $data->id);

        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Stock atualizado com sucesso']);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erro: ' . $e->getMessage()]);
    }
}
?>
