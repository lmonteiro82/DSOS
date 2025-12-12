// Stocks Page
async function loadStocks() {
    const pageContent = document.getElementById('pageContent');
    
    try {
        const [stocksResponse, stockGeralResponse, utentesResponse, medicamentosResponse] = await Promise.all([
            StocksAPI.getAll(),
            StocksAPI.getGeral(),
            UtentesAPI.getAll(),
            MedicamentosAPI.getAll()
        ]);
        
        const stocks = stocksResponse.data;
        const stockGeral = stockGeralResponse.data;
        window.utentesData = utentesResponse.data;
        window.medicamentosData = medicamentosResponse.data;

        let html = `
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
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Stock por Medicamento</h3>
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Medicamento</th>
                                <th>Dose</th>
                                <th>Toma</th>
                                ${Auth.isAdminGeral() ? '<th>Lar</th>' : ''}
                                <th>Quantidade em Stock</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        if (stockGeral.length === 0) {
            html += '<tr><td colspan="5" style="text-align: center; padding: 40px;">Nenhum stock disponível</td></tr>';
        } else {
            stockGeral.forEach(stock => {
                html += `
                    <tr>
                        <td><strong>${stock.medicamento_nome}</strong></td>
                        <td>${stock.dose}</td>
                        <td>${getBadge(getTipoTomaLabel(stock.toma), 'info')}</td>
                        ${Auth.isAdminGeral() ? `<td>${stock.lar_nome || '-'}</td>` : ''}
                        <td><span class="badge badge-success">${stock.quantidade_total}</span></td>
                    </tr>
                `;
            });
        }

        html += `
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Stock por Utente -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Stock por Utente</h3>
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Utente</th>
                                <th>Medicamento</th>
                                <th>Quantidade</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        if (stocks.length === 0) {
            html += '<tr><td colspan="3" style="text-align: center; padding: 40px;">Nenhum stock disponível</td></tr>';
        } else {
            stocks.forEach(stock => {
                html += `
                    <tr>
                        <td><strong>${stock.utente_nome}</strong></td>
                        <td>${stock.medicamento_nome}<br><small>${stock.dose} - ${getTipoTomaLabel(stock.toma)}</small></td>
                        <td><span class="badge badge-success">${stock.quantidade}</span></td>
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
        showToast('Erro ao carregar stocks', 'error');
    }
}

function showAddStockModal() {
    const utentesOptions = window.utentesData.map(u => `<option value="${u.id}">${u.nome} (${u.numero_utente})</option>`).join('');
    const medicamentosOptions = window.medicamentosData.map(m => `<option value="${m.id}">${m.nome} - ${m.dose}</option>`).join('');
    
    const content = `
        <form>
            <div class="form-group">
                <label>Utente *</label>
                <select id="stockUtente" required>${utentesOptions}</select>
            </div>
            <div class="form-group">
                <label>Medicamento *</label>
                <select id="stockMedicamento" required>${medicamentosOptions}</select>
            </div>
            <div class="form-group">
                <label>Quantidade *</label>
                <input type="number" id="stockQuantidade" required min="0">
            </div>
            <div class="form-group">
                <label>Quantidade Mínima</label>
                <input type="number" id="stockQuantidadeMinima" value="10" min="0">
            </div>
        </form>
    `;

    const footer = `
        <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="addStock()">Adicionar</button>
    `;

    showModal('Adicionar Stock', content, footer);
}

async function addStock() {
    const data = {
        utente_id: parseInt(document.getElementById('stockUtente').value),
        medicamento_id: parseInt(document.getElementById('stockMedicamento').value),
        quantidade: parseInt(document.getElementById('stockQuantidade').value),
        quantidade_minima: parseInt(document.getElementById('stockQuantidadeMinima').value),
    };

    try {
        await StocksAPI.create(data);
        closeModal();
        showToast('Stock adicionado com sucesso', 'success');
        reloadCurrentPage();
    } catch (error) {
        showToast('Erro: ' + error.message, 'error');
    }
}

function showEditStockModal(stock) {
    const content = `
        <form>
            <input type="hidden" id="stockId" value="${stock.id}">
            <div class="form-group">
                <label>Utente</label>
                <input type="text" value="${stock.utente_nome}" disabled>
            </div>
            <div class="form-group">
                <label>Medicamento</label>
                <input type="text" value="${stock.medicamento_nome}" disabled>
            </div>
            <div class="form-group">
                <label>Quantidade *</label>
                <input type="number" id="stockQuantidade" value="${stock.quantidade}" required min="0">
            </div>
            <div class="form-group">
                <label>Quantidade Mínima</label>
                <input type="number" id="stockQuantidadeMinima" value="${stock.quantidade_minima}" min="0">
            </div>
            <div class="form-group">
                <label>Lote</label>
                <input type="text" id="stockLote" value="${stock.lote || ''}">
            </div>
        </form>
    `;

    const footer = `
        <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="updateStock()">Atualizar</button>
    `;

    showModal('Editar Stock', content, footer);
}

async function updateStock() {
    const data = {
        id: parseInt(document.getElementById('stockId').value),
        quantidade: parseInt(document.getElementById('stockQuantidade').value),
        quantidade_minima: parseInt(document.getElementById('stockQuantidadeMinima').value),
        lote: document.getElementById('stockLote').value
    };

    try {
        await StocksAPI.update(data);
        closeModal();
        showToast('Stock atualizado com sucesso', 'success');
        reloadCurrentPage();
    } catch (error) {
        showToast('Erro: ' + error.message, 'error');
    }
}
