const { sequelize } = require('./src/config/database');

async function addApiKeyColumn() {
    try {
        console.log('🔄 Checking api_key column in lares table...');

        // Check if column exists
        const [columns] = await sequelize.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'rodas_bengalas' 
            AND TABLE_NAME = 'lares' 
            AND COLUMN_NAME = 'api_key';
        `);

        if (columns.length === 0) {
            await sequelize.query(`ALTER TABLE lares ADD COLUMN api_key VARCHAR(255) NULL;`);
            console.log('✓ Column added');
        } else {
            console.log('✓ Column already exists');
        }

        // Generate API keys for lares without one
        await sequelize.query(`
            UPDATE lares 
            SET api_key = CONCAT('NH', LPAD(id, 3, '0'), '-', MD5(CONCAT(id, nome, RAND())))
            WHERE api_key IS NULL OR api_key = '';
        `);

        console.log('✓ API keys generated');

        // Show lares with their API keys
        const [lares] = await sequelize.query(`
            SELECT id, nome, api_key 
            FROM lares 
            LIMIT 10;
        `);

        console.log('\n📋 Lares with API Keys:');
        lares.forEach(lar => {
            console.log(`   ${lar.id}. ${lar.nome}: ${lar.api_key}`);
        });

        console.log('\n✅ Done!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

addApiKeyColumn();
