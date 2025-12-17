// Medicamentos Page
async function loadMedicamentos() {
    const pageContent = document.getElementById('pageContent');
    
    try {
        const [medicamentosResponse, laresResponse] = await Promise.all([
            MedicamentosAPI.getAll(),
            LaresAPI.getAll()
        ]);
        
        const medicamentos = medicamentosResponse.data;
        window.laresData = laresResponse.data;

        let html = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">Medicamentos</h1>
                    <p class="page-subtitle">Gestão de medicamentos</p>
                </div>
                <div style="display: flex; gap: 12px;">
                    ${Auth.isAdmin() ? `
                        <button class="btn btn-secondary" onclick="showImportCSVModal()">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            Importar CSV
                        </button>
                        <button class="btn btn-primary" onclick="showCreateMedicamentoModal()">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            Novo Medicamento
                        </button>
                    ` : ''}
                </div>
            </div>

            <div class="card">
        `;

        if (medicamentos.length === 0) {
            html += showEmptyState('Nenhum medicamento encontrado', 'Adicione medicamentos manualmente ou importe via CSV', Auth.isAdmin() ? 'Adicionar Medicamento' : '', 'showCreateMedicamentoModal()');
        } else {
            html += `
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Princípio Ativo</th>
                                <th>Marca</th>
                                <th>Dose</th>
                                <th>Toma</th>
                                ${Auth.isAdminGeral() ? '<th>Lar</th>' : ''}
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            medicamentos.forEach(med => {
                html += `
                    <tr>
                        <td><strong>${med.nome}</strong></td>
                        <td>${med.principio_ativo}</td>
                        <td>${med.marca}</td>
                        <td>${med.dose}</td>
                        <td>${getBadge(getTipoTomaLabel(med.toma), 'info')}</td>
                        ${Auth.isAdminGeral() ? `<td>${med.lar_nome}</td>` : ''}
                        <td>
                            ${Auth.isAdmin() ? `
                                <button class="btn btn-sm btn-outline btn-edit-med" data-med='${JSON.stringify(med)}'>Editar</button>
                                <form method="POST" action="api/medicamentos.php" style="display:inline;" onsubmit="return confirm('Tem a certeza que deseja eliminar ${med.nome.replace(/'/g, "\\'")}?');">
                                    <input type="hidden" name="_method" value="DELETE">
                                    <input type="hidden" name="id" value="${med.id}">
                                    <button type="submit" class="btn btn-sm btn-danger">Eliminar</button>
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
        
        // Attach edit button handlers
        document.querySelectorAll('.btn-edit-med').forEach(btn => {
            btn.addEventListener('click', () => {
                const med = JSON.parse(btn.getAttribute('data-med'));
                showEditMedicamentoModal(med);
            });
        });
    } catch (error) {
        showToast('Erro ao carregar medicamentos', 'error');
    }
}

function showCreateMedicamentoModal() {
    const laresOptions = window.laresData.map(l => `<option value="${l.id}">${l.nome}</option>`).join('');
    
    const content = `
        <form>
            <div class="form-group">
                <label>Nome *</label>
                <input type="text" id="medNome" required>
            </div>
            <div class="form-group">
                <label>Princípio Ativo *</label>
                <input type="text" id="medPrincipioAtivo" required>
            </div>
            <div class="form-group">
                <label>Marca *</label>
                <input type="text" id="medMarca" required>
            </div>
            <div class="form-group">
                <label>Dose *</label>
                <input type="text" id="medDose" required placeholder="Ex: 500mg">
            </div>
            <div class="form-group">
                <label>Tipo de Toma *</label>
                <select id="medToma" required>
                    <option value="oral">Oral</option>
                    <option value="injetavel">Injetável</option>
                    <option value="topica">Tópica</option>
                    <option value="sublingual">Sublingual</option>
                    <option value="inalacao">Inalação</option>
                    <option value="retal">Retal</option>
                    <option value="ocular">Ocular</option>
                    <option value="auricular">Auricular</option>
                    <option value="nasal">Nasal</option>
                </select>
            </div>
            <div class="form-group">
                <label>Lar *</label>
                <select id="medLar" required>${laresOptions}</select>
            </div>
            <div class="form-group">
                <label>Mínimo</label>
                <input type="number" id="medMinimo" min="0" value="0">
            </div>
            <div class="form-group">
                <label>Validade</label>
                <input type="date" id="medValidade">
            </div>
        </form>
    `;

    const footer = `
        <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="createMedicamento()">Criar</button>
    `;

    showModal('Novo Medicamento', content, footer);
}

async function createMedicamento() {
    const medicamentoData = {
        nome: document.getElementById('medNome').value,
        principio_ativo: document.getElementById('medPrincipioAtivo').value,
        marca: document.getElementById('medMarca').value,
        dose: document.getElementById('medDose').value,
        toma: document.getElementById('medToma').value,
        lar_id: parseInt(document.getElementById('medLar').value),
        minimo: parseInt(document.getElementById('medMinimo').value || '0'),
        validade: document.getElementById('medValidade').value || null
    };

    try {
        // 1. Criar medicamento
        const medResult = await MedicamentosAPI.create(medicamentoData);
        const medicamentoId = medResult.id;
        
        // 2. Criar stock inicial (contador a 0) para todos os utentes do lar
        const utentesResponse = await UtentesAPI.getAll();
        const utentesDoLar = utentesResponse.data.filter(u => u.lar_id === medicamentoData.lar_id);
        
        // Criar stock para cada utente (quantidade inicial = 0)
        for (const utente of utentesDoLar) {
            await StocksAPI.create({
                medicamento_id: medicamentoId,
                utente_id: utente.id,
                quantidade: 0,
                quantidade_minima: medicamentoData.minimo
            });
        }
        
        closeModal();
        showToast('Medicamento e stock criados com sucesso', 'success');
        reloadCurrentPage();
    } catch (error) {
        showToast('Erro: ' + error.message, 'error');
    }
}

function showEditMedicamentoModal(med) {
    const medMinimo = (med.minimo !== undefined && med.minimo !== null) ? med.minimo : 0;
    const medValidade = (med.validade !== undefined && med.validade !== null) ? med.validade : '';

    const content = `
        <form>
            <input type="hidden" id="medId" value="${med.id}">
            <div class="form-group">
                <label>Nome *</label>
                <input type="text" id="medNome" value="${med.nome}" required>
            </div>
            <div class="form-group">
                <label>Princípio Ativo *</label>
                <input type="text" id="medPrincipioAtivo" value="${med.principio_ativo}" required>
            </div>
            <div class="form-group">
                <label>Marca *</label>
                <input type="text" id="medMarca" value="${med.marca}" required>
            </div>
            <div class="form-group">
                <label>Dose *</label>
                <input type="text" id="medDose" value="${med.dose}" required>
            </div>
            <div class="form-group">
                <label>Tipo de Toma *</label>
                <select id="medToma" required>
                    <option value="oral" ${med.toma === 'oral' ? 'selected' : ''}>Oral</option>
                    <option value="injetavel" ${med.toma === 'injetavel' ? 'selected' : ''}>Injetável</option>
                    <option value="topica" ${med.toma === 'topica' ? 'selected' : ''}>Tópica</option>
                    <option value="sublingual" ${med.toma === 'sublingual' ? 'selected' : ''}>Sublingual</option>
                    <option value="inalacao" ${med.toma === 'inalacao' ? 'selected' : ''}>Inalação</option>
                    <option value="retal" ${med.toma === 'retal' ? 'selected' : ''}>Retal</option>
                    <option value="ocular" ${med.toma === 'ocular' ? 'selected' : ''}>Ocular</option>
                    <option value="auricular" ${med.toma === 'auricular' ? 'selected' : ''}>Auricular</option>
                    <option value="nasal" ${med.toma === 'nasal' ? 'selected' : ''}>Nasal</option>
                </select>
            </div>
            <div class="form-group">
                <label>Mínimo</label>
                <input type="number" id="medMinimo" min="0" value="${medMinimo}">
            </div>
            <div class="form-group">
                <label>Validade</label>
                <input type="date" id="medValidade" value="${medValidade}">
            </div>
        </form>
    `;

    const footer = `
        <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="updateMedicamento()">Atualizar</button>
    `;

    showModal('Editar Medicamento', content, footer);
}

async function updateMedicamento() {
    const data = {
        id: parseInt(document.getElementById('medId').value),
        nome: document.getElementById('medNome').value,
        principio_ativo: document.getElementById('medPrincipioAtivo').value,
        marca: document.getElementById('medMarca').value,
        dose: document.getElementById('medDose').value,
        toma: document.getElementById('medToma').value,
        minimo: parseInt(document.getElementById('medMinimo').value || '0'),
        validade: document.getElementById('medValidade').value || null
    };

    try {
        await MedicamentosAPI.update(data);
        closeModal();
        showToast('Medicamento atualizado com sucesso', 'success');
        reloadCurrentPage();
    } catch (error) {
        showToast('Erro: ' + error.message, 'error');
    }
}

async function deleteMedicamento(id) {
    if (!confirm('Tem a certeza que deseja eliminar este medicamento?')) return;

    try {
        await MedicamentosAPI.delete(id);
        showToast('Medicamento eliminado com sucesso', 'success');
        reloadCurrentPage();
    } catch (error) {
        showToast('Erro: ' + error.message, 'error');
    }
}

function showImportCSVModal() {
    const laresOptions = window.laresData.map(l => `<option value="${l.id}">${l.nome}</option>`).join('');
    
    const content = `
        <form id="importCSVForm">
            <div class="form-group">
                <label>Lar *</label>
                <select id="csvLar" required>${laresOptions}</select>
            </div>
            <div class="form-group">
                <label>Ficheiro CSV *</label>
                <input type="file" id="csvFile" accept=".csv" required>
                <small style="color: var(--gray-500); display: block; margin-top: 8px;">
                    Formato: Nome, Princípio Ativo, Marca, Dose, Toma<br>
                    Exemplo: Paracetamol, Paracetamol, Ben-u-ron, 500mg, oral
                </small>
            </div>
        </form>
    `;

    const footer = `
        <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="importCSV()">Importar</button>
    `;

    showModal('Importar Medicamentos via CSV', content, footer);
}

async function importCSV() {
    const larId = document.getElementById('csvLar').value;
    const fileInput = document.getElementById('csvFile');
    const file = fileInput.files[0];

    if (!file) {
        showToast('Por favor selecione um ficheiro', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('csv_file', file);
    formData.append('lar_id', larId);

    try {
        const response = await MedicamentosAPI.importCSV(formData);
        closeModal();
        showToast(response.message, 'success');
        reloadCurrentPage();
    } catch (error) {
        showToast('Erro ao importar: ' + error.message, 'error');
    }
}
