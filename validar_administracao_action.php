<?php
session_start();
require_once 'config/database.php';

if (!isset($_SESSION['user_id'])) {
    header('Location: login.html');
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: administracoes.php');
    exit();
}

$database = new Database();
$db = $database->connect();

$id = intval($_POST['id']);

if (empty($id)) {
    $_SESSION['error'] = 'ID de administração inválido';
    header('Location: administracoes.php');
    exit();
}

try {
    // Validar a administração
    $query = "UPDATE administracoes 
              SET validada = 1, validada_por = :user_id, data_validacao = NOW() 
              WHERE id = :id";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $_SESSION['user_id']);
    $stmt->bindParam(':id', $id);

    if ($stmt->execute()) {
        $_SESSION['success'] = 'Administração validada com sucesso';
    } else {
        $_SESSION['error'] = 'Erro ao validar administração';
    }
} catch (PDOException $e) {
    $_SESSION['error'] = 'Erro: ' . $e->getMessage();
}

header('Location: administracoes.php');
exit();
?>
