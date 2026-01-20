const { Order, OrderItem, OrderStatus, NursingHome, Patient, Medication } = require('../models');
const { sequelize } = require('../config/database');

/**
 * Generate unique order number
 */
const generateOrderNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${timestamp}-${random}`;
};

/**
 * Create a single order
 */
const createOrder = async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
        const { nursingHomeId, patientId, items } = req.body;

        // Verify nursing home exists
        const nursingHome = await NursingHome.findByPk(nursingHomeId);
        if (!nursingHome) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                error: 'Nursing home not found'
            });
        }

        // Verify patient exists and belongs to nursing home
        const patient = await Patient.findOne({
            where: { id: patientId, nursingHomeId }
        });
        if (!patient) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                error: 'Patient not found or does not belong to this nursing home'
            });
        }

        // Calculate total and prepare order items
        let totalAmount = 0;
        const orderItemsData = [];

        for (const item of items) {
            const medication = await Medication.findByPk(item.medicationId);
            if (!medication) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    error: `Medication with ID ${item.medicationId} not found`
                });
            }

            const subtotal = parseFloat(medication.price) * item.quantity;
            totalAmount += subtotal;

            orderItemsData.push({
                medicationId: item.medicationId,
                quantity: item.quantity,
                unitPrice: medication.price,
                subtotal
            });
        }

        // Create order
        const order = await Order.create({
            orderNumber: generateOrderNumber(),
            nursingHomeId,
            patientId,
            status: OrderStatus.SENT_TO_PHARMACY,
            totalAmount
        }, { transaction });

        // Create order items
        const orderItems = await Promise.all(
            orderItemsData.map(itemData =>
                OrderItem.create({
                    orderId: order.id,
                    ...itemData
                }, { transaction })
            )
        );

        await transaction.commit();

        // Fetch complete order with relationships
        const completeOrder = await Order.findByPk(order.id, {
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

        res.status(201).json({
            success: true,
            data: completeOrder
        });
    } catch (error) {
        await transaction.rollback();
        next(error);
    }
};

/**
 * Create multiple orders in batch
 */
const createBatchOrders = async (req, res, next) => {
    try {
        const { orders } = req.body;
        const results = [];
        const errors = [];

        for (let i = 0; i < orders.length; i++) {
            const transaction = await sequelize.transaction();

            try {
                const orderData = orders[i];
                const { nursingHomeId, patientId, items } = orderData;

                // Verify entities
                const nursingHome = await NursingHome.findByPk(nursingHomeId);
                const patient = await Patient.findOne({
                    where: { id: patientId, nursingHomeId }
                });

                if (!nursingHome || !patient) {
                    throw new Error('Invalid nursing home or patient');
                }

                // Calculate total
                let totalAmount = 0;
                const orderItemsData = [];

                for (const item of items) {
                    const medication = await Medication.findByPk(item.medicationId);
                    if (!medication) {
                        throw new Error(`Medication ${item.medicationId} not found`);
                    }

                    const subtotal = parseFloat(medication.price) * item.quantity;
                    totalAmount += subtotal;

                    orderItemsData.push({
                        medicationId: item.medicationId,
                        quantity: item.quantity,
                        unitPrice: medication.price,
                        subtotal
                    });
                }

                // Create order
                const order = await Order.create({
                    orderNumber: generateOrderNumber(),
                    nursingHomeId,
                    patientId,
                    status: OrderStatus.SENT_TO_PHARMACY,
                    totalAmount
                }, { transaction });

                // Create items
                await Promise.all(
                    orderItemsData.map(itemData =>
                        OrderItem.create({ orderId: order.id, ...itemData }, { transaction })
                    )
                );

                await transaction.commit();

                // Fetch complete order
                const completeOrder = await Order.findByPk(order.id, {
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

                results.push({
                    index: i,
                    success: true,
                    order: completeOrder
                });
            } catch (error) {
                await transaction.rollback();
                errors.push({
                    index: i,
                    success: false,
                    error: error.message
                });
            }
        }

        res.status(201).json({
            success: true,
            total: orders.length,
            successful: results.length,
            failed: errors.length,
            data: {
                created: results,
                errors
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get order by ID with status
 */
const getOrderStatus = async (req, res, next) => {
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

        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Cancel an order (only if status is SENT_TO_PHARMACY)
 */
const cancelOrder = async (req, res, next) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findByPk(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        if (order.status !== OrderStatus.SENT_TO_PHARMACY) {
            return res.status(400).json({
                success: false,
                error: 'Order can only be cancelled when status is SENT_TO_PHARMACY',
                currentStatus: order.status
            });
        }

        order.status = OrderStatus.CANCELLED;
        order.cancelledAt = new Date();
        await order.save();

        res.json({
            success: true,
            message: 'Order cancelled successfully',
            data: order
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update order status (internal use)
 */
const updateOrderStatus = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        const order = await Order.findByPk(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        // Prevent updating cancelled orders
        if (order.status === OrderStatus.CANCELLED) {
            return res.status(400).json({
                success: false,
                error: 'Cannot update status of cancelled order'
            });
        }

        order.status = status;

        if (status === OrderStatus.RECEIVED) {
            order.receivedAt = new Date();
        }

        await order.save();

        res.json({
            success: true,
            message: 'Order status updated successfully',
            data: order
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createOrder,
    createBatchOrders,
    getOrderStatus,
    cancelOrder,
    updateOrderStatus
};
