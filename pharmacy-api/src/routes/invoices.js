const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { authenticateApiKey } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { orderIdValidation, entityIdValidation, dateRangeValidation } = require('../validators/orderValidators');
const { query } = require('express-validator');

/**
 * @route   GET /api/invoices/:orderId
 * @desc    Get invoice data for a specific order
 * @access  Private (API Key)
 */
router.get(
    '/:orderId',
    authenticateApiKey,
    orderIdValidation,
    validate,
    invoiceController.getOrderInvoice
);

/**
 * @route   GET /api/invoices/nursing-home/:nursingHomeId
 * @desc    Get all invoices for a nursing home
 * @access  Private (API Key)
 */
router.get(
    '/nursing-home/:nursingHomeId',
    authenticateApiKey,
    [
        ...entityIdValidation.map(v => {
            const newValidator = v;
            if (newValidator.builder && newValidator.builder.fields) {
                newValidator.builder.fields = ['nursingHomeId'];
            }
            return newValidator;
        }),
        ...dateRangeValidation,
        query('status')
            .optional()
            .isIn(['SENT_TO_PHARMACY', 'PROCESSING', 'SENT_TO_NURSING_HOME', 'RECEIVED', 'CANCELLED'])
            .withMessage('Invalid status filter')
    ],
    validate,
    invoiceController.getNursingHomeInvoices
);

module.exports = router;
