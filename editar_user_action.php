<?php
session_start();
require_once 'config/database.php';

if (!isset($_SESSION['user_id'])) {
    header('Location: login.html');
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: users.php');
    exit();
}

$database = new Database();
$db = $database->connect();

// Verificar permissões
$query = "SELECT role FROM users WHERE id = :user_id";
$stmt = $db->prepare($query);
$stmt->bindParam(':user_id', $_SESSION['user_id']);
$stmt->execute();
$currentUser = $stmt->fetch(PDO::FETCH_ASSOC);

if ($currentUser['role'] === 'tecnico') {
    $_SESSION['error'] = 'Sem permissões para editar utilizadores';
    header('Location: users.php');
    exit();
}

$id = intval($_POST['id']);
$nome = trim($_POST['nome']);
$email = trim($_POST['email']);
$password = $_POST['password'] ?? '';
$role = $_POST['role'];
$lar_id = intval($_POST['lar_id']);

// Validações
if (empty($nome) || empty($email) || empty($role) || empty($lar_id)) {
    $_SESSION['error'] = 'Preencha todos os campos obrigatórios';
    header('Location: users.php');
    exit();
}

if ($role === 'admin_geral') {
    $_SESSION['error'] = 'Não é possível alterar para administrador global';
    header('Location: users.php');
    exit();
}

if (!in_array($role, ['admin_lar', 'tecnico'])) {
    $_SESSION['error'] = 'Role inválido';
    header('Location: users.php');
    exit();
}

if (!empty($password) && strlen($password) < 6) {
    $_SESSION['error'] = 'A password deve ter no mínimo 6 caracteres';
    header('Location: users.php');
    exit();
}

try {
    // Verificar se não está a tentar editar admin_geral
    $query = "SELECT role FROM users WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $id);
    $stmt->execute();
    $userToEdit = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($userToEdit['role'] === 'admin_geral') {
        $_SESSION['error'] = 'Não é possível editar administradores globais';
        header('Location: users.php');
        exit();
    }

    // Atualizar utilizador
    if (!empty($password)) {
        $password_hash = password_hash($password, PASSWORD_DEFAULT);
        $query = "UPDATE users SET nome = :nome, email = :email, password = :password, 
                  role = :role, lar_id = :lar_id WHERE id = :id";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':password', $password_hash);
    } else {
        $query = "UPDATE users SET nome = :nome, email = :email, role = :role, 
                  lar_id = :lar_id WHERE id = :id";
        
        $stmt = $db->prepare($query);
    }
    
    $stmt->bindParam(':nome', $nome);
    $stmt->bindParam(':email', $email);
    $stmt->bindParam(':role', $role);
    $stmt->bindParam(':lar_id', $lar_id);
    $stmt->bindParam(':id', $id);

    if ($stmt->execute()) {
        $_SESSION['success'] = 'Utilizador atualizado com sucesso';
    } else {
        $_SESSION['error'] = 'Erro ao atualizar utilizador';
    }
} catch (PDOException $e) {
    $_SESSION['error'] = 'Erro: ' . $e->getMessage();
}

header('Location: users.php');
exit();
?>
