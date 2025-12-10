// Main Application
let currentPage = 'dashboard';

function initApp() {
    updateUserInfo();
    setupNavigation();
    loadPage('dashboard');
}

function updateUserInfo() {
    const user = Auth.currentUser;
    
    if (user) {
        document.getElementById('userName').textContent = user.nome;
        document.getElementById('userRole').textContent = getRoleLabel(user.role);
        document.getElementById('userAvatar').textContent = user.nome.charAt(0).toUpperCase();

        // Show/hide navigation items based on role
        const navLares = document.getElementById('navLares');
        if (navLares) {
            navLares.style.display = Auth.isAdminGeral() ? 'flex' : 'none';
        }
    }
}

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            const page = item.getAttribute('data-page');
            
            // Update active state
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // Load page
            loadPage(page);
        });
    });
}

async function loadPage(page) {
    currentPage = page;
    const pageContent = document.getElementById('pageContent');
    
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
            case 'stocks':
                await loadStocks();
                break;
            case 'administracoes':
                await loadAdministracoes();
                break;
            default:
                pageContent.innerHTML = '<h1>Página não encontrada</h1>';
        }
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
