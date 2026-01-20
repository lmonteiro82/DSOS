const { Order, OrderItem, NursingHome, Patient, Medication } = require('../models');
const { Op } = require('sequelize');

/**
 * Generate invoice data for a specific order
 */
const getOrderInvoice = async (req, res, next) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findByPk(orderId, {
            include: [
                { model: NursingHome, as: 'nursingHome' },
                { model: Patient, as: 'patient' },
                {
                    model: OrderItem,
                    as: 'items',
                    include: [{ model: Medication, as: 'medication' }]
                }
            ]
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        // Generate invoice structure
        const invoice = {
            invoiceNumber: `INV-${order.orderNumber}`,
            invoiceDate: order.created_at,
            orderNumber: order.orderNumber,
            status: order.status,

            // Customer info
            customer: {
                nursingHome: {
                    name: order.nursingHome.name,
                    address: order.nursingHome.address,
                    phone: order.nursingHome.phone,
                    email: order.nursingHome.email
                },
                patient: {
                    name: order.patient.name,
                    patientNumber: order.patient.patientNumber
                }
            },

            // Line items
            items: order.items.map(item => ({
                medicationName: item.medication.name,
                description: item.medication.description,
                activeIngredient: item.medication.activeIngredient,
                quantity: item.quantity,
                unitPrice: parseFloat(item.unitPrice).toFixed(2),
                subtotal: parseFloat(item.subtotal).toFixed(2)
            })),

            // Totals
            subtotal: parseFloat(order.totalAmount).toFixed(2),
            tax: (parseFloat(order.totalAmount) * 0.23).toFixed(2), // 23% IVA (Portuguese VAT)
            total: (parseFloat(order.totalAmount) * 1.23).toFixed(2),

            // Dates
            createdAt: order.created_at,
            receivedAt: order.receivedAt,
            cancelledAt: order.cancelledAt
        };

        res.json({
            success: true,
            data: invoice
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all invoices for a nursing home
 */
const getNursingHomeInvoices = async (req, res, next) => {
    try {
        const { nursingHomeId } = req.params;
        const { startDate, endDate, status } = req.query;

        const whereClause = { nursingHomeId };

        // Add date filtering
        if (startDate || endDate) {
            whereClause.created_at = {};
            if (startDate) {
                whereClause.created_at[Op.gte] = new Date(startDate);
            }
            if (endDate) {
                whereClause.created_at[Op.lte] = new Date(endDate);
            }
        }

        // Add status filtering
        if (status) {
            whereClause.status = status;
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

        const invoices = orders.map(order => ({
            invoiceNumber: `INV-${order.orderNumber}`,
            invoiceDate: order.created_at,
            orderNumber: order.orderNumber,
            status: order.status,
            patientName: order.patient.name,
            itemCount: order.items.length,
            subtotal: parseFloat(order.totalAmount).toFixed(2),
            tax: (parseFloat(order.totalAmount) * 0.23).toFixed(2),
            total: (parseFloat(order.totalAmount) * 1.23).toFixed(2)
        }));

        const totalSubtotal = orders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
        const totalTax = totalSubtotal * 0.23;
        const grandTotal = totalSubtotal * 1.23;

        res.json({
            success: true,
            count: invoices.length,
            summary: {
                subtotal: totalSubtotal.toFixed(2),
                tax: totalTax.toFixed(2),
                total: grandTotal.toFixed(2)
            },
            dateRange: {
                start: startDate || 'all',
                end: endDate || 'all'
            },
            data: invoices
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getOrderInvoice,
    getNursingHomeInvoices
};
