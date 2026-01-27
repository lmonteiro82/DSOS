const { Order, OrderItem, Patient, NursingHome, Medication } = require('../models');
const { Op } = require('sequelize');

/**
 * Get patient order history
 */
const getPatientHistory = async (req, res, next) => {
    try {
        const { patientNumber } = req.params;
        const { startDate, endDate } = req.query;

        // Find patient by ID or numero_utente
        const patient = await Patient.findOne({
            where: {
                [Op.or]: [
                    { id: patientNumber },
                    { numero_utente: patientNumber }
                ]
            }
        });

        if (!patient) {
            return res.status(404).json({
                success: false,
                error: `Patient with ID/number ${patientNumber} not found`
            });
        }

        const whereClause = { patientId: patient.id };

        // Add date filtering if provided
        if (startDate || endDate) {
            whereClause.created_at = {};
            if (startDate) {
                whereClause.created_at[Op.gte] = new Date(startDate);
            }
            if (endDate) {
                whereClause.created_at[Op.lte] = new Date(endDate);
            }
        }

        const orders = await Order.findAll({
            where: whereClause,
            include: [
                { model: NursingHome, as: 'nursingHome' },
                { model: Patient, as: 'patient' },
                {
                    model: OrderItem,
                    as: 'items',
                    include: [{ model: Medication, as: 'medication' }]
                }
            ],
            order: [['created_at', 'DESC']]
        });

        const totalAmount = orders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);

        res.json({
            success: true,
            patientNumber,
            patientName: patient.name,
            count: orders.length,
            totalAmount: totalAmount.toFixed(2),
            dateRange: {
                start: startDate || 'all',
                end: endDate || 'all'
            },
            data: orders
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get nursing home order history
 */
const getNursingHomeHistory = async (req, res, next) => {
    try {
        const { nursingHomeId } = req.params;
        const { startDate, endDate } = req.query;

        const whereClause = { nursingHomeId };

        if (startDate || endDate) {
            whereClause.created_at = {};
            if (startDate) {
                whereClause.created_at[Op.gte] = new Date(startDate);
            }
            if (endDate) {
                whereClause.created_at[Op.lte] = new Date(endDate);
            }
        }

        const orders = await Order.findAll({
            where: whereClause,
            include: [
                { model: NursingHome, as: 'nursingHome' },
                { model: Patient, as: 'patient' },
                {
                    model: OrderItem,
                    as: 'items',
                    include: [{ model: Medication, as: 'medication' }]
                }
            ],
            order: [['created_at', 'DESC']]
        });

        const totalAmount = orders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
        const statusBreakdown = orders.reduce((acc, order) => {
            acc[order.status] = (acc[order.status] || 0) + 1;
            return acc;
        }, {});

        res.json({
            success: true,
            count: orders.length,
            totalAmount: totalAmount.toFixed(2),
            statusBreakdown,
            dateRange: {
                start: startDate || 'all',
                end: endDate || 'all'
            },
            data: orders
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get medication order history
 */
const getMedicationHistory = async (req, res, next) => {
    try {
        const { medicationId } = req.params;
        const { startDate, endDate } = req.query;

        const whereClause = {};

        if (startDate || endDate) {
            whereClause.created_at = {};
            if (startDate) {
                whereClause.created_at[Op.gte] = new Date(startDate);
            }
            if (endDate) {
                whereClause.created_at[Op.lte] = new Date(endDate);
            }
        }

        const orderItems = await OrderItem.findAll({
            where: { medicationId },
            include: [
                {
                    model: Order,
                    as: 'order',
                    where: whereClause,
                    include: [
                        { model: NursingHome, as: 'nursingHome' },
                        { model: Patient, as: 'patient' }
                    ]
                },
                { model: Medication, as: 'medication' }
            ],
            order: [[{ model: Order, as: 'order' }, 'created_at', 'DESC']]
        });

        const totalQuantity = orderItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalRevenue = orderItems.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);

        res.json({
            success: true,
            count: orderItems.length,
            totalQuantity,
            totalRevenue: totalRevenue.toFixed(2),
            dateRange: {
                start: startDate || 'all',
                end: endDate || 'all'
            },
            data: orderItems
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getPatientHistory,
    getNursingHomeHistory,
    getMedicationHistory
};
