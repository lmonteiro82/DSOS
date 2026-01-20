const { body, param, query } = require('express-validator');

const createOrderValidation = [
    body('nursingHomeId')
        .isInt({ min: 1 })
        .withMessage('Valid nursing home ID is required'),
    body('patientId')
        .isInt({ min: 1 })
        .withMessage('Valid patient ID is required'),
    body('items')
        .isArray({ min: 1 })
        .withMessage('At least one order item is required'),
    body('items.*.medicationId')
        .isInt({ min: 1 })
        .withMessage('Valid medication ID is required'),
    body('items.*.quantity')
        .isInt({ min: 1 })
        .withMessage('Quantity must be at least 1')
];

const createBatchOrderValidation = [
    body('orders')
        .isArray({ min: 1 })
        .withMessage('At least one order is required'),
    body('orders.*.nursingHomeId')
        .isInt({ min: 1 })
        .withMessage('Valid nursing home ID is required'),
    body('orders.*.patientId')
        .isInt({ min: 1 })
        .withMessage('Valid patient ID is required'),
    body('orders.*.items')
        .isArray({ min: 1 })
        .withMessage('At least one order item is required'),
    body('orders.*.items.*.medicationId')
        .isInt({ min: 1 })
        .withMessage('Valid medication ID is required'),
    body('orders.*.items.*.quantity')
        .isInt({ min: 1 })
        .withMessage('Quantity must be at least 1')
];

const orderIdValidation = [
    param('orderId')
        .isInt({ min: 1 })
        .withMessage('Valid order ID is required')
];

const updateStatusValidation = [
    param('orderId')
        .isInt({ min: 1 })
        .withMessage('Valid order ID is required'),
    body('status')
        .isIn(['SENT_TO_PHARMACY', 'PROCESSING', 'SENT_TO_NURSING_HOME', 'RECEIVED', 'CANCELLED'])
        .withMessage('Invalid order status')
];

const dateRangeValidation = [
    query('startDate')
        .optional()
        .isISO8601()
        .withMessage('Start date must be in ISO 8601 format'),
    query('endDate')
        .optional()
        .isISO8601()
        .withMessage('End date must be in ISO 8601 format')
];

const entityIdValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Valid ID is required')
];

module.exports = {
    createOrderValidation,
    createBatchOrderValidation,
    orderIdValidation,
    updateStatusValidation,
    dateRangeValidation,
    entityIdValidation
};
