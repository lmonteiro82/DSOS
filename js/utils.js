// Utility Functions

// Show Toast Notification
function showToast(message, type = 'success', title = '') {
    const container = document.getElementById('toastContainer');
    
    const icons = {
        success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
        error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };

    const titles = {
        success: title || 'Sucesso',
        error: title || 'Erro',
        warning: title || 'Aviso',
        info: title || 'Informação'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-icon">${icons[type]}</div>
        <div class="toast-content">
            <div class="toast-title">${titles[type]}</div>
            <div class="toast-message">${message}</div>
        </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Show Modal
function showModal(title, content, footer = '') {
    const container = document.getElementById('modalContainer');
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h3 class="modal-title">${title}</h3>
                <button class="modal-close" onclick="closeModal()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
            <div class="modal-body">${content}</div>
            ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
        </div>
    `;

    container.innerHTML = '';
    container.appendChild(modal);

    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

// Close Modal
function closeModal() {
    const container = document.getElementById('modalContainer');
    container.innerHTML = '';
}

// Format Date
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Format DateTime
function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('pt-PT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Calculate Age
function calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
}

// Get Badge HTML
function getBadge(text, type = 'primary') {
    return `<span class="badge badge-${type}">${text}</span>`;
}

// Get Tipo Toma Label
function getTipoTomaLabel(tipo) {
    const labels = {
        oral: 'Oral',
        injetavel: 'Injetável',
        topica: 'Tópica',
        sublingual: 'Sublingual',
        inalacao: 'Inalação',
        retal: 'Retal',
        ocular: 'Ocular',
        auricular: 'Auricular',
        nasal: 'Nasal'
    };
    return labels[tipo] || tipo;
}

// Get Tipo Terapeutica Label
function getTipoTerapeuticaLabel(tipo) {
    const labels = {
        continua: 'Contínua',
        temporaria: 'Temporária',
        sos: 'SOS'
    };
    return labels[tipo] || tipo;
}

// Get Tipo Terapeutica Badge
function getTipoTerapeuticaBadge(tipo) {
    const types = {
        continua: 'primary',
        temporaria: 'warning',
        sos: 'danger'
    };
    return getBadge(getTipoTerapeuticaLabel(tipo), types[tipo] || 'primary');
}

// Get Role Label
function getRoleLabel(role) {
    const labels = {
        admin_geral: 'Administrador Geral',
        admin_lar: 'Administrador de Lar',
        tecnico: 'Técnico'
    };
    return labels[role] || role;
}

// Confirm Dialog
function confirm(message, onConfirm) {
    const content = `<p style="font-size: 16px; color: var(--gray-700); margin-bottom: 20px;">${message}</p>`;
    const footer = `
        <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-danger" onclick="closeModal(); (${onConfirm})()">Confirmar</button>
    `;
    showModal('Confirmação', content, footer);
}

// Show Loading
function showLoading() {
    return `
        <div class="loading">
            <div class="spinner"></div>
        </div>
    `;
}

// Show Empty State
function showEmptyState(title, message, buttonText = '', buttonAction = '') {
    return `
        <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <h3>${title}</h3>
            <p>${message}</p>
            ${buttonText ? `<button class="btn btn-primary" onclick="${buttonAction}">${buttonText}</button>` : ''}
        </div>
    `;
}

// Debounce Function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Get Days of Week
function getDaysOfWeek() {
    return [
        { value: 0, label: 'Domingo' },
        { value: 1, label: 'Segunda' },
        { value: 2, label: 'Terça' },
        { value: 3, label: 'Quarta' },
        { value: 4, label: 'Quinta' },
        { value: 5, label: 'Sexta' },
        { value: 6, label: 'Sábado' }
    ];
}

// Format Days Array
function formatDaysArray(daysArray) {
    if (!daysArray || daysArray.length === 0) return '-';
    
    const days = getDaysOfWeek();
    const dayLabels = daysArray.map(day => {
        const dayObj = days.find(d => d.value === parseInt(day));
        return dayObj ? dayObj.label.substring(0, 3) : '';
    });
    
    return dayLabels.join(', ');
}

// Export to CSV
function exportToCSV(data, filename) {
    const csv = data.map(row => Object.values(row).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}
