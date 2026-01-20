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
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    activeIngredient: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'active_ingredient'
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
}, {
    tableName: 'medications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

module.exports = Medication;
