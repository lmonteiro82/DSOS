// Utentes Page
let laresData = [];

async function loadUtentes() {
    const pageContent = document.getElementById('pageContent');
    
    try {
        const [utentesResponse, laresResponse] = await Promise.all([
            UtentesAPI.getAll(),
            LaresAPI.getAll()
        ]);
        
        const utentes = utentesResponse.data;
        laresData = laresResponse.data;

        let html = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">Utentes</h1>
                    <p class="page-subtitle">Gestão de utentes dos lares</p>
                </div>
                ${Auth.isAdmin() ? '<button class="btn btn-primary" onclick="showCreateUtenteModal()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Novo Utente</button>' : ''}
            </div>

            <div class="card">
        `;

        if (utentes.length === 0) {
            html += showEmptyState('Nenhum utente encontrado', 'Comece por adicionar o primeiro utente', Auth.isAdmin() ? 'Adicionar Utente' : '', 'showCreateUtenteModal()');
        } else {
            html += `
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Nº Utente</th>
                                <th>Idade</th>
                                <th>Lar</th>
                                <th>Contacto Emergência</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            utentes.forEach(utente => {
                html += `
                    <tr>
                        <td><strong>${utente.nome}</strong></td>
                        <td>${utente.numero_utente}</td>
                        <td>${calculateAge(utente.data_nascimento)} anos</td>
                        <td>${utente.lar_nome}</td>
                        <td>${utente.contacto_emergencia_nome || '-'}<br><small>${utente.contacto_emergencia_telefone || ''}</small></td>
                        <td>
                            ${Auth.isAdmin() ? `
                                <button class="btn btn-sm btn-outline" onclick='showEditUtenteModal(${JSON.stringify(utente).replace(/'/g, "&apos;")})'>Editar</button>
                                <button class="btn btn-sm btn-danger" onclick="deleteUtente(${utente.id})">Eliminar</button>
                            ` : '-'}
                        </td>
                    </tr>
                `;
            });

            html += '</tbody></table></div>';
        }

        html += '</div>';
        pageContent.innerHTML = html;
    } catch (error) {
        showToast('Erro ao carregar utentes', 'error');
    }
}

function showCreateUtenteModal() {
    const laresOptions = laresData.map(l => `<option value="${l.id}">${l.nome}</option>`).join('');
    
    const content = `
        <form id="createUtenteForm">
            <div class="form-group">
                <label>Nome *</label>
                <input type="text" id="utenteNome" required>
            </div>
            <div class="form-group">
                <label>Data de Nascimento *</label>
                <input type="date" id="utenteDataNascimento" required>
            </div>
            <div class="form-group">
                <label>Número de Utente *</label>
                <input type="text" id="utenteNumero" required>
            </div>
            <div class="form-group">
                <label>Lar *</label>
                <select id="utenteLar" required>${laresOptions}</select>
            </div>
            <div class="form-group">
                <label>Nome Contacto Emergência</label>
                <input type="text" id="utenteContactoNome">
            </div>
            <div class="form-group">
                <label>Telefone Contacto Emergência</label>
                <input type="tel" id="utenteContactoTelefone">
            </div>
            <div class="form-group">
                <label>Relação</label>
                <input type="text" id="utenteContactoRelacao">
            </div>
            <div class="form-group">
                <label>Observações</label>
                <textarea id="utenteObservacoes"></textarea>
            </div>
        </form>
    `;

    const footer = `
        <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="createUtente()">Criar</button>
    `;

    showModal('Novo Utente', content, footer);
}

async function createUtente() {
    const data = {
        nome: document.getElementById('utenteNome').value,
        data_nascimento: document.getElementById('utenteDataNascimento').value,
        numero_utente: document.getElementById('utenteNumero').value,
        lar_id: parseInt(document.getElementById('utenteLar').value),
        contacto_emergencia_nome: document.getElementById('utenteContactoNome').value,
        contacto_emergencia_telefone: document.getElementById('utenteContactoTelefone').value,
        contacto_emergencia_relacao: document.getElementById('utenteContactoRelacao').value,
        observacoes: document.getElementById('utenteObservacoes').value
    };

    try {
        await UtentesAPI.create(data);
        closeModal();
        showToast('Utente criado com sucesso', 'success');
        reloadCurrentPage();
    } catch (error) {
        showToast('Erro: ' + error.message, 'error');
    }
}

function showEditUtenteModal(utente) {
    const content = `
        <form>
            <input type="hidden" id="utenteId" value="${utente.id}">
            <div class="form-group">
                <label>Nome *</label>
                <input type="text" id="utenteNome" value="${utente.nome}" required>
            </div>
            <div class="form-group">
                <label>Data de Nascimento *</label>
                <input type="date" id="utenteDataNascimento" value="${utente.data_nascimento}" required>
            </div>
            <div class="form-group">
                <label>Nome Contacto Emergência</label>
                <input type="text" id="utenteContactoNome" value="${utente.contacto_emergencia_nome || ''}">
            </div>
            <div class="form-group">
                <label>Telefone</label>
                <input type="tel" id="utenteContactoTelefone" value="${utente.contacto_emergencia_telefone || ''}">
            </div>
            <div class="form-group">
                <label>Relação</label>
                <input type="text" id="utenteContactoRelacao" value="${utente.contacto_emergencia_relacao || ''}">
            </div>
            <div class="form-group">
                <label>Observações</label>
                <textarea id="utenteObservacoes">${utente.observacoes || ''}</textarea>
            </div>
        </form>
    `;

    const footer = `
        <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="updateUtente()">Atualizar</button>
    `;

    showModal('Editar Utente', content, footer);
}

async function updateUtente() {
    const data = {
        id: parseInt(document.getElementById('utenteId').value),
        nome: document.getElementById('utenteNome').value,
        data_nascimento: document.getElementById('utenteDataNascimento').value,
        contacto_emergencia_nome: document.getElementById('utenteContactoNome').value,
        contacto_emergencia_telefone: document.getElementById('utenteContactoTelefone').value,
        contacto_emergencia_relacao: document.getElementById('utenteContactoRelacao').value,
        observacoes: document.getElementById('utenteObservacoes').value
    };

    try {
        await UtentesAPI.update(data);
        closeModal();
        showToast('Utente atualizado com sucesso', 'success');
        reloadCurrentPage();
    } catch (error) {
        showToast('Erro: ' + error.message, 'error');
    }
}

async function deleteUtente(id) {
    if (!confirm('Tem a certeza que deseja eliminar este utente?')) return;

    try {
        await UtentesAPI.delete(id);
        showToast('Utente eliminado com sucesso', 'success');
        reloadCurrentPage();
    } catch (error) {
        showToast('Erro: ' + error.message, 'error');
    }
}
