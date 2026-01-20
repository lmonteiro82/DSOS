const NursingHome = require('./NursingHome');
const Patient = require('./Patient');
const Medication = require('./Medication');
const { Order, OrderStatus } = require('./Order');
const OrderItem = require('./OrderItem');

// Define relationships
NursingHome.hasMany(Patient, {
    foreignKey: 'nursingHomeId',
    as: 'patients'
});
Patient.belongsTo(NursingHome, {
    foreignKey: 'nursingHomeId',
    as: 'nursingHome'
});

NursingHome.hasMany(Order, {
    foreignKey: 'nursingHomeId',
    as: 'orders'
});
Order.belongsTo(NursingHome, {
    foreignKey: 'nursingHomeId',
    as: 'nursingHome'
});

Patient.hasMany(Order, {
    foreignKey: 'patientId',
    as: 'orders'
});
Order.belongsTo(Patient, {
    foreignKey: 'patientId',
    as: 'patient'
});

Order.hasMany(OrderItem, {
    foreignKey: 'orderId',
    as: 'items'
});
OrderItem.belongsTo(Order, {
    foreignKey: 'orderId',
    as: 'order'
});

Medication.hasMany(OrderItem, {
    foreignKey: 'medicationId',
    as: 'orderItems'
});
OrderItem.belongsTo(Medication, {
    foreignKey: 'medicationId',
    as: 'medication'
});

module.exports = {
    NursingHome,
    Patient,
    Medication,
    Order,
    OrderItem,
    OrderStatus
};
