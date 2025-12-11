// Terapêuticas Page
let utentesData = [];
let medicamentosData = [];

async function loadTerapeuticas() {
    const pageContent = document.getElementById('pageContent');
    
    try {
        const [terapeuticasResponse, utentesResponse, medicamentosResponse] = await Promise.all([
            TerapeuticasAPI.getAll(),
            UtentesAPI.getAll(),
            MedicamentosAPI.getAll()
        ]);
        
        const terapeuticas = terapeuticasResponse.data;
        utentesData = utentesResponse.data;
        medicamentosData = medicamentosResponse.data;

        let html = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">Terapêuticas</h1>
                    <p class="page-subtitle">Gestão de terapêuticas dos utentes</p>
                </div>
                <button class="btn btn-primary" onclick="showCreateTerapeuticaModal()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Nova Terapêutica
                </button>
            </div>

            <div class="card">
        `;

        if (terapeuticas.length === 0) {
            html += showEmptyState('Nenhuma terapêutica encontrada', 'Comece por criar a primeira terapêutica', 'Criar Terapêutica', 'showCreateTerapeuticaModal()');
        } else {
            html += `
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Utente</th>
                                <th>Medicamento</th>
                                <th>Tipo</th>
                                <th>Data Início</th>
                                <th>Data Fim</th>
                                <th>Horários</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            terapeuticas.forEach(ter => {
                const horarios = ter.horarios && ter.horarios.length > 0 
                    ? ter.horarios.map(h => `${h.hora} (${formatDaysArray(JSON.parse(h.dias_semana))})`).join('<br>')
                    : '-';

                html += `
                    <tr>
                        <td><strong>${ter.utente_nome}</strong></td>
                        <td>${ter.medicamento_nome}<br><small>${ter.dose} - ${getTipoTomaLabel(ter.toma)}</small></td>
                        <td>${getTipoTerapeuticaBadge(ter.tipo)}</td>
                        <td>${formatDate(ter.data_inicio)}</td>
                        <td>${ter.data_fim ? formatDate(ter.data_fim) : '-'}</td>
                        <td><small>${horarios}</small></td>
                        <td>
                            <button class="btn btn-sm btn-outline btn-edit-ter" data-ter='${JSON.stringify(ter)}'>Editar</button>
                            <form method="POST" action="api/terapeuticas.php" style="display:inline;" onsubmit="return confirm('Tem a certeza que deseja eliminar esta terap\u00eautica?');">
                                <input type="hidden" name="_method" value="DELETE">
                                <input type="hidden" name="id" value="${ter.id}">
                                <button type="submit" class="btn btn-sm btn-danger">Eliminar</button>
                            </form>
                        </td>
                    </tr>
                `;
            });

            html += '</tbody></table></div>';
        }

        html += '</div>';
        pageContent.innerHTML = html;
        
        // Attach edit button handlers
        document.querySelectorAll('.btn-edit-ter').forEach(btn => {
            btn.addEventListener('click', () => {
                const ter = JSON.parse(btn.getAttribute('data-ter'));
                showEditTerapeuticaModal(ter);
            });
        });
    } catch (error) {
        showToast('Erro ao carregar terapêuticas', 'error');
    }
}

function showCreateTerapeuticaModal() {
    const utentesOptions = utentesData.map(u => `<option value="${u.id}">${u.nome} (${u.numero_utente})</option>`).join('');
    const medicamentosOptions = medicamentosData.map(m => `<option value="${m.id}">${m.nome} - ${m.dose}</option>`).join('');
    
    const content = `
        <form>
            <div class="form-group">
                <label>Utente *</label>
                <select id="terUtente" required>${utentesOptions}</select>
            </div>
            <div class="form-group">
                <label>Medicamento *</label>
                <select id="terMedicamento" required>${medicamentosOptions}</select>
            </div>
            <div class="form-group">
                <label>Tipo *</label>
                <select id="terTipo" required onchange="toggleHorarios()">
                    <option value="continua">Contínua</option>
                    <option value="temporaria">Temporária</option>
                    <option value="sos">SOS</option>
                </select>
            </div>
            <div class="form-group">
                <label>Data Início *</label>
                <input type="date" id="terDataInicio" required>
            </div>
            <div class="form-group" id="dataFimGroup" style="display:none;">
                <label>Data Fim</label>
                <input type="date" id="terDataFim">
            </div>
            <div id="horariosSection">
                <div class="form-group">
                    <label>Horários</label>
                    <div id="horariosContainer">
                        <div class="horario-item" style="display: flex; gap: 12px; margin-bottom: 12px;">
                            <input type="time" class="horario-hora" style="flex: 1;">
                            <input type="text" class="horario-dias" placeholder="0,1,2,3,4,5,6" style="flex: 1;">
                        </div>
                    </div>
                    <button type="button" class="btn btn-sm btn-outline" onclick="addHorario()">+ Adicionar Horário</button>
                    <small style="display: block; margin-top: 8px; color: var(--gray-500);">Dias: 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb</small>
                </div>
            </div>
            <div class="form-group">
                <label>Observações</label>
                <textarea id="terObservacoes"></textarea>
            </div>
        </form>
    `;

    const footer = `
        <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="createTerapeutica()">Criar</button>
    `;

    showModal('Nova Terapêutica', content, footer);
}

function toggleHorarios() {
    const tipo = document.getElementById('terTipo').value;
    const horariosSection = document.getElementById('horariosSection');
    const dataFimGroup = document.getElementById('dataFimGroup');
    
    if (tipo === 'sos') {
        horariosSection.style.display = 'none';
    } else {
        horariosSection.style.display = 'block';
    }
    
    if (tipo === 'temporaria') {
        dataFimGroup.style.display = 'block';
    } else {
        dataFimGroup.style.display = 'none';
    }
}

function addHorario() {
    const container = document.getElementById('horariosContainer');
    const div = document.createElement('div');
    div.className = 'horario-item';
    div.style.cssText = 'display: flex; gap: 12px; margin-bottom: 12px;';
    div.innerHTML = `
        <input type="time" class="horario-hora" style="flex: 1;">
        <input type="text" class="horario-dias" placeholder="0,1,2,3,4,5,6" style="flex: 1;">
        <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">×</button>
    `;
    container.appendChild(div);
}

async function createTerapeutica() {
    const tipo = document.getElementById('terTipo').value;
    const horarios = [];
    
    if (tipo !== 'sos') {
        document.querySelectorAll('.horario-item').forEach(item => {
            const hora = item.querySelector('.horario-hora').value;
            const dias = item.querySelector('.horario-dias').value;
            
            if (hora && dias) {
                horarios.push({
                    hora: hora,
                    dias_semana: dias.split(',').map(d => parseInt(d.trim()))
                });
            }
        });
    }

    const data = {
        utente_id: parseInt(document.getElementById('terUtente').value),
        medicamento_id: parseInt(document.getElementById('terMedicamento').value),
        tipo: tipo,
        data_inicio: document.getElementById('terDataInicio').value,
        data_fim: document.getElementById('terDataFim')?.value || null,
        observacoes: document.getElementById('terObservacoes').value,
        horarios: horarios
    };

    try {
        await TerapeuticasAPI.create(data);
        closeModal();
        showToast('Terapêutica criada com sucesso', 'success');
        reloadCurrentPage();
    } catch (error) {
        showToast('Erro: ' + error.message, 'error');
    }
}

function showEditTerapeuticaModal(ter) {
    const content = `
        <form>
            <input type="hidden" id="terId" value="${ter.id}">
            <div class="form-group">
                <label>Utente</label>
                <input type="text" value="${ter.utente_nome}" disabled>
            </div>
            <div class="form-group">
                <label>Medicamento</label>
                <input type="text" value="${ter.medicamento_nome}" disabled>
            </div>
            <div class="form-group">
                <label>Tipo</label>
                <input type="text" value="${getTipoTerapeuticaLabel(ter.tipo)}" disabled>
            </div>
            <div class="form-group">
                <label>Data Fim</label>
                <input type="date" id="terDataFim" value="${ter.data_fim || ''}">
            </div>
            <div class="form-group">
                <label>Observações</label>
                <textarea id="terObservacoes">${ter.observacoes || ''}</textarea>
            </div>
            <div class="form-group">
                <label>Estado</label>
                <select id="terAtivo">
                    <option value="1" ${ter.ativo ? 'selected' : ''}>Ativa</option>
                    <option value="0" ${!ter.ativo ? 'selected' : ''}>Inativa</option>
                </select>
            </div>
        </form>
    `;

    const footer = `
        <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="updateTerapeutica()">Atualizar</button>
    `;

    showModal('Editar Terapêutica', content, footer);
}

async function updateTerapeutica() {
    const data = {
        id: parseInt(document.getElementById('terId').value),
        data_fim: document.getElementById('terDataFim').value || null,
        observacoes: document.getElementById('terObservacoes').value,
        ativo: parseInt(document.getElementById('terAtivo').value)
    };

    try {
        await TerapeuticasAPI.update(data);
        closeModal();
        showToast('Terapêutica atualizada com sucesso', 'success');
        reloadCurrentPage();
    } catch (error) {
        showToast('Erro: ' + error.message, 'error');
    }
}

async function deleteTerapeutica(id) {
    if (!confirm('Tem a certeza que deseja eliminar esta terapêutica?')) return;

    try {
        await TerapeuticasAPI.delete(id);
        showToast('Terapêutica eliminada com sucesso', 'success');
        reloadCurrentPage();
    } catch (error) {
        showToast('Erro: ' + error.message, 'error');
    }
}
