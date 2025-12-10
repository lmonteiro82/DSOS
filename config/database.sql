-- Criar base de dados (executar primeiro se não existir)
-- CREATE DATABASE IF NOT EXISTS rodas_bengalas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- Depois selecionar a base de dados 'rodas_bengalas' no phpMyAdmin e executar o resto do script

-- Tabela de Lares
CREATE TABLE lares (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    morada TEXT NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    capacidade INT NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Utilizadores
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin_geral', 'admin_lar', 'tecnico') NOT NULL,
    lar_id INT,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (lar_id) REFERENCES lares(id) ON DELETE SET NULL,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Utentes
CREATE TABLE utentes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    data_nascimento DATE NOT NULL,
    numero_utente VARCHAR(50) NOT NULL UNIQUE,
    lar_id INT NOT NULL,
    contacto_emergencia_nome VARCHAR(255),
    contacto_emergencia_telefone VARCHAR(20),
    contacto_emergencia_relacao VARCHAR(100),
    observacoes TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (lar_id) REFERENCES lares(id) ON DELETE CASCADE,
    INDEX idx_numero_utente (numero_utente),
    INDEX idx_lar (lar_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Medicamentos
CREATE TABLE medicamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    principio_ativo VARCHAR(255) NOT NULL,
    marca VARCHAR(255) NOT NULL,
    dose VARCHAR(100) NOT NULL,
    toma ENUM('oral', 'injetavel', 'topica', 'sublingual', 'inalacao', 'retal', 'ocular', 'auricular', 'nasal') NOT NULL,
    lar_id INT NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (lar_id) REFERENCES lares(id) ON DELETE CASCADE,
    INDEX idx_nome (nome),
    INDEX idx_lar (lar_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Terapêuticas
CREATE TABLE terapeuticas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    utente_id INT NOT NULL,
    medicamento_id INT NOT NULL,
    tipo ENUM('continua', 'temporaria', 'sos') NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE,
    observacoes TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    criado_por INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (utente_id) REFERENCES utentes(id) ON DELETE CASCADE,
    FOREIGN KEY (medicamento_id) REFERENCES medicamentos(id) ON DELETE CASCADE,
    FOREIGN KEY (criado_por) REFERENCES users(id),
    INDEX idx_utente (utente_id),
    INDEX idx_tipo (tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Horários das Terapêuticas
CREATE TABLE terapeutica_horarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    terapeutica_id INT NOT NULL,
    hora TIME NOT NULL,
    dias_semana VARCHAR(20) NOT NULL COMMENT 'JSON array com dias da semana (0-6)',
    FOREIGN KEY (terapeutica_id) REFERENCES terapeuticas(id) ON DELETE CASCADE,
    INDEX idx_terapeutica (terapeutica_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Stocks
CREATE TABLE stocks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    medicamento_id INT NOT NULL,
    utente_id INT NOT NULL,
    quantidade INT NOT NULL DEFAULT 0,
    quantidade_minima INT DEFAULT 10,
    lote VARCHAR(100),
    data_validade DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (medicamento_id) REFERENCES medicamentos(id) ON DELETE CASCADE,
    FOREIGN KEY (utente_id) REFERENCES utentes(id) ON DELETE CASCADE,
    UNIQUE KEY unique_stock (medicamento_id, utente_id),
    INDEX idx_medicamento (medicamento_id),
    INDEX idx_utente (utente_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Administrações
CREATE TABLE administracoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    terapeutica_id INT NOT NULL,
    data_hora DATETIME NOT NULL,
    administrada BOOLEAN NOT NULL,
    motivo_nao_administracao TEXT,
    observacoes TEXT,
    administrado_por INT NOT NULL,
    validada BOOLEAN DEFAULT FALSE,
    validada_por INT,
    data_validacao DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (terapeutica_id) REFERENCES terapeuticas(id) ON DELETE CASCADE,
    FOREIGN KEY (administrado_por) REFERENCES users(id),
    FOREIGN KEY (validada_por) REFERENCES users(id),
    INDEX idx_terapeutica (terapeutica_id),
    INDEX idx_data_hora (data_hora),
    INDEX idx_validada (validada)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir utilizador admin geral padrão (password: admin123)
INSERT INTO users (nome, email, password, role, lar_id) 
VALUES ('Administrador Geral', 'admin@rodasbengalas.pt', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin_geral', NULL);
