const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateApiKey } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const {
    createOrderValidation,
    createBatchOrderValidation,
    orderIdValidation,
    updateStatusValidation
} = require('../validators/orderValidators');

/**
 * @route   POST /api/orders
 * @desc    Create a single order
 * @access  Private (API Key)
 */
router.post(
    '/',
    authenticateApiKey,
    createOrderValidation,
    validate,
    orderController.createOrder
);

/**
 * @route   POST /api/orders/batch
 * @desc    Create multiple orders in one request
 * @access  Private (API Key)
 */
router.post(
    '/batch',
    authenticateApiKey,
    createBatchOrderValidation,
    validate,
    orderController.createBatchOrders
);

/**
 * @route   GET /api/orders/:orderId
 * @desc    Get order status and details
 * @access  Private (API Key)
 */
router.get(
    '/:orderId',
    authenticateApiKey,
    orderIdValidation,
    validate,
    orderController.getOrderStatus
);

/**
 * @route   PUT /api/orders/:orderId/cancel
 * @desc    Cancel an order (only if status is SENT_TO_PHARMACY)
 * @access  Private (API Key)
 */
router.put(
    '/:orderId/cancel',
    authenticateApiKey,
    orderIdValidation,
    validate,
    orderController.cancelOrder
);

/**
 * @route   PUT /api/orders/:orderId/status
 * @desc    Update order status (internal use)
 * @access  Private (API Key)
 */
router.put(
    '/:orderId/status',
    authenticateApiKey,
    updateStatusValidation,
    validate,
    orderController.updateOrderStatus
);

module.exports = router;
