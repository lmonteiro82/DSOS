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

    async logout() {
        try {
            await AuthAPI.logout();
            this.currentUser = null;
            localStorage.removeItem('user');
            window.location.reload();
        } catch (error) {
            console.error('Logout error:', error);
            // Force logout even if API fails
            this.currentUser = null;
            localStorage.removeItem('user');
            window.location.reload();
        }
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

// Login Form Handler
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            try {
                loginError.style.display = 'none';
                const success = await Auth.login(email, password);
                
                if (success) {
                    document.getElementById('loginPage').style.display = 'none';
                    document.getElementById('mainApp').style.display = 'flex';
                    initApp();
                }
            } catch (error) {
                loginError.textContent = error.message || 'Erro ao fazer login';
                loginError.style.display = 'block';
            }
        });
    }

    // Check if user is already logged in
    Auth.checkAuth().then(isAuthenticated => {
        if (isAuthenticated) {
            document.getElementById('loginPage').style.display = 'none';
            document.getElementById('mainApp').style.display = 'flex';
            initApp();
        }
    });

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            Auth.logout();
        });
    }
});
