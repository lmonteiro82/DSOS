const { sequelize } = require('./config/database');
const { NursingHome, Patient, Medication, Order, OrderItem } = require('./models');
const bcrypt = require('bcrypt');

/**
 * Initialize database with sample data
 */
const initDatabase = async () => {
    try {
        console.log('🔄 Initializing database...');

        // Sync all models (create tables)
        await sequelize.sync({ force: true }); // WARNING: This drops all tables
        console.log('✓ Database tables created');

        // Create sample nursing homes
        const nursingHomes = await NursingHome.bulkCreate([
            {
                name: 'Rodas&Bengalas - Unidade Norte',
                address: 'Rua das Flores, 123, Porto',
                phone: '+351 220 000 001',
                email: 'norte@rodasebengalas.pt',
                apiKey: 'NH001-' + require('crypto').randomBytes(16).toString('hex')
            },
            {
                name: 'Rodas&Bengalas - Unidade Sul',
                address: 'Avenida da Liberdade, 456, Lisboa',
                phone: '+351 210 000 002',
                email: 'sul@rodasebengalas.pt',
                apiKey: 'NH002-' + require('crypto').randomBytes(16).toString('hex')
            }
        ]);
        console.log('✓ Created nursing homes');

        // Create sample patients
        const patients = await Patient.bulkCreate([
            {
                nursingHomeId: nursingHomes[0].id,
                patientNumber: 'P001',
                name: 'João Silva'
            },
            {
                nursingHomeId: nursingHomes[0].id,
                patientNumber: 'P002',
                name: 'Maria Santos'
            },
            {
                nursingHomeId: nursingHomes[1].id,
                patientNumber: 'P003',
                name: 'António Costa'
            },
            {
                nursingHomeId: nursingHomes[1].id,
                patientNumber: 'P004',
                name: 'Ana Pereira'
            }
        ]);
        console.log('✓ Created patients');

        // Create sample medications
        const medications = await Medication.bulkCreate([
            {
                name: 'Paracetamol 500mg',
                description: 'Analgésico e antipirético',
                activeIngredient: 'Paracetamol',
                price: 4.50,
                stock: 1000
            },
            {
                name: 'Ibuprofeno 400mg',
                description: 'Anti-inflamatório não esteroide',
                activeIngredient: 'Ibuprofeno',
                price: 6.80,
                stock: 800
            },
            {
                name: 'Omeprazol 20mg',
                description: 'Inibidor da bomba de protões',
                activeIngredient: 'Omeprazol',
                price: 8.20,
                stock: 600
            },
            {
                name: 'Ácido Acetilsalicílico 100mg',
                description: 'Antiagregante plaquetário',
                activeIngredient: 'Ácido Acetilsalicílico',
                price: 3.90,
                stock: 1200
            },
            {
                name: 'Sinvastatina 20mg',
                description: 'Hipolipemiante',
                activeIngredient: 'Sinvastatina',
                price: 12.50,
                stock: 500
            }
        ]);
        console.log('✓ Created medications');

        console.log('\n✅ Database initialized successfully!\n');
        console.log('📋 Sample API Keys:');
        nursingHomes.forEach(nh => {
            console.log(`   ${nh.name}: ${nh.apiKey}`);
        });
        console.log('\n💡 Use these API keys in the x-api-key header for authentication\n');

        process.exit(0);
    } catch (error) {
        console.error('✗ Error initializing database:', error);
        process.exit(1);
    }
};

initDatabase();
