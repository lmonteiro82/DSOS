-- ============================================
-- Script de Dados de Exemplo (SEED)
-- Pharmacy API - Rodas&Bengalas
-- ============================================

USE pharmacy_db;

-- ============================================
-- Inserir Lares (Nursing Homes)
-- ============================================
INSERT INTO nursing_homes (name, address, phone, email, api_key) VALUES
('Rodas&Bengalas - Unidade Norte', 'Rua das Flores, 123, Porto', '+351 220 000 001', 'norte@rodasebengalas.pt', 'NH001-abc123def456ghi789'),
('Rodas&Bengalas - Unidade Sul', 'Avenida da Liberdade, 456, Lisboa', '+351 210 000 002', 'sul@rodasebengalas.pt', 'NH002-xyz789uvw456rst123');

-- ============================================
-- Inserir Utentes (Patients)
-- ============================================
INSERT INTO patients (nursing_home_id, patient_number, name) VALUES
(1, 'P001', 'João Silva'),
(1, 'P002', 'Maria Santos'),
(2, 'P003', 'António Costa'),
(2, 'P004', 'Ana Pereira');

-- ============================================
-- Inserir Medicamentos (Medications)
-- ============================================
INSERT INTO medications (name, description, active_ingredient, price, stock) VALUES
('Paracetamol 500mg', 'Analgésico e antipirético', 'Paracetamol', 4.50, 1000),
('Ibuprofeno 400mg', 'Anti-inflamatório não esteroide', 'Ibuprofeno', 6.80, 800),
('Omeprazol 20mg', 'Inibidor da bomba de protões', 'Omeprazol', 8.20, 600),
('Ácido Acetilsalicílico 100mg', 'Antiagregante plaquetário', 'Ácido Acetilsalicílico', 3.90, 1200),
('Sinvastatina 20mg', 'Hipolipemiante', 'Sinvastatina', 12.50, 500),
('Metformina 850mg', 'Antidiabético oral', 'Metformina', 7.30, 700),
('Losartan 50mg', 'Anti-hipertensivo', 'Losartan', 9.60, 550),
('Atorvastatina 20mg', 'Hipolipemiante', 'Atorvastatina', 11.20, 450);

-- ============================================
-- Verificar dados inseridos
-- ============================================
SELECT 'Lares:', COUNT(*) FROM nursing_homes
UNION ALL
SELECT 'Utentes:', COUNT(*) FROM patients
UNION ALL
SELECT 'Medicamentos:', COUNT(*) FROM medications;

-- ============================================
-- Mostrar API Keys (GUARDAR ESTAS CHAVES!)
-- ============================================
SELECT 
  name as 'Lar',
  api_key as 'API Key (Usar no header x-api-key)'
FROM nursing_homes;
