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

// Prepare user display info for sidebar to match SPA
$displayName = isset($user['nome']) ? $user['nome'] : 'Utilizador';
$displayRole = ($user['role'] === 'admin_geral') ? 'Administrador Geral' : 'Administrador';
$avatarLetter = strtoupper(mb_substr($displayName, 0, 1, 'UTF-8'));

// Get Stock Geral por Medicamento - mostra quantidade total em stock (inventário)
if ($user['role'] === 'admin_geral') {
    $query = "SELECT m.nome as medicamento_nome, m.dose, m.toma, l.nome as lar_nome,
              COALESCE(SUM(s.quantidade), 0) as quantidade_total,
              (SELECT data_validade FROM stocks WHERE medicamento_id = m.id ORDER BY updated_at DESC LIMIT 1) as data_validade
              FROM medicamentos m
              JOIN lares l ON m.lar_id = l.id
              LEFT JOIN stocks s ON s.medicamento_id = m.id
              WHERE m.ativo = 1
              GROUP BY m.id, l.id
              ORDER BY m.nome, l.nome";
    $stmt = $db->prepare($query);
} else {
    $query = "SELECT m.nome as medicamento_nome, m.dose, m.toma,
              COALESCE(SUM(s.quantidade), 0) as quantidade_total,
              (SELECT data_validade FROM stocks WHERE medicamento_id = m.id ORDER BY updated_at DESC LIMIT 1) as data_validade
              FROM medicamentos m
              LEFT JOIN stocks s ON s.medicamento_id = m.id
              WHERE m.ativo = 1 AND m.lar_id = :lar_id
              GROUP BY m.id
              ORDER BY m.nome";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':lar_id', $user['lar_id']);
}
$stmt->execute();
$stockGeral = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Get Stock por Utente - conta administrações validadas por utente e medicamento
if ($user['role'] === 'admin_geral') {
    $query = "SELECT u.id as utente_id, u.nome as utente_nome, m.id as medicamento_id,
              m.nome as medicamento_nome, m.dose, m.toma,
              COUNT(CASE WHEN a.validada = 1 AND a.administrada = 1 THEN 1 END) as quantidade
              FROM utentes u
              CROSS JOIN medicamentos m
              LEFT JOIN terapeuticas t ON t.utente_id = u.id AND t.medicamento_id = m.id
              LEFT JOIN administracoes a ON a.terapeutica_id = t.id
              WHERE u.ativo = 1 AND m.ativo = 1
              GROUP BY u.id, m.id
              ORDER BY u.nome, m.nome";
    $stmt = $db->prepare($query);
} else {
    $query = "SELECT u.id as utente_id, u.nome as utente_nome, m.id as medicamento_id,
              m.nome as medicamento_nome, m.dose, m.toma,
              COUNT(CASE WHEN a.validada = 1 AND a.administrada = 1 THEN 1 END) as quantidade
              FROM utentes u
              CROSS JOIN medicamentos m
              LEFT JOIN terapeuticas t ON t.utente_id = u.id AND t.medicamento_id = m.id
              LEFT JOIN administracoes a ON a.terapeutica_id = t.id
              WHERE u.ativo = 1 AND m.ativo = 1 AND u.lar_id = :lar_id AND m.lar_id = :lar_id
              GROUP BY u.id, m.id
              ORDER BY u.nome, m.nome";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':lar_id', $user['lar_id']);
}
$stmt->execute();
$stocks = $stmt->fetchAll(PDO::FETCH_ASSOC);

function getTipoTomaLabel($toma) {
    switch($toma) {
        case 'comprimido': return 'Comprimido';
        case 'capsula': return 'Cápsula';
        case 'xarope': return 'Xarope';
        case 'injecao': return 'Injeção';
        case 'pomada': return 'Pomada';
        case 'gotas': return 'Gotas';
        default: return $toma;
    }
}
?>
<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Stocks - DSOS</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="app-container">
        <!-- Sidebar -->
        <aside class="sidebar">
            <div class="sidebar-header">
                <svg class="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
                <h2>R&B</h2>
            </div>
            <nav class="sidebar-nav">
                <a href="app.html" class="nav-item" data-page="dashboard">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <rect x="3" y="3" width="7" height="7"/>
                        <rect x="14" y="3" width="7" height="7"/>
                        <rect x="14" y="14" width="7" height="7"/>
                        <rect x="3" y="14" width="7" height="7"/>
                    </svg>
                    <span>Dashboard</span>
                </a>
                <?php if ($user['role'] === 'admin_geral'): ?>
                <a href="app.html#lares" class="nav-item" id="navLares" data-page="lares">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        <polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                    <span>Lares</span>
                </a>
                <?php endif; ?>
                <a href="app.html#utentes" class="nav-item" data-page="utentes">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    <span>Utentes</span>
                </a>
                <a href="app.html#medicamentos" class="nav-item" data-page="medicamentos">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <rect x="4" y="4" width="16" height="16" rx="2" ry="2"/>
                        <rect x="9" y="9" width="6" height="6"/>
                        <line x1="9" y1="1" x2="9" y2="4"/>
                        <line x1="15" y1="1" x2="15" y2="4"/>
                        <line x1="9" y1="20" x2="9" y2="23"/>
                        <line x1="15" y1="20" x2="15" y2="23"/>
                        <line x1="20" y1="9" x2="23" y2="9"/>
                        <line x1="20" y1="14" x2="23" y2="14"/>
                        <line x1="1" y1="9" x2="4" y2="9"/>
                        <line x1="1" y1="14" x2="4" y2="14"/>
                    </svg>
                    <span>Medicamentos</span>
                </a>
                <a href="app.html#terapeuticas" class="nav-item" data-page="terapeuticas">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <span>Terapêuticas</span>
                </a>
                <a href="stocks.php" class="nav-item active">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                        <line x1="12" y1="22.08" x2="12" y2="12"/>
                    </svg>
                    <span>Stocks</span>
                </a>
                <a href="app.html#administracoes" class="nav-item" data-page="administracoes">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                        <polyline points="10 9 9 9 8 9"/>
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
                <a href="api/auth.php?logout=1" class="btn-logout">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                        <polyline points="16 17 21 12 16 7"/>
                        <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                </a>
            </div>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
            <div class="page-content">
                <div class="page-header">
                    <div>
                        <h1 class="page-title">Stocks</h1>
                        <p class="page-subtitle">Gestão de stocks de medicamentos</p>
                    </div>
                    <button class="btn btn-primary" onclick="showAddStockModal()">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Adicionar Stock
                    </button>
                </div>

                <!-- Stock Geral -->
                <div class="card" style="margin-bottom: 30px;">
                    <h2 style="margin-bottom: 20px;">Stock por Medicamento</h2>
                    <?php if (empty($stockGeral)): ?>
                        <div class="empty-state">
                            <p>Nenhum stock encontrado</p>
                        </div>
                    <?php else: ?>
                        <div class="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Medicamento</th>
                                        <th>Dose</th>
                                        <th>Toma</th>
                                        <?php if ($user['role'] === 'admin_geral'): ?>
                                            <th>Lar</th>
                                        <?php endif; ?>
                                        <th>Quantidade em Stock</th>
                                        <th>Validade</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($stockGeral as $sg): ?>
                                        <tr>
                                            <td><strong><?= htmlspecialchars($sg['medicamento_nome']) ?></strong></td>
                                            <td><?= htmlspecialchars($sg['dose']) ?></td>
                                            <td><span class="badge badge-info"><?= getTipoTomaLabel($sg['toma']) ?></span></td>
                                            <?php if ($user['role'] === 'admin_geral'): ?>
                                                <td><?= htmlspecialchars($sg['lar_nome']) ?></td>
                                            <?php endif; ?>
                                            <td><span class="badge badge-success"><?= $sg['quantidade_total'] ?></span></td>
                                            <td><?= $sg['data_validade'] ? date('d/m/Y', strtotime($sg['data_validade'])) : '-' ?></td>
                                        </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        </div>
                    <?php endif; ?>
                </div>

                <!-- Stock por Utente -->
                <div class="card">
                    <h2 style="margin-bottom: 20px;">Administrações por Utente</h2>
                    <?php if (empty($stocks)): ?>
                        <div class="empty-state">
                            <p>Nenhum stock encontrado</p>
                        </div>
                    <?php else: ?>
                        <div class="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Utente</th>
                                        <th>Medicamento</th>
                                        <th>Total Administrações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($stocks as $s): ?>
                                        <tr>
                                            <td><strong><?= htmlspecialchars($s['utente_nome']) ?></strong></td>
                                            <td>
                                                <?= htmlspecialchars($s['medicamento_nome']) ?><br>
                                                <small><?= htmlspecialchars($s['dose']) ?> - <?= getTipoTomaLabel($s['toma']) ?></small>
                                            </td>
                                            <td><span class="badge badge-primary"><?= $s['quantidade'] ?></span></td>
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
        // Get data for modal
        const utentes = <?= json_encode($stocks) ?>;
        const medicamentos = <?= json_encode($stockGeral) ?>;
        
        function showAddStockModal() {
            const medicamentosList = [...new Map(medicamentos.map(m => [m.medicamento_nome, {nome: m.medicamento_nome}])).values()];
            const medicamentosOptions = medicamentosList.map(m => `<option value="${m.nome}">${m.nome}</option>`).join('');
            
            const content = `
                <form method="POST" action="adicionar_stock_action.php">
                    <div class="form-group">
                        <label>Medicamento *</label>
                        <select name="medicamento_nome" id="selectMedicamento" required>
                            <option value="">Selecione...</option>
                            ${medicamentosOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Quantidade a Adicionar *</label>
                        <input type="number" name="quantidade" required min="1" value="10">
                        <small style="color: var(--gray-600);">Esta quantidade será adicionada ao stock de todos os utentes</small>
                    </div>
                    <div class="form-group">
                        <label>Data de Validade *</label>
                        <input type="date" name="data_validade" required>
                    </div>
                    <div style="display: flex; gap: 10px; margin-top: 20px;">
                        <button type="button" class="btn btn-outline" onclick="closeModal()" style="flex: 1;">Cancelar</button>
                        <button type="submit" class="btn btn-primary" style="flex: 1;">Adicionar Stock</button>
                    </div>
                </form>
            `;
            
            showModal('Adicionar Stock ao Medicamento', content, '');
        }
    </script>
</body>
</html>
