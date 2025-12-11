<?php
session_start();
require_once 'config/database.php';

if (!isset($_SESSION['user_id'])) {
    header('Location: login.html');
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: stocks.php');
    exit();
}

$database = new Database();
$db = $database->connect();

$medicamento_nome = $_POST['medicamento_nome'];
$quantidade = $_POST['quantidade'];
$lote = $_POST['lote'] ?? null;
$data_validade = $_POST['data_validade'];

try {
    // Get medicamento
    $query = "SELECT id, lar_id FROM medicamentos WHERE nome = :nome AND ativo = 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':nome', $medicamento_nome);
    $stmt->execute();
    $medicamento = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$medicamento) {
        throw new Exception('Medicamento não encontrado');
    }
    
    $medicamento_id = $medicamento['id'];
    $lar_id = $medicamento['lar_id'];
    
    // Get all utentes from the same lar
    $query = "SELECT id FROM utentes WHERE lar_id = :lar_id AND ativo = 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':lar_id', $lar_id);
    $stmt->execute();
    $utentes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($utentes)) {
        throw new Exception('Nenhum utente encontrado neste lar');
    }
    
    // Add stock to all utentes
    $updated = 0;
    foreach ($utentes as $utente) {
        $utente_id = $utente['id'];
        
        // Check if stock already exists
        $query = "SELECT id FROM stocks WHERE medicamento_id = :medicamento_id AND utente_id = :utente_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':medicamento_id', $medicamento_id);
        $stmt->bindParam(':utente_id', $utente_id);
        $stmt->execute();
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existing) {
            // Update existing stock - add quantity
            $query = "UPDATE stocks SET quantidade = quantidade + :quantidade, 
                      lote = :lote, data_validade = :data_validade, updated_at = NOW()
                      WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':quantidade', $quantidade);
            $stmt->bindParam(':lote', $lote);
            $stmt->bindParam(':data_validade', $data_validade);
            $stmt->bindParam(':id', $existing['id']);
            $stmt->execute();
        } else {
            // Create new stock
            $query = "INSERT INTO stocks (medicamento_id, utente_id, quantidade, quantidade_minima, lote, data_validade) 
                      VALUES (:medicamento_id, :utente_id, :quantidade, 10, :lote, :data_validade)";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':medicamento_id', $medicamento_id);
            $stmt->bindParam(':utente_id', $utente_id);
            $stmt->bindParam(':quantidade', $quantidade);
            $stmt->bindParam(':lote', $lote);
            $stmt->bindParam(':data_validade', $data_validade);
            $stmt->execute();
        }
        $updated++;
    }
    
    header('Location: stocks.php?success=added&count=' . $updated);
    exit();
    
} catch (Exception $e) {
    header('Location: stocks.php?error=' . urlencode($e->getMessage()));
    exit();
}
?>
