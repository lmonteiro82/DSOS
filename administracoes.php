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
$query = "SELECT nome, role, lar_id FROM users WHERE id = :user_id";
$stmt = $db->prepare($query);
$stmt->bindParam(':user_id', $_SESSION['user_id']);
$stmt->execute();
$user = $stmt->fetch(PDO::FETCH_ASSOC);

// Prepare user display info for sidebar
$displayName = isset($user['nome']) ? $user['nome'] : 'Utilizador';
$displayRole = ($user['role'] === 'admin_geral') ? 'Administrador Geral' : (($user['role'] === 'tecnico') ? 'Técnico' : 'Administrador de Lar');
$avatarLetter = strtoupper(mb_substr($displayName, 0, 1, 'UTF-8'));

// Get administrações - filtrar diretamente por lar_id
if ($user['role'] === 'admin_geral') {
    $query = "SELECT a.*, t.tipo as terapeutica_tipo, 
              u.nome as utente_nome, m.nome as medicamento_nome, m.dose, m.toma,
              l.nome as lar_nome,
              us_ter.nome as terapeuta_nome,
              us_admin.nome as administrado_por_nome,
              us2.nome as validada_por_nome
              FROM administracoes a
              JOIN terapeuticas t ON a.terapeutica_id = t.id
              JOIN utentes u ON t.utente_id = u.id
              JOIN medicamentos m ON t.medicamento_id = m.id
              JOIN lares l ON a.lar_id = l.id
              JOIN users us_ter ON t.criado_por = us_ter.id
              JOIN users us_admin ON a.administrado_por = us_admin.id
              LEFT JOIN users us2 ON a.validada_por = us2.id
              ORDER BY a.data_hora DESC";
    $stmt = $db->prepare($query);
} else {
    $query = "SELECT a.*, t.tipo as terapeutica_tipo,
              u.nome as utente_nome, m.nome as medicamento_nome, m.dose, m.toma,
              us_ter.nome as terapeuta_nome,
              us_admin.nome as administrado_por_nome,
              us2.nome as validada_por_nome
              FROM administracoes a
              JOIN terapeuticas t ON a.terapeutica_id = t.id
              JOIN utentes u ON t.utente_id = u.id
              JOIN medicamentos m ON t.medicamento_id = m.id
              JOIN users us_ter ON t.criado_por = us_ter.id
              JOIN users us_admin ON a.administrado_por = us_admin.id
              LEFT JOIN users us2 ON a.validada_por = us2.id
              WHERE a.lar_id = :lar_id
              ORDER BY a.data_hora DESC";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':lar_id', $user['lar_id']);
}
$stmt->execute();
$administracoes = $stmt->fetchAll(PDO::FETCH_ASSOC);

// DEBUG TEMPORÁRIO
error_log("=== DEBUG ADMINISTRAÇÕES PHP ===");
error_log("User: " . $user['nome']);
error_log("Role: " . $user['role']);
error_log("Lar ID: " . ($user['lar_id'] ?? 'NULL'));
error_log("Total administrações: " . count($administracoes));

// Get terapêuticas ativas para o modal
if ($user['role'] === 'admin_geral') {
    $query = "SELECT t.id, t.utente_id, u.nome as utente_nome, m.nome as medicamento_nome, 
              m.dose, m.toma, t.tipo, l.nome as lar_nome
              FROM terapeuticas t
              JOIN utentes u ON t.utente_id = u.id
              JOIN medicamentos m ON t.medicamento_id = m.id
              JOIN lares l ON u.lar_id = l.id
              WHERE t.ativo = 1
              ORDER BY l.nome, u.nome, m.nome";
    $stmt = $db->prepare($query);
} else {
    $query = "SELECT t.id, t.utente_id, u.nome as utente_nome, m.nome as medicamento_nome, 
              m.dose, m.toma, t.tipo
              FROM terapeuticas t
              JOIN utentes u ON t.utente_id = u.id
              JOIN medicamentos m ON t.medicamento_id = m.id
              WHERE u.lar_id = :lar_id AND t.ativo = 1
              ORDER BY u.nome, m.nome";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':lar_id', $user['lar_id']);
}
$stmt->execute();
$terapeuticas = $stmt->fetchAll(PDO::FETCH_ASSOC);

function getTipoTomaLabel($tipo)
{
    $labels = [
        'oral' => 'Oral',
        'injetavel' => 'Injetável',
        'topica' => 'Tópica',
        'sublingual' => 'Sublingual',
        'inalacao' => 'Inalação',
        'retal' => 'Retal',
        'ocular' => 'Ocular',
        'auricular' => 'Auricular',
        'nasal' => 'Nasal'
    ];
    return $labels[$tipo] ?? $tipo;
}

function getTipoTerapeuticaLabel($tipo)
{
    $labels = [
        'continua' => 'Contínua',
        'temporaria' => 'Temporária',
        'sos' => 'SOS'
    ];
    return $labels[$tipo] ?? $tipo;
}

function getTipoTerapeuticaBadge($tipo)
{
    $badges = [
        'continua' => 'primary',
        'temporaria' => 'warning',
        'sos' => 'danger'
    ];
    return $badges[$tipo] ?? 'primary';
}
?>
<!DOCTYPE html>
<html lang="pt">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Administrações - Rodas & Bengalas</title>
    <link rel="stylesheet" href="css/style.css">
</head>

<body>
    <div id="mainApp">
        <!-- Sidebar -->
        <aside class="sidebar">
            <div class="sidebar-header">
                <svg class="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
                <h2>R&B</h2>
            </div>
            <nav class="sidebar-nav">
                <a href="app.html" class="nav-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <rect x="3" y="3" width="7" height="7" />
                        <rect x="14" y="3" width="7" height="7" />
                        <rect x="14" y="14" width="7" height="7" />
                        <rect x="3" y="14" width="7" height="7" />
                    </svg>
                    <span>Dashboard</span>
                </a>
                <?php if ($user['role'] === 'admin_geral'): ?>
                    <a href="app.html#lares" class="nav-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                        <span>Lares</span>
                    </a>
                <?php endif; ?>
                <?php if ($user['role'] !== 'tecnico'): ?>
                    <a href="app.html#utentes" class="nav-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        <span>Utentes</span>
                    </a>
                    <a href="app.html#medicamentos" class="nav-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
                            <rect x="9" y="9" width="6" height="6" />
                            <line x1="9" y1="1" x2="9" y2="4" />
                            <line x1="15" y1="1" x2="15" y2="4" />
                            <line x1="9" y1="20" x2="9" y2="23" />
                            <line x1="15" y1="20" x2="15" y2="23" />
                            <line x1="20" y1="9" x2="23" y2="9" />
                            <line x1="20" y1="14" x2="23" y2="14" />
                            <line x1="1" y1="9" x2="4" y2="9" />
                            <line x1="1" y1="14" x2="4" y2="14" />
                        </svg>
                        <span>Medicamentos</span>
                    </a>
                    <a href="app.html#terapeuticas" class="nav-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <span>Terapêuticas</span>
                    </a>
                <?php endif; ?>

                <a href="app.html#pharmacy-orders" class="nav-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path
                            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>Criar Encomenda</span>
                </a>
                <a href="app.html#pharmacy-history" class="nav-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Histórico Encomendas</span>
                </a>
                <a href="app.html#pharmacy-nursing-homes" class="nav-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M3 21h18M5 21V7l8-4 8 4v14M8 21v-4h8v4" />
                    </svg>
                    <span>Histórico por Lar</span>
                </a>

                <?php if ($user['role'] !== 'tecnico'): ?>
                    <a href="users.php" class="nav-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="8.5" cy="7" r="4" />
                            <polyline points="17 11 19 13 23 9" />
                        </svg>
                        <span>Utilizadores</span>
                    </a>
                <?php endif; ?>
                <a href="stocks.php" class="nav-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
                        <path
                            d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                        <line x1="12" y1="22.08" x2="12" y2="12" />
                    </svg>
                    <span>Stocks</span>
                </a>
                <a href="administracoes.php" class="nav-item active">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                    </svg>
                    <span>Administrações</span>
                </a>
            </nav>
            <div class="sidebar-footer">
                <div class="user-info">
                    <div class="user-avatar"><?php echo htmlspecialchars($avatarLetter); ?></div>
                    <div class="user-details">
                        <div class="user-name"><?php echo htmlspecialchars($displayName); ?></div>
                        <div class="user-role"><?php echo htmlspecialchars($displayRole); ?></div>
                    </div>
                </div>
                <a href="logout.php" class="btn-logout">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                </a>
            </div>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
            <div class="page-content">
                <div class="page-header">
                    <div>
                        <h1 class="page-title">Administrações</h1>
                        <p class="page-subtitle">Registo e validação de administrações</p>
                    </div>
                    <button class="btn btn-primary" onclick="showRegistarModal()">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Registar Administração
                    </button>
                </div>

                <?php if (isset($_SESSION['success'])): ?>
                    <div class="alert alert-success">
                        <?= htmlspecialchars($_SESSION['success']) ?>
                    </div>
                    <?php unset($_SESSION['success']); ?>
                <?php endif; ?>

                <?php if (isset($_SESSION['error'])): ?>
                    <div class="alert alert-error">
                        <?= htmlspecialchars($_SESSION['error']) ?>
                    </div>
                    <?php unset($_SESSION['error']); ?>
                <?php endif; ?>

                <div class="card">
                    <?php if (empty($administracoes)): ?>
                        <div class="empty-state">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <h3>Nenhuma administração encontrada</h3>
                            <p>Comece por registar a primeira administração</p>
                            <button class="btn btn-primary" onclick="showRegistarModal()">Registar Administração</button>
                        </div>
                    <?php else: ?>
                        <div class="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Data/Hora</th>
                                        <th>Utente</th>
                                        <th>Medicamento</th>
                                        <?php if ($user['role'] === 'admin_geral'): ?>
                                            <th>Lar</th>
                                        <?php endif; ?>
                                        <th>Tipo</th>
                                        <th>Administrada</th>
                                        <th>Validada</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($administracoes as $a): ?>
                                        <tr>
                                            <td><?= date('d/m/Y H:i', strtotime($a['data_hora'])) ?></td>
                                            <td><strong><?= htmlspecialchars($a['utente_nome']) ?></strong></td>
                                            <td>
                                                <?= htmlspecialchars($a['medicamento_nome']) ?><br>
                                                <small><?= htmlspecialchars($a['dose']) ?> -
                                                    <?= getTipoTomaLabel($a['toma']) ?></small>
                                            </td>
                                            <?php if ($user['role'] === 'admin_geral'): ?>
                                                <td><?= htmlspecialchars($a['lar_nome'] ?? '-') ?></td>
                                            <?php endif; ?>
                                            <td><span
                                                    class="badge badge-<?= getTipoTerapeuticaBadge($a['terapeutica_tipo']) ?>"><?= getTipoTerapeuticaLabel($a['terapeutica_tipo']) ?></span>
                                            </td>
                                            <td>
                                                <?php if ($a['administrada']): ?>
                                                    <span class="badge badge-success">Sim</span>
                                                <?php else: ?>
                                                    <span class="badge badge-danger">Não</span>
                                                    <?php if ($a['motivo_nao_administracao']): ?>
                                                        <br><small><?= htmlspecialchars($a['motivo_nao_administracao']) ?></small>
                                                    <?php endif; ?>
                                                <?php endif; ?>
                                            </td>
                                            <td>
                                                <?php if ($a['validada']): ?>
                                                    <span class="badge badge-success">✓</span>
                                                    <?php if ($a['validada_por_nome']): ?>
                                                        <br><small><?= htmlspecialchars($a['validada_por_nome']) ?></small>
                                                    <?php endif; ?>
                                                <?php else: ?>
                                                    <span class="badge badge-warning">Pendente</span>
                                                <?php endif; ?>
                                            </td>
                                            <td>
                                                <?php if (!$a['validada']): ?>
                                                    <form method="POST" action="validar_administracao_action.php"
                                                        style="display: inline;">
                                                        <input type="hidden" name="id" value="<?= $a['id'] ?>">
                                                        <button type="submit" class="btn"
                                                            style="background: #10b981; color: white; padding: 6px 12px; font-size: 14px; border: none;">
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                                                style="width: 16px; height: 16px; margin-right: 4px;">
                                                                <polyline points="20 6 9 17 4 12" />
                                                            </svg>
                                                            Validar
                                                        </button>
                                                    </form>
                                                <?php endif; ?>
                                            </td>
                                        </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        </div>
                    <?php endif; ?>
                </div>
            </div>
        </main>
    </div>

    <!-- Modal Container -->
    <div id="modalContainer"></div>

    <script src="js/utils.js"></script>
    <script>
        const terapeuticas = <?= json_encode($terapeuticas) ?>;
        const isAdminGeral = <?= json_encode($user['role'] === 'admin_geral') ?>;

        function showRegistarModal() {
            let terapeuticasOptions = '';

            if (isAdminGeral) {
                // Agrupar por lar
                const porLar = {};
                terapeuticas.forEach(t => {
                    const lar = t.lar_nome || 'Sem Lar';
                    if (!porLar[lar]) porLar[lar] = [];
                    porLar[lar].push(t);
                });

                Object.keys(porLar).sort().forEach(lar => {
                    terapeuticasOptions += `<optgroup label="${lar}">`;
                    porLar[lar].forEach(t => {
                        terapeuticasOptions += `<option value="${t.id}">${t.utente_nome} - ${t.medicamento_nome} (${t.dose})</option>`;
                    });
                    terapeuticasOptions += `</optgroup>`;
                });
            } else {
                terapeuticas.forEach(t => {
                    terapeuticasOptions += `<option value="${t.id}">${t.utente_nome} - ${t.medicamento_nome} (${t.dose})</option>`;
                });
            }

            const now = new Date();
            const dataHoraDefault = now.toISOString().slice(0, 16);

            const content = `
                <form method="POST" action="registar_administracao_action.php">
                    <div class="form-group">
                        <label>Terapêutica *</label>
                        <select name="terapeutica_id" id="terapeuticaSelect" required>
                            <option value="">Selecione...</option>
                            ${terapeuticasOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Data e Hora *</label>
                        <input type="datetime-local" name="data_hora" value="${dataHoraDefault}" required>
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" name="administrada" value="1" id="checkAdministrada" checked onchange="toggleMotivo()">
                            Medicamento foi administrado
                        </label>
                    </div>
                    <div class="form-group" id="motivoGroup" style="display: none;">
                        <label>Motivo da Não Administração</label>
                        <textarea name="motivo_nao_administracao" id="motivoTextarea" rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Observações</label>
                        <textarea name="observacoes" rows="3"></textarea>
                    </div>
                    
                    <div style="display: flex; gap: 10px; margin-top: 20px;">
                        <button type="button" class="btn btn-outline" onclick="closeModal()" style="flex: 1;">Cancelar</button>
                        <button type="submit" class="btn btn-primary" style="flex: 1;">Registar</button>
                    </div>
                </form>
            `;

            showModal('Registar Administração', content, '');
        }

        function toggleMotivo() {
            const check = document.getElementById('checkAdministrada');
            const motivoGroup = document.getElementById('motivoGroup');
            const motivoTextarea = document.getElementById('motivoTextarea');

            if (check.checked) {
                motivoGroup.style.display = 'none';
                motivoTextarea.required = false;
            } else {
                motivoGroup.style.display = 'block';
                motivoTextarea.required = true;
            }
        }
    </script>
</body>

</html>