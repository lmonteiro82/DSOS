// Users Page
async function loadUsers() {
    const pageContent = document.getElementById('pageContent');
    
    try {
        const [usersResponse, laresResponse] = await Promise.all([
            UsersAPI.getAll(),
            LaresAPI.getAll()
        ]);
        
        const users = usersResponse.data;
        window.laresData = laresResponse.data;

        let html = `
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

            <div class="card">
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Email</th>
                                <th>Tipo</th>
                                ${Auth.isAdminGeral() ? '<th>Lar</th>' : ''}
                                <th>Criado em</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        if (users.length === 0) {
            html += `
                <tr>
                    <td colspan="${Auth.isAdminGeral() ? '6' : '5'}" style="text-align: center; padding: 2rem;">
                        Nenhum utilizador encontrado
                    </td>
                </tr>
            `;
        } else {
            users.forEach(user => {
                const roleLabel = getRoleLabel(user.role);
                const roleBadge = user.role === 'admin_lar' ? 'warning' : 'info';
                const createdDate = new Date(user.created_at).toLocaleDateString('pt-PT');
                
                html += `
                    <tr>
                        <td>
                            <div style="display: flex; align-items: center; gap: 0.75rem;">
                                <div class="user-avatar" style="width: 32px; height: 32px; font-size: 0.875rem;">
                                    ${user.nome.charAt(0).toUpperCase()}
                                </div>
                                <strong>${user.nome}</strong>
                            </div>
                        </td>
                        <td>${user.email}</td>
                        <td><span class="badge badge-${roleBadge}">${roleLabel}</span></td>
                        ${Auth.isAdminGeral() ? `<td>${user.lar_nome || '-'}</td>` : ''}
                        <td>${createdDate}</td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn-icon" onclick='editUser(${JSON.stringify(user)})' title="Editar">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                    </svg>
                                </button>
                                ${user.role !== 'admin_geral' ? `
                                <button class="btn-icon btn-icon-danger" onclick="deleteUser(${user.id}, '${user.nome}')" title="Eliminar">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <polyline points="3 6 5 6 21 6"/>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                    </svg>
                                </button>
                                ` : ''}
                            </div>
                        </td>
                    </tr>
                `;
            });
        }

        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        pageContent.innerHTML = html;
    } catch (error) {
        console.error('Error loading users:', error);
        pageContent.innerHTML = `
            <div class="alert alert-error">
                Erro ao carregar utilizadores: ${error.message}
            </div>
        `;
    }
}

function showAddUserModal() {
    const laresOptions = window.laresData.map(l => `<option value="${l.id}">${l.nome}</option>`).join('');
    
    const content = `
        <form>
            <div class="form-group">
                <label>Nome *</label>
                <input type="text" id="userName" required>
            </div>
            <div class="form-group">
                <label>Email *</label>
                <input type="email" id="userEmail" required>
            </div>
            <div class="form-group">
                <label>Password *</label>
                <input type="password" id="userPassword" required minlength="6">
                <small>Mínimo 6 caracteres</small>
            </div>
            <div class="form-group">
                <label>Tipo de Utilizador *</label>
                <select id="userRole" required>
                    <option value="">Selecione...</option>
                    <option value="admin_lar">Administrador de Lar</option>
                    <option value="tecnico">Técnico</option>
                </select>
                <small>Nota: Não é possível criar Administradores Globais</small>
            </div>
            <div class="form-group">
                <label>Lar *</label>
                <select id="userLar" required>
                    <option value="">Selecione...</option>
                    ${laresOptions}
                </select>
            </div>
        </form>
    `;

    const footer = `
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancelar</button>
        <button type="button" id="addUserBtn" class="btn btn-primary">Adicionar</button>
    `;

    showModal('Adicionar Utilizador', content, footer);
    
    // Attach event listener after modal is rendered
    setTimeout(() => {
        const addBtn = document.getElementById('addUserBtn');
        if (addBtn) {
            addBtn.addEventListener('click', addUser);
        }
    }, 100);
}

async function addUser() {
    const btn = document.getElementById('addUserBtn');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'A adicionar...';
    }
    
    const nameEl = document.getElementById('userName');
    const emailEl = document.getElementById('userEmail');
    const passwordEl = document.getElementById('userPassword');
    const roleEl = document.getElementById('userRole');
    const larEl = document.getElementById('userLar');
    
    if (!nameEl || !emailEl || !passwordEl || !roleEl || !larEl) {
        console.error('Elementos do formulário não encontrados no DOM');
        showToast('Erro: Formulário não carregado corretamente', 'error');
        if (btn) { btn.disabled = false; btn.textContent = 'Adicionar'; }
        return;
    }
    
    const nome = nameEl.value.trim();
    const email = emailEl.value.trim();
    const password = passwordEl.value;
    const role = roleEl.value;
    const lar_id = parseInt(larEl.value);

    console.log('Valores do form:', { nome, email, password: '***', role, lar_id });

    if (!nome || !email || !password || !role || !lar_id || isNaN(lar_id)) {
        showToast('Preencha todos os campos obrigatórios', 'error');
        if (btn) { btn.disabled = false; btn.textContent = 'Adicionar'; }
        return;
    }

    if (password.length < 6) {
        showToast('A password deve ter no mínimo 6 caracteres', 'error');
        if (btn) { btn.disabled = false; btn.textContent = 'Adicionar'; }
        return;
    }

    const data = {
        nome,
        email,
        password,
        role,
        lar_id
    };

    try {
        console.log('Enviando dados:', data);
        const response = await UsersAPI.create(data);
        console.log('Resposta:', response);
        closeModal();
        showToast('Utilizador criado com sucesso', 'success');
        reloadCurrentPage();
    } catch (error) {
        console.error('Erro ao criar utilizador:', error);
        showToast('Erro: ' + error.message, 'error');
        if (btn) { btn.disabled = false; btn.textContent = 'Adicionar'; }
    }
}

function editUser(user) {
    const laresOptions = window.laresData.map(l => 
        `<option value="${l.id}" ${l.id === user.lar_id ? 'selected' : ''}>${l.nome}</option>`
    ).join('');
    
    const content = `
        <form>
            <input type="hidden" id="userId" value="${user.id}">
            <div class="form-group">
                <label>Nome *</label>
                <input type="text" id="userName" value="${user.nome}" required>
            </div>
            <div class="form-group">
                <label>Email *</label>
                <input type="email" id="userEmail" value="${user.email}" required>
            </div>
            <div class="form-group">
                <label>Nova Password</label>
                <input type="password" id="userPassword" minlength="6">
                <small>Deixe em branco para manter a password atual</small>
            </div>
            <div class="form-group">
                <label>Tipo de Utilizador *</label>
                <select id="userRole" required ${user.role === 'admin_geral' ? 'disabled' : ''}>
                    <option value="admin_lar" ${user.role === 'admin_lar' ? 'selected' : ''}>Administrador de Lar</option>
                    <option value="tecnico" ${user.role === 'tecnico' ? 'selected' : ''}>Técnico</option>
                </select>
                ${user.role === 'admin_geral' ? '<small>Não é possível alterar Administradores Globais</small>' : ''}
            </div>
            <div class="form-group">
                <label>Lar *</label>
                <select id="userLar" required ${user.role === 'admin_geral' ? 'disabled' : ''}>
                    ${laresOptions}
                </select>
            </div>
        </form>
    `;

    const footer = `
        <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="updateUser()">Atualizar</button>
    `;

    showModal('Editar Utilizador', content, footer);
}

async function updateUser() {
    const id = parseInt(document.getElementById('userId').value);
    const nome = document.getElementById('userName').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    const password = document.getElementById('userPassword').value;
    const role = document.getElementById('userRole').value;
    const lar_id = parseInt(document.getElementById('userLar').value);

    if (!nome || !email || !role || !lar_id) {
        showToast('Preencha todos os campos obrigatórios', 'error');
        return;
    }

    if (password && password.length < 6) {
        showToast('A password deve ter no mínimo 6 caracteres', 'error');
        return;
    }

    const data = {
        id,
        nome,
        email,
        role,
        lar_id
    };

    if (password) {
        data.password = password;
    }

    try {
        await UsersAPI.update(data);
        closeModal();
        showToast('Utilizador atualizado com sucesso', 'success');
        reloadCurrentPage();
    } catch (error) {
        showToast('Erro: ' + error.message, 'error');
    }
}

async function deleteUser(id, nome) {
    const confirmed = confirm(`Tem a certeza que deseja eliminar o utilizador "${nome}"?\n\nEsta ação não pode ser revertida.`);
    
    if (!confirmed) return;

    try {
        await UsersAPI.delete(id);
        showToast('Utilizador eliminado com sucesso', 'success');
        reloadCurrentPage();
    } catch (error) {
        showToast('Erro: ' + error.message, 'error');
    }
}
