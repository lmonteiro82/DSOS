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
        field: 'nursing_home_id',
        references: {
            model: 'nursing_homes',
            key: 'id'
        }
    },
    patientNumber: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'patient_number'
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    }
}, {
    tableName: 'patients',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

module.exports = Patient;
