const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Medication = sequelize.define('Medication', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'nome'
    },
    description: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'principio_ativo'
    },
    activeIngredient: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'principio_ativo'
    },
    marca: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'marca'
    },
    dose: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'dose'
    },
    // Price and stock are hardcoded defaults since they don't exist in DSOS table
    price: {
        type: DataTypes.VIRTUAL,
        get() {
            return 10.00; // Default price
        }
    },
    stock: {
        type: DataTypes.VIRTUAL,
        get() {
            return 999; // Always in stock
        }
    },
    nursingHomeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'lar_id'
    },
    active: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: true,
        field: 'ativo'
    },
    minStock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'minimo'
    }
}, {
    tableName: 'medicamentos',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Medication;
