<?php
session_start();
require_once 'config/database.php';

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin_geral') {
    header('Location: login.html');
    exit();
}

$database = new Database();
$db = $database->connect();

$id = $_GET['id'] ?? null;
if (!$id) {
    header('Location: app.html#lares');
    exit();
}

$query = "SELECT * FROM lares WHERE id = :id";
$stmt = $db->prepare($query);
$stmt->bindParam(':id', $id);
$stmt->execute();
$lar = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$lar) {
    header('Location: app.html#lares');
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $nome = $_POST['nome'];
    $morada = $_POST['morada'];
    $telefone = preg_replace('/[^0-9+\s]/', '', $_POST['telefone']);
    $email = $_POST['email'];
    $capacidade = $_POST['capacidade'];
    
    $query = "UPDATE lares SET nome = :nome, morada = :morada, telefone = :telefone, 
              email = :email, capacidade = :capacidade WHERE id = :id";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':nome', $nome);
    $stmt->bindParam(':morada', $morada);
    $stmt->bindParam(':telefone', $telefone);
    $stmt->bindParam(':email', $email);
    $stmt->bindParam(':capacidade', $capacidade);
    $stmt->bindParam(':id', $id);
    
    if ($stmt->execute()) {
        header('Location: app.html#lares?success=updated');
        exit();
    }
}
?>
<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Editar Lar</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="auth-page">
        <div class="auth-container">
            <div class="auth-card">
                <div class="auth-header">
                    <h1>Editar Lar</h1>
                </div>
                <form method="POST" class="auth-form">
                    <div class="form-group">
                        <label>Nome *</label>
                        <input type="text" name="nome" value="<?= htmlspecialchars($lar['nome']) ?>" required>
                    </div>
                    <div class="form-group">
                        <label>Morada *</label>
                        <input type="text" name="morada" value="<?= htmlspecialchars($lar['morada']) ?>" required>
                    </div>
                    <div class="form-group">
                        <label>Telefone *</label>
                        <input type="tel" name="telefone" value="<?= htmlspecialchars($lar['telefone']) ?>" required inputmode="numeric" pattern="[0-9+\s]*" maxlength="16">
                    </div>
                    <div class="form-group">
                        <label>Email *</label>
                        <input type="email" name="email" value="<?= htmlspecialchars($lar['email']) ?>" required>
                    </div>
                    <div class="form-group">
                        <label>Capacidade *</label>
                        <input type="number" name="capacidade" value="<?= $lar['capacidade'] ?>" required min="1">
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <a href="app.html#lares" class="btn btn-outline" style="flex: 1; text-align: center; text-decoration: none;">Cancelar</a>
                        <button type="submit" class="btn btn-primary" style="flex: 1;">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</body>
</html>
