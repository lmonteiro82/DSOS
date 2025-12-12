// Dashboard Page
async function loadDashboard() {
    const pageContent = document.getElementById('pageContent');
    
    try {
        const response = await EstatisticasAPI.getAll();
        const stats = response.data;

        let html = `
            <div class="page-header">
                <h1 class="page-title">Dashboard</h1>
                <p class="page-subtitle">Visão geral do sistema</p>
            </div>

            <div class="stats-grid">
        `;

        // Stats cards
        if (Auth.isAdminGeral()) {
            html += `
                <div class="stat-card">
                    <div class="stat-icon primary">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        </svg>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">Total de Lares</div>
                        <div class="stat-value">${stats.utentes_por_lar?.length || 0}</div>
                    </div>
                </div>
            `;
        }

        html += `
            <div class="stat-card">
                <div class="stat-icon success">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                    </svg>
                </div>
                <div class="stat-content">
                    <div class="stat-label">Utentes</div>
                    <div class="stat-value">${stats.utentes_por_lar?.reduce((sum, l) => sum + parseInt(l.total_utentes), 0) || 0}</div>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon warning">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                    </svg>
                </div>
                <div class="stat-content">
                    <div class="stat-label">Terapêuticas Ativas</div>
                    <div class="stat-value">${stats.total_terapeuticas || 0}</div>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon danger">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    </svg>
                </div>
                <div class="stat-content">
                    <div class="stat-label">Administrações Pendentes</div>
                    <div class="stat-value">${stats.administracoes_pendentes || 0}</div>
                </div>
            </div>
        </div>
        `;

        // Utentes por lar (sempre mostrar)
        if (stats.utentes_por_lar) {
            html += `
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Utentes por Lar</h3>
                    </div>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Lar</th>
                                    <th>Total de Utentes</th>
                                </tr>
                            </thead>
                            <tbody>
            `;

            stats.utentes_por_lar.forEach(lar => {
                html += `
                    <tr>
                        <td><strong>${lar.lar}</strong></td>
                        <td>${lar.total_utentes}</td>
                    </tr>
                `;
            });

            html += `
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }

        // Medicamentos mais usados
        if (stats.medicamentos_mais_usados && stats.medicamentos_mais_usados.length > 0) {
            html += `
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Medicamentos Mais Usados</h3>
                    </div>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Medicamento</th>
                                    <th>Princípio Ativo</th>
                                    <th>Terapêuticas</th>
                                </tr>
                            </thead>
                            <tbody>
            `;

            stats.medicamentos_mais_usados.forEach(med => {
                html += `
                    <tr>
                        <td><strong>${med.nome}</strong></td>
                        <td>${med.principio_ativo}</td>
                        <td>${med.total_terapeuticas}</td>
                    </tr>
                `;
            });

            html += `
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }

        // Utentes com mais SOS
        if (stats.utentes_mais_sos && stats.utentes_mais_sos.length > 0) {
            html += `
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Utentes com Mais Medicamentos SOS</h3>
                    </div>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Utente</th>
                                    <th>Nº Utente</th>
                                    <th>Lar</th>
                                    <th>Total SOS</th>
                                </tr>
                            </thead>
                            <tbody>
            `;

            stats.utentes_mais_sos.forEach(utente => {
                html += `
                    <tr>
                        <td><strong>${utente.nome}</strong></td>
                        <td>${utente.numero_utente}</td>
                        <td>${utente.lar_nome || '-'}</td>
                        <td>${utente.total_sos}</td>
                    </tr>
                `;
            });

            html += `
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }

        // Stocks baixos
        if (stats.stocks_baixos && stats.stocks_baixos.length > 0) {
            html += `
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">⚠️ Stocks Baixos (Abaixo do Mínimo)</h3>
                    </div>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Medicamento</th>
                                    <th>Utente</th>
                                    <th>Lar</th>
                                    <th>Quantidade</th>
                                    <th>Mínimo</th>
                                </tr>
                            </thead>
                            <tbody>
            `;

            stats.stocks_baixos.forEach(stock => {
                html += `
                    <tr>
                        <td><strong>${stock.medicamento_nome}</strong></td>
                        <td>${stock.utente_nome}</td>
                        <td>${stock.lar_nome || '-'}</td>
                        <td><span class="badge badge-danger">${stock.quantidade}</span></td>
                        <td>${stock.quantidade_minima}</td>
                    </tr>
                `;
            });

            html += `
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }

        pageContent.innerHTML = html;
    } catch (error) {
        console.error('Error loading dashboard:', error);
        pageContent.innerHTML = `
            <div class="alert alert-error">
                Erro ao carregar dashboard: ${error.message}
            </div>
        `;
    }
}
