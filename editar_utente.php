<?php
session_start();
require_once 'config/database.php';

if (!isset($_SESSION['user_id'])) {
    header('Location: login.html');
    exit();
}

$database = new Database();
$db = $database->connect();

// Get utente ID
$id = $_GET['id'] ?? null;
if (!$id) {
    header('Location: app.html#utentes');
    exit();
}

// Fetch utente data
$query = "SELECT * FROM utentes WHERE id = :id";
$stmt = $db->prepare($query);
$stmt->bindParam(':id', $id);
$stmt->execute();
$utente = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$utente) {
    header('Location: app.html#utentes');
    exit();
}

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $nome = $_POST['nome'];
    $data_nascimento = $_POST['data_nascimento'];
    $contacto_nome = $_POST['contacto_nome'];
    $contacto_telefone = preg_replace('/[^0-9+\s]/', '', $_POST['contacto_telefone']);
    $contacto_relacao = $_POST['contacto_relacao'];
    $observacoes = $_POST['observacoes'];
    
    $query = "UPDATE utentes SET 
              nome = :nome,
              data_nascimento = :data_nascimento,
              contacto_emergencia_nome = :contacto_nome,
              contacto_emergencia_telefone = :contacto_telefone,
              contacto_emergencia_relacao = :contacto_relacao,
              observacoes = :observacoes
              WHERE id = :id";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':nome', $nome);
    $stmt->bindParam(':data_nascimento', $data_nascimento);
    $stmt->bindParam(':contacto_nome', $contacto_nome);
    $stmt->bindParam(':contacto_telefone', $contacto_telefone);
    $stmt->bindParam(':contacto_relacao', $contacto_relacao);
    $stmt->bindParam(':observacoes', $observacoes);
    $stmt->bindParam(':id', $id);
    
    if ($stmt->execute()) {
        header('Location: app.html#utentes?success=updated');
        exit();
    }
}
?>
<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Editar Utente</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="auth-page">
        <div class="auth-container" style="max-width: 600px;">
            <div class="auth-card">
                <div class="auth-header">
                    <h1>Editar Utente</h1>
                </div>
                <form method="POST" class="auth-form">
                    <div class="form-group">
                        <label>Nome *</label>
                        <input type="text" name="nome" value="<?= htmlspecialchars($utente['nome']) ?>" required>
                    </div>
                    <div class="form-group">
                        <label>Data de Nascimento *</label>
                        <input type="date" name="data_nascimento" value="<?= $utente['data_nascimento'] ?>" required>
                    </div>
                    <div class="form-group">
                        <label>Nome Contacto Emergência</label>
                        <input type="text" name="contacto_nome" value="<?= htmlspecialchars($utente['contacto_emergencia_nome'] ?? '') ?>">
                    </div>
                    <div class="form-group">
                        <label>Telefone</label>
                        <input type="tel" name="contacto_telefone" value="<?= htmlspecialchars($utente['contacto_emergencia_telefone'] ?? '') ?>" inputmode="numeric" pattern="[0-9+\s]*" maxlength="16">
                    </div>
                    <div class="form-group">
                        <label>Relação</label>
                        <input type="text" name="contacto_relacao" value="<?= htmlspecialchars($utente['contacto_emergencia_relacao'] ?? '') ?>">
                    </div>
                    <div class="form-group">
                        <label>Observações</label>
                        <textarea name="observacoes"><?= htmlspecialchars($utente['observacoes'] ?? '') ?></textarea>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <a href="app.html#utentes" class="btn btn-outline" style="flex: 1; text-align: center; text-decoration: none;">Cancelar</a>
                        <button type="submit" class="btn btn-primary" style="flex: 1;">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</body>
</html>
