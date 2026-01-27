// Pharmacy History Page Loader
async function loadPharmacyHistory() {
    const pageContent = document.getElementById('pageContent');

    try {
        const html = await PharmacyHistoryPage.render();
        pageContent.innerHTML = html;
        await PharmacyHistoryPage.init();
    } catch (error) {
        console.error('Error loading pharmacy history:', error);
        pageContent.innerHTML = `
            <div class="alert alert-error">
                Erro ao carregar página: ${error.message}
            </div>
        `;
    }
}

// Pharmacy History Page
const PharmacyHistoryPage = {
    async render() {
        const content = `
            <div class="page-header">
                <h1>Histórico de Encomendas</h1>
                <p>Consultar histórico de encomendas por utente</p>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3>Selecionar Utente</h3>
                </div>
                <div class="card-body">
                    <div class="form-group">
                        <label for="utenteHistorySelect">
                            Utente <span class="required">*</span>
                        </label>
                        <select id="utenteHistorySelect" class="form-input">
                            <option value="">Selecione um utente</option>
                        </select>
                    </div>
                </div>
            </div>

            <div id="patientOrdersSection" style="display: none;">
                <div class="card">
                    <div class="card-header">
                        <h3 id="patientOrdersTitle">Encomendas</h3>
                    </div>
                    <div class="card-body">
                        <div id="patientOrdersContent">
                            <p class="text-muted">Carregando...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        return content;
    },

    async init() {
        await this.loadUtentes();
        this.setupEventListeners();
    },

    utentes: [],

    async loadUtentes() {
        try {
            // Use the PHP API for utentes, not Pharmacy API
            const result = await api.getUtentes();
            this.utentes = result || [];

            const select = document.getElementById('utenteHistorySelect');
            select.innerHTML = '<option value="">Selecione um utente</option>';

            this.utentes.forEach(utente => {
                const option = document.createElement('option');
                option.value = utente.id;
                option.textContent = `${utente.nome} (${utente.numero_utente})`;
                select.appendChild(option);
            });

        } catch (error) {
            console.error('Erro ao carregar utentes:', error);
            showToast('Erro ao carregar lista de utentes', 'error');
        }
    },

    setupEventListeners() {
        const select = document.getElementById('utenteHistorySelect');
        select.addEventListener('change', async (e) => {
            const patientId = e.target.value;
            if (patientId) {
                const selectedUtente = this.utentes.find(u => u.id == patientId);
                await this.loadPatientOrders(patientId, selectedUtente);
            } else {
                document.getElementById('patientOrdersSection').style.display = 'none';
            }
        });
    },

    async loadPatientOrders(patientId, utente) {
        const section = document.getElementById('patientOrdersSection');
        const title = document.getElementById('patientOrdersTitle');
        const content = document.getElementById('patientOrdersContent');

        section.style.display = 'block';
        title.textContent = `Encomendas de ${utente?.nome || 'Utente'}`;
        content.innerHTML = '<p class="text-muted">Carregando...</p>';

        try {
            const response = await fetch(`${PHARMACY_API_URL}/history/patient/${patientId}`, {
                headers: {
                    'x-api-key': PHARMACY_API_KEY
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao carregar histórico');
            }

            const result = await response.json();
            const orders = result.data || [];

            if (orders.length === 0) {
                content.innerHTML = `
                    <div class="alert alert-info">
                        <p>Nenhuma encomenda encontrada para este utente.</p>
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
            const cancelButtons = content.querySelectorAll('.btn-cancel-order');
            cancelButtons.forEach(btn => {
                btn.addEventListener('click', async () => {
                    const orderId = btn.dataset.orderId;
                    const orderNumber = btn.dataset.orderNumber;
                    await this.cancelOrder(orderId, orderNumber);
                });
            });

            // Add event listeners for status change dropdowns
            const statusSelects = content.querySelectorAll('.status-select');
            statusSelects.forEach(select => {
                select.addEventListener('change', async (e) => {
                    const orderId = select.dataset.orderId;
                    const currentStatus = select.dataset.currentStatus;
                    const newStatus = e.target.value;

                    if (newStatus && newStatus !== currentStatus) {
                        await this.updateOrderStatus(orderId, newStatus);
                    } else {
                        // Reset to current status if no selection
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
                            <select class="form-input status-select" data-order-id="${order.id}" data-current-status="${order.status}" style="padding: 0.5rem; font-size: 0.9rem;">
                                <option value="">Alterar Estado...</option>
                                <option value="SENT_TO_PHARMACY" ${order.status === 'SENT_TO_PHARMACY' ? 'selected' : ''}>Enviado para Farmácia</option>
                                <option value="PROCESSING" ${order.status === 'PROCESSING' ? 'selected' : ''}>Em Processamento</option>
                                <option value="SENT_TO_NURSING_HOME" ${order.status === 'SENT_TO_NURSING_HOME' ? 'selected' : ''}>Enviado para Lar</option>
                                <option value="RECEIVED" ${order.status === 'RECEIVED' ? 'selected' : ''}>Recebido</option>
                            </select>
                        ` : ''}
                        ${canCancel ? `
                            <button class="btn btn-danger btn-sm btn-cancel-order" data-order-id="${order.id}" data-order-number="${order.orderNumber}">
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
                            <strong>Lar:</strong><br>
                            ${order.nursingHome?.name || 'N/A'}
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
                                <tr style="border-top: 2px solid #ddd; background: #f9f9f9; font-weight: bold;">
                                    <td colspan="3" style="padding: 0.5rem; text-align: right;">Total:</td>
                                    <td style="padding: 0.5rem; text-align: right; color: var(--success);">€${parseFloat(order.totalAmount).toFixed(2)}</td>
                                </tr>
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

        // Store data globally BEFORE calling confirm to ensure access in stringified callback
        window.__pendingStatusUpdate = {
            orderId: orderId,
            newStatus: newStatus,
            execute: async function () {
                try {
                    const data = window.__pendingStatusUpdate;

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

                    // Reload orders by triggering change event on select
                    const select = document.getElementById('utenteHistorySelect');
                    if (select && select.value) {
                        select.dispatchEvent(new Event('change'));
                    }

                    // Cleanup
                    delete window.__pendingStatusUpdate;

                } catch (error) {
                    console.error('Erro ao atualizar estado:', error);
                    showToast(error.message, 'error');

                    // Reload UI to reset dropdown
                    const select = document.getElementById('utenteHistorySelect');
                    if (select && select.value) {
                        select.dispatchEvent(new Event('change'));
                    }

                    delete window.__pendingStatusUpdate;
                }
            }
        };

        confirm(`Tem certeza que deseja alterar o estado para "${statusLabel}"?`, window.__pendingStatusUpdate.execute);
    },

    cancelOrder(orderId, orderNumber) {
        // Store data globally so it's accessible from the stringified callback
        window.__pendingCancelOrder = {
            orderId: orderId,
            orderNumber: orderNumber,
            execute: async function () {
                try {
                    const response = await fetch(`${PHARMACY_API_URL}/orders/${window.__pendingCancelOrder.orderId}/cancel`, {
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

                    // Reload the current patient's orders
                    const select = document.getElementById('utenteHistorySelect');
                    const patientId = select.value;
                    if (patientId) {
                        const selectedUtente = PharmacyHistoryPage.utentes.find(u => u.id == patientId);
                        await PharmacyHistoryPage.loadPatientOrders(patientId, selectedUtente);
                    }

                    // Clean up
                    delete window.__pendingCancelOrder;

                } catch (error) {
                    console.error('Erro ao cancelar encomenda:', error);
                    showToast(`Erro ao cancelar: ${error.message}`, 'error');
                    delete window.__pendingCancelOrder;
                }
            }
        };

        confirm(`Tem certeza que deseja cancelar a encomenda ${orderNumber}?`, window.__pendingCancelOrder.execute);
    }
};
