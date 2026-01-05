// Authentication Management
const Auth = {
    currentUser: null,

    async login(email, password) {
        try {
            const response = await AuthAPI.login(email, password);
            
            if (response.success) {
                this.currentUser = response.user;
                localStorage.setItem('user', JSON.stringify(response.user));
                return true;
            }
            return false;
        } catch (error) {
            throw error;
        }
    },

    logout() {
        // Limpar dados locais imediatamente
        this.currentUser = null;
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        
        // Chamar API de logout em background (sem esperar)
        AuthAPI.logout().catch(err => console.error('Logout API error:', err));
        
        // Redirecionar imediatamente
        window.location.href = 'login.html';
    },

    async checkAuth() {
        const storedUser = localStorage.getItem('user');
        
        if (storedUser) {
            this.currentUser = JSON.parse(storedUser);
            return true;
        }
        
        return false;
    },

    isAdmin() {
        return this.currentUser && (
            this.currentUser.role === 'admin_geral' || 
            this.currentUser.role === 'admin_lar'
        );
    },

    isAdminGeral() {
        return this.currentUser && this.currentUser.role === 'admin_geral';
    },

    isTecnico() {
        return this.currentUser && this.currentUser.role === 'tecnico';
    },

    getUserLarId() {
        return this.currentUser ? this.currentUser.lar_id : null;
    }
};

// Initialize auth on app.html
document.addEventListener('DOMContentLoaded', () => {
    const mainApp = document.getElementById('mainApp');
    
    // If we're on the app page, check authentication and initialize
    if (mainApp) {
        Auth.checkAuth().then(isAuthenticated => {
            if (isAuthenticated) {
                // Initialize the app if initApp function exists
                if (typeof initApp === 'function') {
                    initApp();
                }
            } else {
                // Redirect to login if not authenticated
                window.location.href = 'login.html';
            }
        });
        
        // Logout button handler
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                Auth.logout();
            });
        }
    }
});
