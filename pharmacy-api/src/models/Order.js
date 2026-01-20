const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OrderStatus = {
    SENT_TO_PHARMACY: 'SENT_TO_PHARMACY',
    PROCESSING: 'PROCESSING',
    SENT_TO_NURSING_HOME: 'SENT_TO_NURSING_HOME',
    RECEIVED: 'RECEIVED',
    CANCELLED: 'CANCELLED'
};

const Order = sequelize.define('Order', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    orderNumber: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        field: 'order_number'
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
    patientId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'patient_id',
        references: {
            model: 'patients',
            key: 'id'
        }
    },
    status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: OrderStatus.SENT_TO_PHARMACY,
        validate: {
            isIn: [Object.values(OrderStatus)]
        }
    },
    totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
        field: 'total_amount'
    },
    cancelledAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'cancelled_at'
    },
    receivedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'received_at'
    }
}, {
    tableName: 'orders',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = { Order, OrderStatus };
