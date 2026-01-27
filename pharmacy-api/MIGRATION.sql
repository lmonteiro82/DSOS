-- ============================================
-- MIGRATION: Pharmacy API - Ordem Correta
-- ============================================
-- Execute no phpMyAdmin na base de dados: rodas_bengalas
-- ============================================

USE rodas_bengalas;

-- ============================================
-- PASSO 1: Desativar verificação de FK
-- ============================================
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- PASSO 2: Remover TODAS as tabelas antigas (ordem correta)
-- ============================================
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS patients;
DROP TABLE IF EXISTS medications;
DROP TABLE IF EXISTS nursing_homes;

-- ============================================
-- PASSO 3: Reativar verificação de FK
-- ============================================
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- PASSO 4: Criar tabela orders
-- ============================================
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(100) NOT NULL UNIQUE,
    nursing_home_id INT NOT NULL,
    patient_id INT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'SENT_TO_PHARMACY',
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    cancelled_at DATETIME DEFAULT NULL,
    received_at DATETIME DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- PASSO 5: Adicionar Foreign Keys à tabela orders
-- ============================================
ALTER TABLE orders
ADD CONSTRAINT fk_orders_nursing_home 
FOREIGN KEY (nursing_home_id) REFERENCES lares(id) 
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE orders
ADD CONSTRAINT fk_orders_patient
FOREIGN KEY (patient_id) REFERENCES utentes(id) 
ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- PASSO 6: Criar tabela order_items
-- ============================================
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    medication_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 10.00,
    subtotal DECIMAL(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- PASSO 7: Adicionar Foreign Keys à tabela order_items
-- ============================================
ALTER TABLE order_items
ADD CONSTRAINT fk_order_items_order
FOREIGN KEY (order_id) REFERENCES orders(id) 
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE order_items
ADD CONSTRAINT fk_order_items_medication
FOREIGN KEY (medication_id) REFERENCES medicamentos(id) 
ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================
SELECT 'lares' as Tabela, COUNT(*) as Total FROM lares
UNION ALL
SELECT 'utentes', COUNT(*) FROM utentes
UNION ALL
SELECT 'medicamentos', COUNT(*) FROM medicamentos  
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'order_items', COUNT(*) FROM order_items;

SELECT id, nome, api_key FROM lares LIMIT 5;

-- ✅ MIGRAÇÃO COMPLETA!
-- Agora reinicie a Pharmacy API: kill -9 $(lsof -t -i:3000) && cd pharmacy-api && npm run dev
