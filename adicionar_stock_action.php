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
$utente_id = intval($_POST['utente_id']);
$quantidade = intval($_POST['quantidade']);
$lote = $_POST['lote'] ?? null;

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

    // Validar utente
    $query = "SELECT id FROM utentes WHERE id = :utente_id AND ativo = 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':utente_id', $utente_id);
    $stmt->execute();
    $utente = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$utente) {
        throw new Exception('Utente inválido');
    }

    // Check if stock already exists para este utente
    $query = "SELECT id FROM stocks WHERE medicamento_id = :medicamento_id AND utente_id = :utente_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':medicamento_id', $medicamento_id);
    $stmt->bindParam(':utente_id', $utente_id);
    $stmt->execute();
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        // Update existing stock - add quantity
        $query = "UPDATE stocks SET quantidade = quantidade + :quantidade, 
                  lote = :lote, updated_at = NOW()
                  WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':quantidade', $quantidade);
        $stmt->bindParam(':lote', $lote);
        $stmt->bindParam(':id', $existing['id']);
        $stmt->execute();
    } else {
        // Create new stock
        $query = "INSERT INTO stocks (medicamento_id, utente_id, quantidade, quantidade_minima, lote) 
                  VALUES (:medicamento_id, :utente_id, :quantidade, 10, :lote)";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':medicamento_id', $medicamento_id);
        $stmt->bindParam(':utente_id', $utente_id);
        $stmt->bindParam(':quantidade', $quantidade);
        $stmt->bindParam(':lote', $lote);
        $stmt->execute();
    }

    header('Location: stocks.php?success=added');
    exit();
    
} catch (Exception $e) {
    header('Location: stocks.php?error=' . urlencode($e->getMessage()));
    exit();
}
?>
