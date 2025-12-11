// Administrações Page
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = String(str ?? '');
    return div.innerHTML;
}
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
                <button class="btn btn-primary" id="btnRegistarAdm">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Registar Administração
                </button>
            </div>

            <div class="card">
        `;

        if (administracoes.length === 0) {
            html += `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <h3>Nenhuma administração encontrada</h3>
                    <p>Comece por registar a primeira administração</p>
                    <button class="btn btn-primary btn-registar-empty">Registar Administração</button>
                </div>
            `;
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
                                <th>Observações</th>
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
                        <td>${(Number(adm.administrada) === 1) ? getBadge('Sim', 'success') : getBadge('Não', 'danger')}</td>
                        <td>${(Number(adm.validada) === 1) ? getBadge('Sim', 'success') : getBadge('Pendente', 'warning')}</td>
                        <td>${adm.observacoes ? escapeHtml(adm.observacoes) : '-'}</td>
                        <td>
                            ${(Number(adm.validada) !== 1 && Number(adm.administrada) === 1 && Auth.isAdmin()) ? `
                                <form method="POST" action="api/administracoes.php" style="display:inline;" onsubmit="return confirm('Tem a certeza que deseja validar esta administração?');">
                                    <input type="hidden" name="_method" value="PUT">
                                    <input type="hidden" name="id" value="${adm.id}">
                                    <input type="hidden" name="administrada" value="1">
                                    <button type="submit" class="btn btn-sm btn-secondary">Validar</button>
                                </form>
                            ` : '-'}
                        </td>
                    </tr>
                `;
            });

            html += '</tbody></table></div>';
        }

        html += '</div>';
        pageContent.innerHTML = html;
        
        // CRITICAL: Remove ALL onclick attributes from ENTIRE document
        document.querySelectorAll('[onclick]').forEach(el => {
            console.log('Removing onclick from:', el);
            el.removeAttribute('onclick');
        });
        
        // Attach button handlers
        const btnReg = document.getElementById('btnRegistarAdm');
        if (btnReg) btnReg.addEventListener('click', showRegistarAdministracaoModal);
        
        const btnEmpty = document.querySelector('.btn-registar-empty');
        if (btnEmpty) btnEmpty.addEventListener('click', showRegistarAdministracaoModal);
        
    } catch (error) {
        showToast('Erro ao carregar administrações', 'error');
    }
}

function showRegistarAdministracaoModal() {
    const terapeuticasOptions = window.terapeuticasData
        .filter(t => t.ativo)
        .map(t => `<option value="${t.id}">${t.utente_nome} - ${t.medicamento_nome} (${getTipoTerapeuticaLabel(t.tipo)})</option>`)
        .join('');
    
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const defaultDateTime = now.toISOString().slice(0, 16);
    
    const content = `
        <form method="POST" action="api/administracoes.php" id="registarAdmForm">
            <div class="form-group">
                <label for="admTerapeutica">Terapêutica *</label>
                <select name="terapeutica_id" id="admTerapeutica" required>
                    <option value="">Selecione...</option>
                    ${terapeuticasOptions}
                </select>
            </div>
            <div class="form-group">
                <label for="admDataHora">Data e Hora *</label>
                <input type="datetime-local" name="data_hora" id="admDataHora" value="${defaultDateTime}" required>
            </div>
            <div class="form-group">
                <label>Administrada *</label>
                <select name="administrada" id="admAdministrada" required onchange="toggleMotivoAdm()">
                    <option value="1">Sim</option>
                    <option value="0">Não</option>
                </select>
            </div>
            <div class="form-group" id="motivoGroup" style="display: none;">
                <label>Motivo Não Administração *</label>
                <textarea name="motivo_nao_administracao" id="admMotivo"></textarea>
            </div>
            <div class="form-group">
                <label>Observações</label>
                <textarea name="observacoes" id="admObservacoes"></textarea>
            </div>
        </form>
        <script>
            function toggleMotivoAdm() {
                const adm = document.getElementById('admAdministrada').value;
                const grupo = document.getElementById('motivoGroup');
                const motivo = document.getElementById('admMotivo');
                if (adm === '0') {
                    grupo.style.display = 'block';
                    motivo.required = true;
                } else {
                    grupo.style.display = 'none';
                    motivo.required = false;
                }
            }
        </script>
    `;

    const footer = `
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancelar</button>
        <button type="submit" form="registarAdmForm" class="btn btn-primary">Registar</button>
    `;

    showModal('Registar Administração', content, footer);
}

function toggleMotivoNaoAdministracao() {
    const administrada = document.getElementById('admAdministrada').value;
    const motivoGroup = document.getElementById('motivoGroup');
    // ...
    if (administrada === '0') {
        motivoGroup.style.display = 'block';
    } else {
        motivoGroup.style.display = 'none';
    }
}

async function registarAdministracao() {
    console.log('=== BOTÃO REGISTAR CLICADO ===');
    
    const administrada = document.getElementById('admAdministrada').value === '1';
    
    const data = {
        terapeutica_id: parseInt(document.getElementById('admTerapeutica').value),
        data_hora: document.getElementById('admDataHora').value,
        administrada: administrada,
        motivo_nao_administracao: administrada ? null : document.getElementById('admMotivo').value,
        observacoes: document.getElementById('admObservacoes').value
    };

    console.log('Dados a enviar:', data);

    try {
        const result = await AdministracoesAPI.create(data);
        console.log('Resultado:', result);
        closeModal();
        showToast('Administração registada com sucesso', 'success');
        await loadAdministracoes();
    } catch (error) {
        console.error('Erro ao registar:', error);
        showToast('Erro: ' + error.message, 'error');
    }
}

