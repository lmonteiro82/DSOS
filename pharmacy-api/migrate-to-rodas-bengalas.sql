-- ============================================
-- Migration Script: Pharmacy API to rodas_bengalas Database
-- ============================================
-- This script creates the Pharmacy API tables in the rodas_bengalas database
-- and removes the separate pharmacy_db database

USE rodas_bengalas;

-- ============================================
-- 1. Create Medications Table
-- ============================================
CREATE TABLE IF NOT EXISTS medications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    active_ingredient VARCHAR(255),
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    stock INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 2. Create Orders Table
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(100) NOT NULL UNIQUE,
    nursing_home_id INT NOT NULL,
    patient_id INT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'SENT_TO_PHARMACY',
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    cancelled_at DATETIME,
    received_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys referencing existing tables
    FOREIGN KEY (nursing_home_id) REFERENCES lares(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES utentes(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 3. Create Order Items Table
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    medication_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 4. Insert Sample Medications
-- ============================================
INSERT INTO medications (name, description, active_ingredient, price, stock) VALUES
('Paracetamol 500mg', 'Analgésico e antipirético', 'Paracetamol', 4.50, 1000),
('Ibuprofeno 400mg', 'Anti-inflamatório não esteroide', 'Ibuprofeno', 6.80, 800),
('Omeprazol 20mg', 'Inibidor da bomba de protões', 'Omeprazol', 8.20, 600),
('Ácido Acetilsalicílico 100mg', 'Antiagregante plaquetário', 'Ácido Acetilsalicílico', 3.90, 1200),
('Sinvastatina 20mg', 'Hipolipemiante', 'Sinvastatina', 12.50, 500),
('Metformina 850mg', 'Antidiabético oral', 'Metformina', 5.30, 900),
('Atorvastatina 20mg', 'Hipolipemiante', 'Atorvastatina', 11.20, 700),
('Losartan 50mg', 'Anti-hipertensor', 'Losartan', 7.40, 650)
ON DUPLICATE KEY UPDATE name=name;

-- ============================================
-- 5. Verify api_key column exists in lares
-- ============================================
-- (This was already done by add-api-keys.js script)

-- ============================================
-- 6. Drop pharmacy_db database (CAREFUL!)
-- ============================================
-- Uncomment the line below when you're sure you want to delete pharmacy_db
-- DROP DATABASE IF EXISTS pharmacy_db;

-- ============================================
-- 7. Verification Queries
-- ============================================
SELECT 'Tables created successfully!' as Status;

SELECT 
    'lares' as TableName, 
    COUNT(*) as RecordCount 
FROM lares
UNION ALL
SELECT 
    'utentes' as TableName, 
    COUNT(*) as RecordCount 
FROM utentes
UNION ALL
SELECT 
    'medications' as TableName, 
    COUNT(*) as RecordCount 
FROM medications
UNION ALL
SELECT 
    'orders' as TableName, 
    COUNT(*) as RecordCount 
FROM orders
UNION ALL
SELECT 
    'order_items' as TableName, 
    COUNT(*) as RecordCount 
FROM order_items;

-- Show lares with API keys
SELECT id, nome, api_key FROM lares LIMIT 5;
