const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Patient = sequelize.define('Patient', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nursingHomeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'lar_id',
        references: {
            model: 'lares',
            key: 'id'
        }
    },
    patientNumber: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'numero_utente'
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'nome'
    }
}, {
    tableName: 'utentes',
    timestamps: false
});

module.exports = Patient;
