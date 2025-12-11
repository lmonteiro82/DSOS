<?php
session_start();
require_once 'config/database.php';

if (!isset($_SESSION['user_id'])) {
    header('Location: login.html');
    exit();
}

$database = new Database();
$db = $database->connect();

// Get user info
$query = "SELECT role, lar_id FROM users WHERE id = :user_id";
$stmt = $db->prepare($query);
$stmt->bindParam(':user_id', $_SESSION['user_id']);
$stmt->execute();
$user = $stmt->fetch(PDO::FETCH_ASSOC);

// Get terapeuticas
if ($user['role'] === 'admin_geral') {
    $query = "SELECT t.*, u.nome as utente_nome, m.nome as medicamento_nome, m.dose,
              CASE t.tipo 
                  WHEN 'continua' THEN 'Contínua'
                  WHEN 'temporaria' THEN 'Temporária'
                  WHEN 'sos' THEN 'SOS'
              END as tipo_label
              FROM terapeuticas t
              JOIN utentes u ON t.utente_id = u.id
              JOIN medicamentos m ON t.medicamento_id = m.id
              WHERE t.ativo = 1
              ORDER BY u.nome, m.nome";
    $stmt = $db->prepare($query);
} else {
    $query = "SELECT t.*, u.nome as utente_nome, m.nome as medicamento_nome, m.dose,
              CASE t.tipo 
                  WHEN 'continua' THEN 'Contínua'
                  WHEN 'temporaria' THEN 'Temporária'
                  WHEN 'sos' THEN 'SOS'
              END as tipo_label
              FROM terapeuticas t
              JOIN utentes u ON t.utente_id = u.id
              JOIN medicamentos m ON t.medicamento_id = m.id
              WHERE t.ativo = 1 AND u.lar_id = :lar_id
              ORDER BY u.nome, m.nome";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':lar_id', $user['lar_id']);
}
$stmt->execute();
$terapeuticas = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $terapeutica_id = $_POST['terapeutica_id'];
    $data_hora = $_POST['data_hora'];
    $administrada = $_POST['administrada'] == '1' ? 1 : 0;
    $motivo = $administrada ? null : $_POST['motivo_nao_administracao'];
    $observacoes = $_POST['observacoes'];
    
    try {
        // Obter terapeuta (criador da terapêutica) para registar como administrado_por
        $qTer = $db->prepare("SELECT criado_por FROM terapeuticas WHERE id = :tid");
        $qTer->bindParam(':tid', $terapeutica_id);
        $qTer->execute();
        $terRow = $qTer->fetch(PDO::FETCH_ASSOC);
        $terapeuta_id = $terRow ? intval($terRow['criado_por']) : $_SESSION['user_id'];

        $query = "INSERT INTO administracoes (terapeutica_id, data_hora, administrada, 
                  motivo_nao_administracao, observacoes, administrado_por, validada) 
                  VALUES (:terapeutica_id, :data_hora, :administrada, :motivo, :observacoes, :admin_por, 0)";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':terapeutica_id', $terapeutica_id);
        $stmt->bindParam(':data_hora', $data_hora);
        $stmt->bindParam(':administrada', $administrada);
        $stmt->bindParam(':motivo', $motivo);
        $stmt->bindParam(':observacoes', $observacoes);
        $stmt->bindParam(':admin_por', $terapeuta_id);
        
        if ($stmt->execute()) {
            // Se não administrada, validar automaticamente
            if ($administrada === 0) {
                $newId = $db->lastInsertId();
                $auto = $db->prepare("UPDATE administracoes 
                                       SET validada = 1, validada_por = :uid, data_validacao = NOW() 
                                       WHERE id = :id");
                $auto->bindParam(':uid', $_SESSION['user_id']);
                $auto->bindParam(':id', $newId);
                $auto->execute();
            }

            header('Location: app.html#administracoes?success=created');
            exit();
        }
    } catch (PDOException $e) {
        $erro = $e->getMessage();
    }
}

// Get current datetime for default value
$now = date('Y-m-d\TH:i');
?>
<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Registar Administração</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="auth-page">
        <div class="auth-container" style="max-width: 600px;">
            <div class="auth-card">
                <div class="auth-header">
                    <h1>Registar Administração</h1>
                </div>
                <?php if (isset($erro)): ?>
                    <div class="alert alert-error"><?= $erro ?></div>
                <?php endif; ?>
                <form method="POST" class="auth-form">
                    <div class="form-group">
                        <label>Terapêutica *</label>
                        <select name="terapeutica_id" required>
                            <option value="">Selecione...</option>
                            <?php foreach ($terapeuticas as $t): ?>
                                <option value="<?= $t['id'] ?>">
                                    <?= htmlspecialchars($t['utente_nome']) ?> - 
                                    <?= htmlspecialchars($t['medicamento_nome']) ?> 
                                    (<?= $t['tipo_label'] ?>)
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Data e Hora *</label>
                        <input type="datetime-local" name="data_hora" value="<?= $now ?>" required>
                    </div>
                    <div class="form-group">
                        <label>Administrada *</label>
                        <select name="administrada" id="administrada" required onchange="toggleMotivo()">
                            <option value="1">Sim</option>
                            <option value="0">Não</option>
                        </select>
                    </div>
                    <div class="form-group" id="motivoGroup" style="display: none;">
                        <label>Motivo Não Administração *</label>
                        <textarea name="motivo_nao_administracao" id="motivo"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Observações</label>
                        <textarea name="observacoes"></textarea>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <a href="app.html#administracoes" class="btn btn-outline" style="flex: 1; text-align: center; text-decoration: none;">Cancelar</a>
                        <button type="submit" class="btn btn-primary" style="flex: 1;">Registar</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
    <script>
        function toggleMotivo() {
            const administrada = document.getElementById('administrada').value;
            const motivoGroup = document.getElementById('motivoGroup');
            const motivo = document.getElementById('motivo');
            
            if (administrada === '0') {
                motivoGroup.style.display = 'block';
                motivo.required = true;
            } else {
                motivoGroup.style.display = 'none';
                motivo.required = false;
            }
        }
    </script>
</body>
</html>
