// Pharmacy Nursing Home History Page Loader
async function loadPharmacyNursingHomes() {
    const pageContent = document.getElementById('pageContent');

    try {
        const html = await PharmacyNursingHomesPage.render();
        pageContent.innerHTML = html;
        await PharmacyNursingHomesPage.init();
    } catch (error) {
        console.error('Error loading nursing home history:', error);
        pageContent.innerHTML = `
            <div class="alert alert-error">
                Erro ao carregar página: ${error.message}
            </div>
        `;
    }
}

// Pharmacy Nursing Home History Page
const PharmacyNursingHomesPage = {
    async render() {
        const content = `
            <div class="page-header">
                <h1>Histórico por Lar</h1>
                <p>Consultar histórico de encomendas por lar</p>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3>Selecionar Lar</h3>
                </div>
                <div class="card-body">
                    <div class="form-group">
                        <label for="larHistorySelect">
                            Lar <span class="required">*</span>
                        </label>
                        <select id="larHistorySelect" class="form-input">
                            <option value="">Selecione um lar</option>
                        </select>
                    </div>
                </div>
            </div>

            <div id="larOrdersSection" style="display: none;">
                <div class="card">
                    <div class="card-header">
                        <h3 id="larOrdersTitle">Encomendas</h3>
                    </div>
                    <div class="card-body">
                        <div id="larOrdersContent">
                            <p class="text-muted">Carregando...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        return content;
    },

    async init() {
        await this.loadLares();
        this.setupEventListeners();
    },

    lares: [],

    async loadLares() {
        try {
            // Use existing global API bridge if available, or fall back to LaresAPI
            let result;
            if (window.api && window.api.getLares) {
                result = await window.api.getLares();
            } else if (typeof LaresAPI !== 'undefined') {
                const response = await LaresAPI.getAll();
                result = response.data;
            } else {
                throw new Error('LaresAPI not accessible');
            }

            this.lares = result || [];

            const select = document.getElementById('larHistorySelect');
            select.innerHTML = '<option value="">Selecione um lar</option>';

            this.lares.forEach(lar => {
                const option = document.createElement('option');
                option.value = lar.id;
                option.textContent = `${lar.nome}`;
                select.appendChild(option);
            });

        } catch (error) {
            console.error('Erro ao carregar lares:', error);
            showToast('Erro ao carregar lista de lares', 'error');
        }
    },

    setupEventListeners() {
        const select = document.getElementById('larHistorySelect');
        select.addEventListener('change', async (e) => {
            const larId = e.target.value;
            if (larId) {
                const selectedLar = this.lares.find(l => l.id == larId);
                await this.loadLarOrders(larId, selectedLar);
            } else {
                document.getElementById('larOrdersSection').style.display = 'none';
            }
        });
    },

    async loadLarOrders(larId, lar) {
        const section = document.getElementById('larOrdersSection');
        const title = document.getElementById('larOrdersTitle');
        const content = document.getElementById('larOrdersContent');

        section.style.display = 'block';
        title.textContent = `Encomendas de ${lar?.nome || 'Lar'}`;
        content.innerHTML = '<p class="text-muted">Carregando...</p>';

        try {
            const response = await fetch(`${PHARMACY_API_URL}/history/nursing-home/${larId}`, {
                method: 'GET',
                headers: {
                    'x-api-key': PHARMACY_API_KEY
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao carregar histórico');
            }

            const result = await response.json();
            const orders = result.data || [];

            if (orders.length === 0) {
                content.innerHTML = `
                    <div class="alert alert-info">
                        <p>Nenhuma encomenda encontrada para este lar.</p>
                    </div>
                `;
                return;
            }

            // Display orders
            content.innerHTML = `
                <div class="alert alert-success" style="margin-bottom: 1rem;">
                    <strong>Total de encomendas:</strong> ${orders.length}
                </div>
                ${orders.map((order, index) => this.renderOrderCard(order, index + 1)).join('')}
            `;

            // Add event listeners for cancel buttons
            const cancelButtons = content.querySelectorAll('.btn-cancel-order-nh');
            cancelButtons.forEach(btn => {
                btn.addEventListener('click', async () => {
                    const orderId = btn.dataset.orderId;
                    const orderNumber = btn.dataset.orderNumber;
                    await this.cancelOrder(orderId, orderNumber);
                });
            });

            // Add event listeners for status change dropdowns
            const statusSelects = content.querySelectorAll('.status-select-nh');
            statusSelects.forEach(select => {
                select.addEventListener('change', async (e) => {
                    const orderId = select.dataset.orderId;
                    const currentStatus = select.dataset.currentStatus;
                    const newStatus = e.target.value;

                    if (newStatus && newStatus !== currentStatus) {
                        await this.updateOrderStatus(orderId, newStatus);
                    } else {
                        select.value = currentStatus;
                    }
                });
            });

        } catch (error) {
            console.error('Erro ao carregar histórico:', error);
            content.innerHTML = `
                <div class="alert alert-error">
                    <p>Erro ao carregar histórico de encomendas: ${error.message}</p>
                </div>
            `;
        }
    },

    renderOrderCard(order, index) {
        const statusColors = {
            'SENT_TO_PHARMACY': 'info',
            'PROCESSING': 'warning',
            'SENT_TO_NURSING_HOME': 'info',
            'RECEIVED': 'success',
            'CANCELLED': 'error'
        };

        const statusLabels = {
            'SENT_TO_PHARMACY': 'Enviado para Farmácia',
            'PROCESSING': 'Em Processamento',
            'SENT_TO_NURSING_HOME': 'Enviado para Lar',
            'RECEIVED': 'Recebido',
            'CANCELLED': 'Cancelado'
        };

        const statusColor = statusColors[order.status] || 'info';
        const statusLabel = statusLabels[order.status] || order.status;
        const canCancel = order.status === 'SENT_TO_PHARMACY';
        const canChangeStatus = order.status !== 'CANCELLED';

        return `
            <div class="card order-card" data-order-id="${order.id}" style="margin-bottom: 1rem; border-left: 4px solid var(--${statusColor});">
                <div class="card-header" style="background-color: var(--${statusColor}-light, #f0f0f0); display: flex; justify-content: space-between; align-items: center;">
                    <h4 style="margin: 0;">
                        #${index} - ${order.orderNumber}
                        <span class="badge badge-${statusColor}" style="margin-left: 1rem;">
                            ${statusLabel}
                        </span>
                    </h4>
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        ${canChangeStatus ? `
                            <select class="form-input status-select-nh" data-order-id="${order.id}" data-current-status="${order.status}" style="padding: 0.5rem; font-size: 0.9rem;">
                                <option value="">Alterar Estado...</option>
                                <option value="SENT_TO_PHARMACY" ${order.status === 'SENT_TO_PHARMACY' ? 'selected' : ''}>Enviado para Farmácia</option>
                                <option value="PROCESSING" ${order.status === 'PROCESSING' ? 'selected' : ''}>Em Processamento</option>
                                <option value="SENT_TO_NURSING_HOME" ${order.status === 'SENT_TO_NURSING_HOME' ? 'selected' : ''}>Enviado para Lar</option>
                                <option value="RECEIVED" ${order.status === 'RECEIVED' ? 'selected' : ''}>Recebido</option>
                            </select>
                        ` : ''}
                        ${canCancel ? `
                            <button class="btn btn-danger btn-sm btn-cancel-order-nh" data-order-id="${order.id}" data-order-number="${order.orderNumber}">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style="width: 16px; height: 16px; margin-right: 4px;">
                                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                                </svg>
                                Cancelar
                            </button>
                        ` : ''}
                    </div>
                </div>
                <div class="card-body">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
                        <div>
                            <strong>Utente:</strong><br>
                            ${order.patient?.name || 'N/A'} (${order.patient?.patientNumber || 'N/A'})
                        </div>
                        <div>
                            <strong>Data:</strong><br>
                            ${new Date(order.createdAt).toLocaleString('pt-PT')}
                        </div>
                        <div>
                            <strong>Total:</strong><br>
                            <span style="font-size: 1.2em; color: var(--success);">€${parseFloat(order.totalAmount).toFixed(2)}</span>
                        </div>
                    </div>

                    ${order.receivedAt ? `
                        <div class="alert alert-success" style="margin-bottom: 0.5rem;">
                            ✓ Recebido em: ${new Date(order.receivedAt).toLocaleString('pt-PT')}
                        </div>
                    ` : ''}

                    ${order.cancelledAt ? `
                        <div class="alert alert-error" style="margin-bottom: 0.5rem;">
                            ✗ Cancelado em: ${new Date(order.cancelledAt).toLocaleString('pt-PT')}
                        </div>
                    ` : ''}

                    <details>
                        <summary style="cursor: pointer; font-weight: 600; margin-top: 0.5rem; padding: 0.5rem; background: #f5f5f5; border-radius: 4px;">
                            📦 Ver medicamentos (${order.items?.length || 0} itens)
                        </summary>
                        <table style="width: 100%; margin-top: 1rem; border-collapse: collapse;">
                            <thead>
                                <tr style="background: #f0f0f0; border-bottom: 2px solid #ddd;">
                                    <th style="padding: 0.5rem; text-align: left;">Medicamento</th>
                                    <th style="padding: 0.5rem; text-align: center;">Quantidade</th>
                                    <th style="padding: 0.5rem; text-align: right;">Preço Unit.</th>
                                    <th style="padding: 0.5rem; text-align: right;">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${(order.items || []).map(item => `
                                    <tr style="border-bottom: 1px solid #eee;">
                                        <td style="padding: 0.5rem;">${item.medication?.name || 'N/A'}</td>
                                        <td style="padding: 0.5rem; text-align: center;">${item.quantity}</td>
                                        <td style="padding: 0.5rem; text-align: right;">€${parseFloat(item.unitPrice).toFixed(2)}</td>
                                        <td style="padding: 0.5rem; text-align: right; font-weight: bold;">€${parseFloat(item.subtotal).toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </details>
                </div>
            </div>
        `;
    },

    async updateOrderStatus(orderId, newStatus) {
        const statusLabels = {
            'SENT_TO_PHARMACY': 'Enviado para Farmácia',
            'PROCESSING': 'Em Processamento',
            'SENT_TO_NURSING_HOME': 'Enviado para Lar',
            'RECEIVED': 'Recebido'
        };

        const statusLabel = statusLabels[newStatus] || newStatus;

        window.__pendingStatusUpdateNH = {
            orderId: orderId,
            newStatus: newStatus,
            execute: async function () {
                try {
                    const data = window.__pendingStatusUpdateNH;

                    const response = await fetch(`${PHARMACY_API_URL}/orders/${data.orderId}/status`, {
                        method: 'PUT',
                        headers: {
                            'x-api-key': PHARMACY_API_KEY,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ status: data.newStatus })
                    });

                    if (!response.ok) {
                        const error = await response.json();
                        throw new Error(error.error || 'Erro ao atualizar estado');
                    }

                    showToast('Estado atualizado com sucesso!', 'success');

                    // Reload by triggering change event on select
                    const select = document.getElementById('larHistorySelect');
                    if (select && select.value) {
                        select.dispatchEvent(new Event('change'));
                    }

                    delete window.__pendingStatusUpdateNH;

                } catch (error) {
                    console.error('Erro ao atualizar estado:', error);
                    showToast(error.message, 'error');

                    // Reset dropdown UI
                    const select = document.getElementById('larHistorySelect');
                    if (select && select.value) {
                        select.dispatchEvent(new Event('change'));
                    }

                    delete window.__pendingStatusUpdateNH;
                }
            }
        };

        confirm(`Tem certeza que deseja alterar o estado para "${statusLabel}"?`, window.__pendingStatusUpdateNH.execute);
    },

    cancelOrder(orderId, orderNumber) {
        window.__pendingCancelOrderNH = {
            orderId: orderId,
            orderNumber: orderNumber,
            execute: async function () {
                try {
                    const data = window.__pendingCancelOrderNH;

                    const response = await fetch(`${PHARMACY_API_URL}/orders/${data.orderId}/cancel`, {
                        method: 'PUT',
                        headers: {
                            'x-api-key': PHARMACY_API_KEY,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (!response.ok) {
                        const error = await response.json();
                        throw new Error(error.error || 'Erro ao cancelar encomenda');
                    }

                    showToast('Encomenda cancelada com sucesso!', 'success');

                    const select = document.getElementById('larHistorySelect');
                    if (select && select.value) {
                        select.dispatchEvent(new Event('change'));
                    }

                    delete window.__pendingCancelOrderNH;

                } catch (error) {
                    console.error('Erro ao cancelar:', error);
                    showToast(error.message, 'error');
                    delete window.__pendingCancelOrderNH;
                }
            }
        };

        confirm(`Tem certeza que deseja cancelar a encomenda ${orderNumber}?`, window.__pendingCancelOrderNH.execute);
    }
};

// Register page
if (typeof Pages !== 'undefined') {
    Pages['pharmacy-nursing-homes'] = PharmacyNursingHomesPage;
}
