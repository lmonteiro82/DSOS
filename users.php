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

// Verificar permissões - técnicos não podem aceder
if ($user['role'] === 'tecnico') {
    header('Location: app.html');
    exit();
}

// Prepare user display info for sidebar
$displayName = isset($user['nome']) ? $user['nome'] : 'Utilizador';
$displayRole = ($user['role'] === 'admin_geral') ? 'Administrador Geral' : 'Administrador';
$avatarLetter = strtoupper(mb_substr($displayName, 0, 1, 'UTF-8'));

// Get users list
if ($user['role'] === 'admin_geral') {
    $query = "SELECT u.id, u.nome, u.email, u.role, u.lar_id, u.created_at, l.nome as lar_nome 
              FROM users u 
              LEFT JOIN lares l ON u.lar_id = l.id 
              WHERE u.ativo = 1 
              ORDER BY u.created_at DESC";
    $stmt = $db->prepare($query);
} else {
    $query = "SELECT u.id, u.nome, u.email, u.role, u.lar_id, u.created_at, l.nome as lar_nome 
              FROM users u 
              LEFT JOIN lares l ON u.lar_id = l.id 
              WHERE u.lar_id = :lar_id AND u.ativo = 1 
              ORDER BY u.created_at DESC";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':lar_id', $user['lar_id']);
}
$stmt->execute();
$usersList = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Get lares for dropdown
$query = "SELECT id, nome FROM lares WHERE ativo = 1 ORDER BY nome";
$stmt = $db->prepare($query);
$stmt->execute();
$lares = $stmt->fetchAll(PDO::FETCH_ASSOC);

function getRoleLabel($role) {
    $labels = [
        'admin_geral' => 'Administrador Geral',
        'admin_lar' => 'Administrador de Lar',
        'tecnico' => 'Técnico'
    ];
    return $labels[$role] ?? $role;
}

function getRoleBadge($role) {
    $badges = [
        'admin_geral' => 'primary',
        'admin_lar' => 'warning',
        'tecnico' => 'info'
    ];
    return $badges[$role] ?? 'primary';
}
?>
<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Utilizadores - Rodas & Bengalas</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div id="mainApp">
        <!-- Sidebar -->
        <aside class="sidebar">
            <div class="sidebar-header">
                <svg class="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
                <h2>R&B</h2>
            </div>
            <nav class="sidebar-nav">
                <a href="app.html" class="nav-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <rect x="3" y="3" width="7" height="7"/>
                        <rect x="14" y="3" width="7" height="7"/>
                        <rect x="14" y="14" width="7" height="7"/>
                        <rect x="3" y="14" width="7" height="7"/>
                    </svg>
                    <span>Dashboard</span>
                </a>
                <?php if ($user['role'] === 'admin_geral'): ?>
                <a href="app.html#lares" class="nav-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        <polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                    <span>Lares</span>
                </a>
                <?php endif; ?>
                <a href="app.html#utentes" class="nav-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    <span>Utentes</span>
                </a>
                <a href="app.html#medicamentos" class="nav-item">
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
                <a href="app.html#terapeuticas" class="nav-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <span>Terapêuticas</span>
                </a>
                <a href="users.php" class="nav-item active">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="8.5" cy="7" r="4"/>
                        <polyline points="17 11 19 13 23 9"/>
                    </svg>
                    <span>Utilizadores</span>
                </a>
                <a href="stocks.php" class="nav-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                        <line x1="12" y1="22.08" x2="12" y2="12"/>
                    </svg>
                    <span>Stocks</span>
                </a>
                <a href="administracoes.php" class="nav-item">
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
                        <h1 class="page-title">Utilizadores</h1>
                        <p class="page-subtitle">Gestão de administradores e técnicos</p>
                    </div>
                    <button class="btn btn-primary" onclick="showAddUserModal()">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Adicionar Utilizador
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
                    <?php if (empty($usersList)): ?>
                        <div class="empty-state">
                            <p>Nenhum utilizador encontrado</p>
                        </div>
                    <?php else: ?>
                        <div class="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Nome</th>
                                        <th>Email</th>
                                        <th>Tipo</th>
                                        <?php if ($user['role'] === 'admin_geral'): ?>
                                            <th>Lar</th>
                                        <?php endif; ?>
                                        <th>Criado em</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($usersList as $u): ?>
                                        <tr>
                                            <td>
                                                <div style="display: flex; align-items: center; gap: 0.75rem;">
                                                    <div class="user-avatar" style="width: 32px; height: 32px; font-size: 0.875rem;">
                                                        <?= strtoupper(mb_substr($u['nome'], 0, 1, 'UTF-8')) ?>
                                                    </div>
                                                    <strong><?= htmlspecialchars($u['nome']) ?></strong>
                                                </div>
                                            </td>
                                            <td><?= htmlspecialchars($u['email']) ?></td>
                                            <td><span class="badge badge-<?= getRoleBadge($u['role']) ?>"><?= getRoleLabel($u['role']) ?></span></td>
                                            <?php if ($user['role'] === 'admin_geral'): ?>
                                                <td><?= htmlspecialchars($u['lar_nome'] ?? '-') ?></td>
                                            <?php endif; ?>
                                            <td><?= date('d/m/Y', strtotime($u['created_at'])) ?></td>
                                            <td>
                                                <div class="action-buttons">
                                                    <button class="btn-icon" onclick='showEditUserModal(<?= json_encode($u) ?>)' title="Editar">
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                                        </svg>
                                                    </button>
                                                    <?php if ($u['role'] !== 'admin_geral'): ?>
                                                    <form method="POST" action="eliminar.php" style="display: inline;" onsubmit="return confirm('Tem a certeza que deseja eliminar o utilizador \'<?= htmlspecialchars($u['nome']) ?>\'?');">
                                                        <input type="hidden" name="tipo" value="user">
                                                        <input type="hidden" name="id" value="<?= $u['id'] ?>">
                                                        <button type="submit" class="btn-icon btn-icon-danger" title="Eliminar">
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                                <polyline points="3 6 5 6 21 6"/>
                                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                                            </svg>
                                                        </button>
                                                    </form>
                                                    <?php endif; ?>
                                                </div>
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
        const lares = <?= json_encode($lares) ?>;
        
        function showAddUserModal() {
            const laresOptions = lares.map(l => `<option value="${l.id}">${l.nome}</option>`).join('');
            
            const content = `
                <form method="POST" action="adicionar_user_action.php">
                    <div class="form-group">
                        <label>Nome *</label>
                        <input type="text" name="nome" required>
                    </div>
                    <div class="form-group">
                        <label>Email *</label>
                        <input type="email" name="email" required>
                    </div>
                    <div class="form-group">
                        <label>Password *</label>
                        <input type="password" name="password" required minlength="6">
                        <small>Mínimo 6 caracteres</small>
                    </div>
                    <div class="form-group">
                        <label>Tipo de Utilizador *</label>
                        <select name="role" required>
                            <option value="">Selecione...</option>
                            <option value="admin_lar">Administrador de Lar</option>
                            <option value="tecnico">Técnico</option>
                        </select>
                        <small>Nota: Não é possível criar Administradores Globais</small>
                    </div>
                    <div class="form-group">
                        <label>Lar *</label>
                        <select name="lar_id" required>
                            <option value="">Selecione...</option>
                            ${laresOptions}
                        </select>
                    </div>
                    
                    <div style="display: flex; gap: 10px; margin-top: 20px;">
                        <button type="button" class="btn btn-outline" onclick="closeModal()" style="flex: 1;">Cancelar</button>
                        <button type="submit" class="btn btn-primary" style="flex: 1;">Adicionar</button>
                    </div>
                </form>
            `;
            
            showModal('Adicionar Utilizador', content, '');
        }
        
        function showEditUserModal(user) {
            const laresOptions = lares.map(l => 
                `<option value="${l.id}" ${l.id == user.lar_id ? 'selected' : ''}>${l.nome}</option>`
            ).join('');
            
            const content = `
                <form method="POST" action="editar_user_action.php">
                    <input type="hidden" name="id" value="${user.id}">
                    <div class="form-group">
                        <label>Nome *</label>
                        <input type="text" name="nome" value="${user.nome}" required>
                    </div>
                    <div class="form-group">
                        <label>Email *</label>
                        <input type="email" name="email" value="${user.email}" required>
                    </div>
                    <div class="form-group">
                        <label>Nova Password</label>
                        <input type="password" name="password" minlength="6">
                        <small>Deixe em branco para manter a password atual</small>
                    </div>
                    <div class="form-group">
                        <label>Tipo de Utilizador *</label>
                        <select name="role" required ${user.role === 'admin_geral' ? 'disabled' : ''}>
                            <option value="admin_lar" ${user.role === 'admin_lar' ? 'selected' : ''}>Administrador de Lar</option>
                            <option value="tecnico" ${user.role === 'tecnico' ? 'selected' : ''}>Técnico</option>
                        </select>
                        ${user.role === 'admin_geral' ? '<small>Não é possível alterar Administradores Globais</small>' : ''}
                    </div>
                    <div class="form-group">
                        <label>Lar *</label>
                        <select name="lar_id" required ${user.role === 'admin_geral' ? 'disabled' : ''}>
                            ${laresOptions}
                        </select>
                    </div>
                    
                    <div style="display: flex; gap: 10px; margin-top: 20px;">
                        <button type="button" class="btn btn-outline" onclick="closeModal()" style="flex: 1;">Cancelar</button>
                        <button type="submit" class="btn btn-primary" style="flex: 1;">Atualizar</button>
                    </div>
                </form>
            `;
            
            showModal('Editar Utilizador', content, '');
        }
    </script>
</body>
</html>
