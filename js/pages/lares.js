// Lares Page
function sanitizePhone(value) {
    return (value || '').replace(/[^0-9+\s]/g, '').slice(0, 16);
}
async function loadLares() {
    const pageContent = document.getElementById('pageContent');
    
    try {
        const response = await LaresAPI.getAll();
        const lares = response.data;

        let html = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">Lares</h1>
                    <p class="page-subtitle">Gestão de lares de 3ª idade</p>
                </div>
                ${Auth.isAdminGeral() ? '<button class="btn btn-primary" onclick="showCreateLarModal()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Novo Lar</button>' : ''}
            </div>

            <div class="card">
        `;

        if (lares.length === 0) {
            html += showEmptyState(
                'Nenhum lar encontrado',
                'Comece por criar o primeiro lar',
                Auth.isAdminGeral() ? 'Criar Lar' : '',
                'showCreateLarModal()'
            );
        } else {
            html += `
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Morada</th>
                                <th>Telefone</th>
                                <th>Email</th>
                                <th>Capacidade</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            lares.forEach(lar => {
                html += `
                    <tr>
                        <td><strong>${lar.nome}</strong></td>
                        <td>${lar.morada}</td>
                        <td>${lar.telefone}</td>
                        <td>${lar.email}</td>
                        <td>${lar.capacidade}</td>
                        <td>
                            ${Auth.isAdminGeral() ? `
                                <button class="btn btn-sm btn-outline btn-edit-lar" data-lar='${JSON.stringify(lar)}'>Editar</button>
                                <form method="POST" action="api/lares.php" style="display:inline;" onsubmit="return confirm('Tem a certeza que deseja eliminar ${lar.nome.replace(/'/g, "\\'")}'?');">
                                    <input type="hidden" name="_method" value="DELETE">
                                    <input type="hidden" name="id" value="${lar.id}">
                                    <button type="submit" class="btn btn-sm btn-danger">Eliminar</button>
                                </form>
                            ` : '-'}
                        </td>
                    </tr>
                `;
            });

            html += `
                        </tbody>
                    </table>
                </div>
            `;
        }

        html += '</div>';
        pageContent.innerHTML = html;
        
        // Attach edit button handlers
        document.querySelectorAll('.btn-edit-lar').forEach(btn => {
            btn.addEventListener('click', () => {
                const lar = JSON.parse(btn.getAttribute('data-lar'));
                showEditLarModal(lar);
            });
        });
    } catch (error) {
        showToast('Erro ao carregar lares', 'error');
    }
}

function showCreateLarModal() {
    const content = `
        <form id="createLarForm">
            <div class="form-group">
                <label for="larNome">Nome *</label>
                <input type="text" id="larNome" required>
            </div>
            <div class="form-group">
                <label for="larMorada">Morada *</label>
                <textarea id="larMorada" required></textarea>
            </div>
            <div class="form-group">
                <label for="larTelefone">Telefone *</label>
                <input type="tel" id="larTelefone" required inputmode="numeric" pattern="[0-9+\s]*" maxlength="16" oninput="this.value=this.value.replace(/[^0-9+\s]/g,'')">
            </div>
            <div class="form-group">
                <label for="larEmail">Email *</label>
                <input type="email" id="larEmail" required>
            </div>
            <div class="form-group">
                <label for="larCapacidade">Capacidade *</label>
                <input type="number" id="larCapacidade" required min="1">
            </div>
        </form>
    `;

    const footer = `
        <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="createLar()">Criar Lar</button>
    `;

    showModal('Novo Lar', content, footer);
}

async function createLar() {
    const data = {
        nome: document.getElementById('larNome').value,
        morada: document.getElementById('larMorada').value,
        telefone: sanitizePhone(document.getElementById('larTelefone').value),
        email: document.getElementById('larEmail').value,
        capacidade: parseInt(document.getElementById('larCapacidade').value)
    };

    try {
        await LaresAPI.create(data);
        closeModal();
        showToast('Lar criado com sucesso', 'success');
        reloadCurrentPage();
    } catch (error) {
        showToast('Erro ao criar lar: ' + error.message, 'error');
    }
}

function showEditLarModal(lar) {
    const content = `
        <form id="editLarForm">
            <input type="hidden" id="larId" value="${lar.id}">
            <div class="form-group">
                <label for="larNome">Nome *</label>
                <input type="text" id="larNome" value="${lar.nome}" required>
            </div>
            <div class="form-group">
                <label for="larMorada">Morada *</label>
                <textarea id="larMorada" required>${lar.morada}</textarea>
            </div>
            <div class="form-group">
                <label for="larTelefone">Telefone *</label>
                <input type="tel" id="larTelefone" value="${lar.telefone}" required inputmode="numeric" pattern="[0-9+\s]*" maxlength="16" oninput="this.value=this.value.replace(/[^0-9+\s]/g,'')">
            </div>
            <div class="form-group">
                <label for="larEmail">Email *</label>
                <input type="email" id="larEmail" value="${lar.email}" required>
            </div>
            <div class="form-group">
                <label for="larCapacidade">Capacidade *</label>
                <input type="number" id="larCapacidade" value="${lar.capacidade}" required min="1">
            </div>
        </form>
    `;

    const footer = `
        <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="updateLar()">Atualizar</button>
    `;

    showModal('Editar Lar', content, footer);
}

async function updateLar() {
    const data = {
        id: parseInt(document.getElementById('larId').value),
        nome: document.getElementById('larNome').value,
        morada: document.getElementById('larMorada').value,
        telefone: sanitizePhone(document.getElementById('larTelefone').value),
        email: document.getElementById('larEmail').value,
        capacidade: parseInt(document.getElementById('larCapacidade').value)
    };

    try {
        await LaresAPI.update(data);
        closeModal();
        showToast('Lar atualizado com sucesso', 'success');
        reloadCurrentPage();
    } catch (error) {
        showToast('Erro ao atualizar lar: ' + error.message, 'error');
    }
}

async function deleteLar(id) {
    if (!confirm('Tem a certeza que deseja eliminar este lar?')) return;

    try {
        await LaresAPI.delete(id);
        showToast('Lar eliminado com sucesso', 'success');
        reloadCurrentPage();
    } catch (error) {
        showToast('Erro ao eliminar lar: ' + error.message, 'error');
    }
}
