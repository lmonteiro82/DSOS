// Pharmacy API Configuration - Global constants for Pharmacy API
const PHARMACY_API_URL = 'http://localhost:3000/api';
const PHARMACY_API_KEY = 'NH001-fc2ea2e2c74396b64a069087ddc2d805'; // teste2 (Lar ID 1)

// Bridge to ensure 'api' object exists and maps to both DSOS backend and Pharmacy API
window.api = window.api || {};

// Map DSOS backend API calls (from UtentesAPI, etc.)
if (typeof UtentesAPI !== 'undefined') {
    window.api.getUtentes = async () => {
        const res = await UtentesAPI.getAll();
        return res.data; // Return only the data array
    };
}

// Map other APIs as needed
if (typeof MedicamentosAPI !== 'undefined') {
    window.api.getMedicamentos = async () => {
        const res = await MedicamentosAPI.getAll();
        return res.data;
    };
}
