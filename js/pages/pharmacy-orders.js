// Pharmacy Orders Page
// Note: PHARMACY_API_URL and PHARMACY_API_KEY are now defined in pharmacy-config.js


// Pharmacy Orders Page Loader
async function loadPharmacyOrders() {
    const pageContent = document.getElementById('pageContent');

    try {
        const html = await PharmacyOrdersPage.render();
        pageContent.innerHTML = html;
        await PharmacyOrdersPage.init();
    } catch (error) {
        console.error('Error loading pharmacy orders:', error);
        pageContent.innerHTML = `
            <div class="alert alert-error">
                Erro ao carregar encomendas: ${error.message}
            </div>
        `;
    }
}


// Pharmacy Orders Page
const PharmacyOrdersPage = {
    async render() {
        const content = `
            <div class="page-header">
                <h1>Encomendas de Farmácia</h1>
                <p>Criar encomendas de medicamentos para utentes</p>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3>Nova Encomenda</h3>
                </div>
                <div class="card-body">
                    <form id="pharmacyOrderForm">
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="utenteSelect">
                                    Utente <span class="required">*</span>
                                </label>
                                <select id="utenteSelect" class="form-input" required>
                                    <option value="">Selecione um utente</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label for="larSelect">
                                    Lar <span class="required">*</span>
                                </label>
                                <select id="larSelect" class="form-input" required disabled>
                                    <option value="">Selecione primeiro um utente</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-section">
                            <h4>Medicamentos</h4>
                            <div id="medicationItems">
                                <div class="medication-item">
                                    <div class="form-grid">
                                        <div class="form-group" style="flex: 2">
                                            <label for="medication_0">
                                                Medicamento <span class="required">*</span>
                                            </label>
                                            <select id="medication_0" class="medication-select form-input" required>
                                                <option value="">Selecione um medicamento</option>
                                            </select>
                                        </div>
                                        <div class="form-group">
                                            <label for="quantity_0">
                                                Quantidade <span class="required">*</span>
                                            </label>
                                            <input type="number" id="quantity_0" class="quantity-input form-input" 
                                                   min="1" required value="1">
                                        </div>
                                        <div class="form-group" style="display: flex; align-items: flex-end;">
                                            <button type="button" class="btn btn-danger btn-remove-medication" 
                                                    data-index="0" style="visibility: hidden;">
                                                Remover
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style="width: 20px; height: 20px; margin-right: 8px;">
                                    <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                                </svg>
                                Criar Encomenda
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        return content;
    },

    async init() {
        await this.loadUtentes();
        await this.loadMedicamentos();
        await this.loadLares();
        this.setupEventListeners();
    },

    utentes: [],
    medicamentos: [],
    lares: [],
    medicationCount: 1,

    async loadUtentes() {
        try {
            const response = await UtentesAPI.getAll();
            this.utentes = response.data || [];

            const select = document.getElementById('utenteSelect');
            select.innerHTML = '<option value="">Selecione um utente</option>';

            this.utentes.forEach(utente => {
                const option = document.createElement('option');
                option.value = utente.id;
                option.dataset.larId = utente.lar_id;
                option.textContent = `${utente.nome} (${utente.numero_utente || utente.id})`;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Erro ao carregar utentes:', error);
            showToast('Erro ao carregar utentes', 'error');
        }
    },

    async loadMedicamentos() {
        try {
            const response = await MedicamentosAPI.getAll();
            this.medicamentos = response.data || [];
            this.updateMedicationSelects();
        } catch (error) {
            console.error('Erro ao carregar medicamentos:', error);
            showToast('Erro ao carregar medicamentos', 'error');
        }
    },

    async loadLares() {
        try {
            const response = await LaresAPI.getAll();
            this.lares = response.data || [];
        } catch (error) {
            console.error('Erro ao carregar lares:', error);
        }
    },


    updateMedicationSelects() {
        const selects = document.querySelectorAll('.medication-select');
        selects.forEach(select => {
            const currentValue = select.value;
            select.innerHTML = '<option value="">Selecione um medicamento</option>';

            this.medicamentos.forEach(med => {
                const option = document.createElement('option');
                option.value = med.id;
                option.textContent = `${med.nome} - ${med.dose} (${med.marca})`;
                select.appendChild(option);
            });

            if (currentValue) {
                select.value = currentValue;
            }
        });
    },

    setupEventListeners() {
        const form = document.getElementById('pharmacyOrderForm');
        const utenteSelect = document.getElementById('utenteSelect');

        // Utente selection
        utenteSelect.addEventListener('change', (e) => {
            const selectedOption = e.target.selectedOptions[0];
            const larId = selectedOption?.dataset.larId;
            const larSelect = document.getElementById('larSelect');

            if (larId) {
                const lar = this.lares.find(l => l.id == larId);
                larSelect.innerHTML = `<option value="${lar.id}">${lar.nome}</option>`;
                larSelect.disabled = false;
            } else {
                larSelect.innerHTML = '<option value="">Selecione primeiro um utente</option>';
                larSelect.disabled = true;
            }
        });

        // Form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.submitOrder();
        });

        // Remove medication (event delegation)
        document.getElementById('medicationItems').addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-remove-medication') ||
                e.target.closest('.btn-remove-medication')) {
                const btn = e.target.classList.contains('btn-remove-medication') ?
                    e.target : e.target.closest('.btn-remove-medication');
                this.removeMedicationRow(parseInt(btn.dataset.index));
            }
        });
    },

    addMedicationRow() {
        const container = document.getElementById('medicationItems');
        const index = this.medicationCount++;

        const div = document.createElement('div');
        div.className = 'medication-item';
        div.dataset.index = index;
        div.innerHTML = `
            <div class="form-grid">
                <div class="form-group" style="flex: 2">
                    <label for="medication_${index}">
                        Medicamento <span class="required">*</span>
                    </label>
                    <select id="medication_${index}" class="medication-select form-input" required>
                        <option value="">Selecione um medicamento</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="quantity_${index}">
                        Quantidade <span class="required">*</span>
                    </label>
                    <input type="number" id="quantity_${index}" class="quantity-input form-input" 
                           min="1" required value="1">
                </div>
                <div class="form-group" style="display: flex; align-items: flex-end;">
                    <button type="button" class="btn btn-danger btn-remove-medication" data-index="${index}">
                        Remover
                    </button>
                </div>
            </div>
        `;

        container.appendChild(div);
        this.updateMedicationSelects();
    },

    removeMedicationRow(index) {
        const item = document.querySelector(`.medication-item[data-index="${index}"]`);
        if (item && document.querySelectorAll('.medication-item').length > 1) {
            item.remove();
        } else {
            showToast('Deve ter pelo menos um medicamento', 'warning');
        }
    },

    async submitOrder() {
        try {
            const utenteId = document.getElementById('utenteSelect').value;
            const larId = document.getElementById('larSelect').value;

            if (!utenteId || !larId) {
                showToast('Selecione o utente e o lar', 'warning');
                return;
            }

            // Collect medication items
            const items = [];
            const medicationItems = document.querySelectorAll('.medication-item');

            medicationItems.forEach((item) => {
                const select = item.querySelector('.medication-select');
                const quantityInput = item.querySelector('.quantity-input');

                if (select.value && quantityInput.value) {
                    items.push({
                        medicationId: parseInt(select.value),
                        quantity: parseInt(quantityInput.value)
                    });
                }
            });

            if (items.length === 0) {
                showToast('Adicione pelo menos um medicamento', 'warning');
                return;
            }

            // Call Pharmacy API
            const orderData = {
                nursingHomeId: parseInt(larId),
                patientId: parseInt(utenteId),
                items: items
            };

            const response = await fetch(`${PHARMACY_API_URL}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': PHARMACY_API_KEY
                },
                body: JSON.stringify(orderData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Erro ao criar encomenda');
            }

            showToast('Encomenda criada com sucesso!', 'success');

            // Reset form
            document.getElementById('pharmacyOrderForm').reset();
            document.getElementById('larSelect').disabled = true;

            // Reset medication items to just one
            const medicationContainer = document.getElementById('medicationItems');
            medicationContainer.innerHTML = `
                <div class="medication-item">
                    <div class="form-grid">
                        <div class="form-group" style="flex: 2">
                            <label for="medication_0">
                                Medicamento <span class="required">*</span>
                            </label>
                            <select id="medication_0" class="medication-select form-input" required>
                                <option value="">Selecione um medicamento</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="quantity_0">
                                Quantidade <span class="required">*</span>
                            </label>
                            <input type="number" id="quantity_0" class="quantity-input form-input" 
                                   min="1" required value="1">
                        </div>
                        <div class="form-group" style="display: flex; align-items: flex-end;">
                            <button type="button" class="btn btn-danger btn-remove-medication" 
                                    data-index="0" style="visibility: hidden;">
                                Remover
                            </button>
                        </div>
                    </div>
                </div>
            `;
            this.medicationCount = 1;
            this.updateMedicationSelects();

        } catch (error) {
            console.error('Erro ao criar encomenda:', error);
            showToast(error.message || 'Erro ao criar encomenda', 'error');
        }
    }
};

// Register page
if (typeof Pages !== 'undefined') {
    Pages['pharmacy-orders'] = PharmacyOrdersPage;
}
