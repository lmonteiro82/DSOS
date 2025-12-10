// Administrações Page
async function loadAdministracoes() {
    const pageContent = document.getElementById('pageContent');
    
    try {
        const [administracoesResponse, terapeuticasResponse] = await Promise.all([
            AdministracoesAPI.getAll(),
            TerapeuticasAPI.getAll()
        ]);
        
        const administracoes = administracoesResponse.data;
        window.terapeuticasData = terapeuticasResponse.data;

        let html = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">Administrações</h1>
                    <p class="page-subtitle">Registo e validação de administrações</p>
                </div>
                <button class="btn btn-primary" onclick="showRegistarAdministracaoModal()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Registar Administração
                </button>
            </div>

            <div class="card">
        `;

        if (administracoes.length === 0) {
            html += showEmptyState('Nenhuma administração encontrada', 'Comece por registar a primeira administração', 'Registar Administração', 'showRegistarAdministracaoModal()');
        } else {
            html += `
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Data/Hora</th>
                                <th>Utente</th>
                                <th>Medicamento</th>
                                <th>Tipo</th>
                                <th>Administrada</th>
                                <th>Validada</th>
                                <th>Administrado Por</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            administracoes.forEach(adm => {
                html += `
                    <tr>
                        <td>${formatDateTime(adm.data_hora)}</td>
                        <td><strong>${adm.utente_nome}</strong></td>
                        <td>${adm.medicamento_nome}</td>
                        <td>${getTipoTerapeuticaBadge(adm.terapeutica_tipo)}</td>
                        <td>${adm.administrada ? getBadge('Sim', 'success') : getBadge('Não', 'danger')}</td>
                        <td>${adm.validada ? getBadge('Sim', 'success') : getBadge('Pendente', 'warning')}</td>
                        <td>${adm.administrado_por_nome}</td>
                        <td>
                            ${!adm.validada && Auth.isAdmin() ? `
                                <button class="btn btn-sm btn-secondary" onclick="validateAdministracao(${adm.id}, ${adm.administrada})">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"/></svg>
                                    Validar
                                </button>
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
        showToast('Erro ao carregar administrações', 'error');
    }
}

function showRegistarAdministracaoModal() {
    const terapeuticasOptions = window.terapeuticasData
        .filter(t => t.ativo)
        .map(t => `<option value="${t.id}">${t.utente_nome} - ${t.medicamento_nome} (${getTipoTerapeuticaLabel(t.tipo)})</option>`)
        .join('');
    
    const content = `
        <form>
            <div class="form-group">
                <label>Terapêutica *</label>
                <select id="admTerapeutica" required>${terapeuticasOptions}</select>
            </div>
            <div class="form-group">
                <label>Data e Hora *</label>
                <input type="datetime-local" id="admDataHora" required>
            </div>
            <div class="form-group">
                <label>Administrada *</label>
                <select id="admAdministrada" required onchange="toggleMotivoNaoAdministracao()">
                    <option value="1">Sim</option>
                    <option value="0">Não</option>
                </select>
            </div>
            <div class="form-group" id="motivoGroup" style="display: none;">
                <label>Motivo Não Administração *</label>
                <textarea id="admMotivo"></textarea>
            </div>
            <div class="form-group">
                <label>Observações</label>
                <textarea id="admObservacoes"></textarea>
            </div>
        </form>
    `;

    const footer = `
        <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="registarAdministracao()">Registar</button>
    `;

    showModal('Registar Administração', content, footer);
    
    // Set current datetime
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('admDataHora').value = now.toISOString().slice(0, 16);
}

function toggleMotivoNaoAdministracao() {
    const administrada = document.getElementById('admAdministrada').value;
    const motivoGroup = document.getElementById('motivoGroup');
    
    if (administrada === '0') {
        motivoGroup.style.display = 'block';
    } else {
        motivoGroup.style.display = 'none';
    }
}

async function registarAdministracao() {
    const administrada = document.getElementById('admAdministrada').value === '1';
    
    const data = {
        terapeutica_id: parseInt(document.getElementById('admTerapeutica').value),
        data_hora: document.getElementById('admDataHora').value,
        administrada: administrada,
        motivo_nao_administracao: administrada ? null : document.getElementById('admMotivo').value,
        observacoes: document.getElementById('admObservacoes').value
    };

    try {
        await AdministracoesAPI.create(data);
        closeModal();
        showToast('Administração registada com sucesso', 'success');
        reloadCurrentPage();
    } catch (error) {
        showToast('Erro: ' + error.message, 'error');
    }
}

async function validateAdministracao(id, administrada) {
    if (!confirm('Tem a certeza que deseja validar esta administração?')) return;

    const data = {
        id: id,
        administrada: administrada
    };

    try {
        await AdministracoesAPI.validate(data);
        showToast('Administração validada com sucesso', 'success');
        reloadCurrentPage();
    } catch (error) {
        showToast('Erro: ' + error.message, 'error');
    }
}
