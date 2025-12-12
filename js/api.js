// API Configuration
const API_BASE_URL = window.location.origin + '/api';

// API Helper
const API = {
    async request(endpoint, options = {}) {
        // Add timestamp to prevent caching
        const separator = endpoint.includes('?') ? '&' : '?';
        const url = `${API_BASE_URL}/${endpoint}${separator}_t=${Date.now()}`;
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            },
            credentials: 'include',
            cache: 'no-store'
        };

        const config = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Erro na requisição');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },

    post(endpoint, body) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    },

    put(endpoint, body) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body)
        });
    },

    delete(endpoint, body) {
        return this.request(endpoint, {
            method: 'DELETE',
            body: body ? JSON.stringify(body) : undefined
        });
    },

    // Upload file
    async upload(endpoint, formData) {
        const url = `${API_BASE_URL}/${endpoint}`;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });
            
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Erro no upload');
            }

            return data;
        } catch (error) {
            console.error('Upload Error:', error);
            throw error;
        }
    }
};

// Auth API
const AuthAPI = {
    async login(email, password) {
        const url = `${API_BASE_URL}/auth.php?action=login`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Erro no login');
        return data;
    },

    async logout() {
        const url = `${API_BASE_URL}/auth.php?action=logout`;
        const response = await fetch(url, {
            method: 'POST',
            credentials: 'include'
        });
        return await response.json();
    },

    async me() {
        const url = `${API_BASE_URL}/auth.php?action=me`;
        const response = await fetch(url, {
            method: 'GET',
            credentials: 'include'
        });
        return await response.json();
    },

    async register(userData) {
        const url = `${API_BASE_URL}/auth.php?action=register`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(userData)
        });
        return await response.json();
    }
};

// Lares API
const LaresAPI = {
    getAll() {
        return API.get('lares.php');
    },

    create(data) {
        return API.post('lares.php', data);
    },

    update(data) {
        return API.put('lares.php', data);
    },

    delete(id) {
        return API.delete('lares.php', { id });
    }
};

// Utentes API
const UtentesAPI = {
    getAll() {
        return API.get('utentes.php');
    },

    create(data) {
        return API.post('utentes.php', data);
    },

    update(data) {
        return API.put('utentes.php', data);
    },

    delete(id) {
        return API.delete('utentes.php', { id });
    }
};

// Medicamentos API
const MedicamentosAPI = {
    getAll() {
        return API.get('medicamentos.php');
    },

    create(data) {
        return API.post('medicamentos.php', data);
    },

    update(data) {
        return API.put('medicamentos.php', data);
    },

    delete(id) {
        return API.delete('medicamentos.php', { id });
    },

    importCSV(formData) {
        return API.upload('import_csv.php', formData);
    }
};

// Terapêuticas API
const TerapeuticasAPI = {
    getAll() {
        return API.get('terapeuticas.php');
    },

    create(data) {
        return API.post('terapeuticas.php', data);
    },

    update(data) {
        return API.put('terapeuticas.php', data);
    },

    delete(id) {
        return API.delete('terapeuticas.php', { id });
    }
};

// Stocks API
const StocksAPI = {
    getAll() {
        return API.get('stocks.php');
    },

    getByUtente(utenteId) {
        return API.get(`stocks.php/utente?utente_id=${utenteId}`);
    },

    getGeral() {
        return API.get('stocks.php/geral');
    },

    create(data) {
        return API.post('stocks.php', data);
    },

    update(data) {
        return API.put('stocks.php', data);
    }
};

// Administrações API
const AdministracoesAPI = {
    getAll() {
        return API.get('administracoes.php');
    },

    create(data) {
        return API.post('administracoes.php', data);
    },

    validate(data) {
        return API.put('administracoes.php', data);
    }
};

// Estatísticas API
const EstatisticasAPI = {
    getAll() {
        return API.get('estatisticas.php');
    }
};

// Users API
const UsersAPI = {
    getAll() {
        return API.get('users.php');
    },

    create(data) {
        return API.post('users.php', data);
    },

    update(data) {
        return API.put('users.php', data);
    },

    delete(id) {
        return API.delete('users.php', { id });
    }
};
