<?php
session_start();
require_once 'config/database.php';

if (!isset($_SESSION['user_id'])) {
    header('Location: login.html');
    exit();
}

$database = new Database();
$db = $database->connect();

$tipo = $_GET['tipo'] ?? null;
$id = $_GET['id'] ?? null;

if (!$tipo || !$id) {
    header('Location: app.html');
    exit();
}

// Handle confirmation
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['confirmar'])) {
    try {
        switch ($tipo) {
            case 'utente':
                $query = "UPDATE utentes SET ativo = 0 WHERE id = :id";
                $redirect = 'utentes';
                $mensagem = 'Utente eliminado';
                break;
            case 'lar':
                $query = "UPDATE lares SET ativo = 0 WHERE id = :id";
                $redirect = 'lares';
                $mensagem = 'Lar eliminado';
                break;
            case 'medicamento':
                $query = "UPDATE medicamentos SET ativo = 0 WHERE id = :id";
                $redirect = 'medicamentos';
                $mensagem = 'Medicamento eliminado';
                break;
            case 'terapeutica':
                $query = "UPDATE terapeuticas SET ativo = 0 WHERE id = :id";
                $redirect = 'terapeuticas';
                $mensagem = 'Terapêutica eliminada';
                break;
            default:
                header('Location: app.html');
                exit();
        }
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        
        header("Location: app.html#$redirect?success=deleted");
        exit();
    } catch (Exception $e) {
        $erro = $e->getMessage();
    }
}

// Get item name for confirmation
$nome = '';
switch ($tipo) {
    case 'utente':
        $query = "SELECT nome FROM utentes WHERE id = :id";
        break;
    case 'lar':
        $query = "SELECT nome FROM lares WHERE id = :id";
        break;
    case 'medicamento':
        $query = "SELECT nome FROM medicamentos WHERE id = :id";
        break;
    case 'terapeutica':
        $query = "SELECT CONCAT(u.nome, ' - ', m.nome) as nome FROM terapeuticas t 
                  JOIN utentes u ON t.utente_id = u.id 
                  JOIN medicamentos m ON t.medicamento_id = m.id 
                  WHERE t.id = :id";
        break;
}

if (isset($query)) {
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $id);
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $nome = $result['nome'] ?? '';
}

$tipoLabel = [
    'utente' => 'utente',
    'lar' => 'lar',
    'medicamento' => 'medicamento',
    'terapeutica' => 'terapêutica'
][$tipo] ?? '';
?>
<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Eliminar <?= ucfirst($tipoLabel) ?></title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="auth-page">
        <div class="auth-container">
            <div class="auth-card">
                <div class="auth-header">
                    <h1>Eliminar <?= ucfirst($tipoLabel) ?></h1>
                </div>
                <?php if (isset($erro)): ?>
                    <div class="alert alert-error"><?= $erro ?></div>
                <?php endif; ?>
                <form method="POST">
                    <p style="font-size: 16px; color: var(--gray-700); margin-bottom: 20px;">
                        Tem a certeza que deseja eliminar <?= $tipoLabel ?>:<br>
                        <strong><?= htmlspecialchars($nome) ?></strong>
                    </p>
                    <div style="display: flex; gap: 10px;">
                        <a href="app.html#<?= $tipo ?>s" class="btn btn-outline" style="flex: 1; text-align: center; text-decoration: none;">Cancelar</a>
                        <button type="submit" name="confirmar" class="btn btn-danger" style="flex: 1;">Eliminar</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</body>
</html>
