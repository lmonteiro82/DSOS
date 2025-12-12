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
    $_SESSION['error'] = 'Sem permissões para criar utilizadores';
    header('Location: users.php');
    exit();
}

$nome = trim($_POST['nome']);
$email = trim($_POST['email']);
$password = $_POST['password'];
$role = $_POST['role'];
$lar_id = intval($_POST['lar_id']);

// Validações
if (empty($nome) || empty($email) || empty($password) || empty($role) || empty($lar_id)) {
    $_SESSION['error'] = 'Preencha todos os campos obrigatórios';
    header('Location: users.php');
    exit();
}

if ($role === 'admin_geral') {
    $_SESSION['error'] = 'Não é possível criar administradores globais';
    header('Location: users.php');
    exit();
}

if (!in_array($role, ['admin_lar', 'tecnico'])) {
    $_SESSION['error'] = 'Role inválido';
    header('Location: users.php');
    exit();
}

if (strlen($password) < 6) {
    $_SESSION['error'] = 'A password deve ter no mínimo 6 caracteres';
    header('Location: users.php');
    exit();
}

try {
    // Verificar se email já existe
    $query = "SELECT id FROM users WHERE email = :email";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':email', $email);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        $_SESSION['error'] = 'Email já existe';
        header('Location: users.php');
        exit();
    }

    // Hash da password
    $password_hash = password_hash($password, PASSWORD_DEFAULT);

    // Inserir utilizador
    $query = "INSERT INTO users (nome, email, password, role, lar_id) 
              VALUES (:nome, :email, :password, :role, :lar_id)";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':nome', $nome);
    $stmt->bindParam(':email', $email);
    $stmt->bindParam(':password', $password_hash);
    $stmt->bindParam(':role', $role);
    $stmt->bindParam(':lar_id', $lar_id);

    if ($stmt->execute()) {
        $_SESSION['success'] = 'Utilizador criado com sucesso';
    } else {
        $_SESSION['error'] = 'Erro ao criar utilizador';
    }
} catch (PDOException $e) {
    $_SESSION['error'] = 'Erro: ' . $e->getMessage();
}

header('Location: users.php');
exit();
?>
