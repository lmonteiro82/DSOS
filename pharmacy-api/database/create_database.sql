-- ============================================
-- Script de Criação da Base de Dados
-- Pharmacy API - Rodas&Bengalas
-- ============================================

-- Criar base de dados (se não existir)
CREATE DATABASE IF NOT EXISTS pharmacy_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Usar a base de dados
USE pharmacy_db;

-- ============================================
-- Tabela: nursing_homes (Lares)
-- ============================================
CREATE TABLE IF NOT EXISTS nursing_homes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  api_key VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_api_key (api_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabela: patients (Utentes)
-- ============================================
CREATE TABLE IF NOT EXISTS patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nursing_home_id INT NOT NULL,
  patient_number VARCHAR(100),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (nursing_home_id) REFERENCES nursing_homes(id) ON DELETE CASCADE,
  INDEX idx_nursing_home_id (nursing_home_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabela: medications (Medicamentos)
-- ============================================
CREATE TABLE IF NOT EXISTS medications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  active_ingredient VARCHAR(255),
  price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  stock INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabela: orders (Encomendas)
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(100) UNIQUE NOT NULL,
  nursing_home_id INT NOT NULL,
  patient_id INT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'SENT_TO_PHARMACY',
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  cancelled_at TIMESTAMP NULL,
  received_at TIMESTAMP NULL,
  FOREIGN KEY (nursing_home_id) REFERENCES nursing_homes(id) ON DELETE RESTRICT,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT,
  INDEX idx_order_number (order_number),
  INDEX idx_nursing_home_id (nursing_home_id),
  INDEX idx_patient_id (patient_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  CHECK (status IN ('SENT_TO_PHARMACY', 'PROCESSING', 'SENT_TO_NURSING_HOME', 'RECEIVED', 'CANCELLED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabela: order_items (Itens de Encomenda)
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  medication_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE RESTRICT,
  INDEX idx_order_id (order_id),
  INDEX idx_medication_id (medication_id),
  CHECK (quantity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Verificar tabelas criadas
-- ============================================
SHOW TABLES;

-- Script concluído com sucesso!
-- Base de dados 'pharmacy_db' criada com 5 tabelas.
