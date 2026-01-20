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
        allowNull: false
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    phone: {
        type: DataTypes.STRING(50),
        allowNull: true
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
        allowNull: false,
        unique: true,
        field: 'api_key'
    }
}, {
    tableName: 'nursing_homes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

module.exports = NursingHome;
