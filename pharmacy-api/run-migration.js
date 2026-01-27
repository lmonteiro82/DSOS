const { sequelize } = require('./src/config/database');

async function runMigration() {
    try {
        console.log('🔄 Running migration to rodas_bengalas database...\n');

        // 1. Create medications table
        console.log('[1/4] Creating medications table...');
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS medications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                active_ingredient VARCHAR(255),
                price DECIMAL(10,2) NOT NULL DEFAULT 0,
                stock INT NOT NULL DEFAULT 0,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('✓ Medications table ready\n');

        // 2. Create orders table
        console.log('[2/4] Creating orders table...');
        await sequelize.query(`
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
                FOREIGN KEY (nursing_home_id) REFERENCES lares(id) ON DELETE CASCADE ON UPDATE CASCADE,
                FOREIGN KEY (patient_id) REFERENCES utentes(id) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('✓ Orders table ready\n');

        // 3. Create order_items table
        console.log('[3/4] Creating order_items table...');
        await sequelize.query(`
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
        `);
        console.log('✓ Order items table ready\n');

        // 4. Insert sample medications
        console.log('[4/4] Inserting sample medications...');
        await sequelize.query(`
            INSERT IGNORE INTO medications (name, description, active_ingredient, price, stock) VALUES
            ('Paracetamol 500mg', 'Analgésico e antipirético', 'Paracetamol', 4.50, 1000),
            ('Ibuprofeno 400mg', 'Anti-inflamatório não esteroide', 'Ibuprofeno', 6.80, 800),
            ('Omeprazol 20mg', 'Inibidor da bomba de protões', 'Omeprazol', 8.20, 600),
            ('Ácido Acetilsalicílico 100mg', 'Antiagregante plaquetário', 'Ácido Acetilsalicílico', 3.90, 1200),
            ('Sinvastatina 20mg', 'Hipolipemiante', 'Sinvastatina', 12.50, 500),
            ('Metformina 850mg', 'Antidiabético oral', 'Metformina', 5.30, 900),
            ('Atorvastatina 20mg', 'Hipolipemiante', 'Atorvastatina', 11.20, 700),
            ('Losartan 50mg', 'Anti-hipertensor', 'Losartan', 7.40, 650);
        `);
        console.log('✓ Sample medications inserted\n');

        console.log('\n✅ Migration completed successfully!\n');

        // Show summary
        const [summary] = await sequelize.query(`
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
        `);

        console.log('📊 Database Summary:');
        console.table(summary);

        // Show lares with API keys
        const [lares] = await sequelize.query(`
            SELECT id, nome, api_key FROM lares LIMIT 5;
        `);

        console.log('\n🔑 Lares with API Keys:');
        lares.forEach(lar => {
            console.log(`   ${lar.id}. ${lar.nome}: ${lar.api_key}`);
        });

        console.log('\n💡 Next steps:');
        console.log('   1. The Pharmacy API is now using the rodas_bengalas database');
        console.log('   2. You can safely drop the pharmacy_db database if you want');
        console.log('   3. Restart the API server to apply changes');

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

runMigration();
