const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const NursingHome = sequelize.define('NursingHome', {
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
    address: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'morada'
    },
    phone: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'telefone'
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
            isEmail: true
        }
    },
    apiKey: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'api_key'
    }
}, {
    tableName: 'lares',
    timestamps: false
});

module.exports = NursingHome;
