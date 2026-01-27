// Main Application
let currentPage = 'dashboard';

function initApp() {
    updateUserInfo();
    setupNavigation();

    // Check if there's a hash in the URL
    const hash = window.location.hash.substring(1); // Remove the #
    // Remove query parameters from hash if present (e.g., #utentes?success=updated)
    const page = (hash.split('?')[0]) || 'dashboard';

    console.log('initApp - Full URL:', window.location.href);
    console.log('initApp - Hash:', hash);
    console.log('initApp - Page to load:', page);

    // Update active nav item
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(nav => {
        if (nav.getAttribute('data-page') === page) {
            nav.classList.add('active');
        } else {
            nav.classList.remove('active');
        }
    });

    loadPage(page);
}

function updateUserInfo() {
    const user = Auth.currentUser;

    if (user) {
        document.getElementById('userName').textContent = user.nome;
        document.getElementById('userRole').textContent = getRoleLabel(user.role);
        document.getElementById('userAvatar').textContent = user.nome.charAt(0).toUpperCase();

        // Show/hide navigation items based on role
        const navLares = document.getElementById('navLares');
        const navUtentes = document.querySelector('[data-page="utentes"]');
        const navMedicamentos = document.querySelector('[data-page="medicamentos"]');
        const navTerapeuticas = document.querySelector('[data-page="terapeuticas"]');
        const navUsers = document.getElementById('navUsers');

        if (navLares) {
            navLares.style.display = Auth.isAdminGeral() ? 'flex' : 'none';
        }

        // Técnicos não veem Utilizadores, Utentes, Medicamentos e Terapêuticas
        if (Auth.isTecnico()) {
            if (navUtentes) navUtentes.style.display = 'none';
            if (navMedicamentos) navMedicamentos.style.display = 'none';
            if (navTerapeuticas) navTerapeuticas.style.display = 'none';
            if (navUsers) navUsers.style.display = 'none';
        }
    }
}

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const page = item.getAttribute('data-page');

            // Only handle navigation for items with data-page attribute
            // Let other links (like stocks.php) navigate normally
            if (!page) {
                return;
            }

            e.preventDefault();

            // Update active state
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Update URL hash - this will trigger hashchange event which loads the page
            window.location.hash = page;
        });
    });

    // Listen for hash changes (e.g., browser back/forward)
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash.substring(1);
        // Remove query parameters from hash if present
        const page = (hash.split('?')[0]) || 'dashboard';

        // Update active nav item
        navItems.forEach(nav => {
            if (nav.getAttribute('data-page') === page) {
                nav.classList.add('active');
            } else {
                nav.classList.remove('active');
            }
        });

        loadPage(page);
    });
}

async function loadPage(page) {
    console.log('loadPage called with:', page);
    currentPage = page;
    const pageContent = document.getElementById('pageContent');

    // Redirect to stocks.php if trying to load stocks
    if (page === 'stocks') {
        window.location.href = 'stocks.php';
        return;
    }

    // Check permissions
    if (!canAccessPage(page)) {
        pageContent.innerHTML = `
            <div class="alert alert-error">
                <h3>Acesso Negado</h3>
                <p>Não tem permissões para aceder a esta página.</p>
            </div>
        `;
        return;
    }

    pageContent.innerHTML = showLoading();

    try {
        switch (page) {
            case 'dashboard':
                await loadDashboard();
                break;
            case 'lares':
                await loadLares();
                break;
            case 'utentes':
                await loadUtentes();
                break;
            case 'medicamentos':
                await loadMedicamentos();
                break;
            case 'terapeuticas':
                await loadTerapeuticas();
                break;
            case 'users':
                await loadUsers();
                break;
            case 'administracoes':
                await loadAdministracoes();
                break;
            case 'pharmacy-orders':
                await loadPharmacyOrders();
                break;
            case 'pharmacy-history':
                await loadPharmacyHistory();
                break;
            case 'pharmacy-nursing-homes':
                await loadPharmacyNursingHomes();
                break;
            default:
                pageContent.innerHTML = '<h1>Página não encontrada</h1>';
        }

        // GLOBAL: Remove all onclick attributes and attach proper handlers
        setTimeout(() => {
            document.querySelectorAll('[onclick]').forEach(el => {
                const onclickAttr = el.getAttribute('onclick');
                console.warn('Found onclick on:', el, 'Value:', onclickAttr);

                // Extract function name and try to attach properly
                if (onclickAttr) {
                    try {
                        // Create a proper event listener from the onclick string
                        const handler = new Function('event', onclickAttr);
                        el.addEventListener('click', handler);
                        console.log('Attached handler for:', onclickAttr.substring(0, 50));
                    } catch (e) {
                        console.error('Failed to convert onclick:', e);
                    }
                }

                // Remove the onclick attribute
                el.removeAttribute('onclick');
            });
        }, 100);
    } catch (error) {
        console.error('Error loading page:', error);
        pageContent.innerHTML = `
            <div class="alert alert-error">
                Erro ao carregar página: ${error.message}
            </div>
        `;
    }
}

// Reload current page
function reloadCurrentPage() {
    loadPage(currentPage);
}

// Check if user can access a page
function canAccessPage(page) {
    // Admin Global tem acesso a tudo
    if (Auth.isAdminGeral()) return true;

    // Admin de Lar não tem acesso a lares
    if (Auth.isAdmin()) {
        return page !== 'lares';
    }

    // Técnico só tem acesso a dashboard e administrações (stocks é PHP separado)
    if (Auth.isTecnico()) {
        return page === 'dashboard' || page === 'administracoes';
    }

    return false;
}
