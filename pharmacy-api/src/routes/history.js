const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');
const { authenticateApiKey } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { param } = require('express-validator');
const { dateRangeValidation } = require('../validators/orderValidators');

/**
 * @route   GET /api/history/patient/:patientNumber
 * @desc    Get patient order history with optional date range
 * @access  Private (API Key)
 */
router.get(
    '/patient/:patientNumber',
    authenticateApiKey,
    [
        param('patientNumber').notEmpty().withMessage('Patient number is required'),
        ...dateRangeValidation
    ],
    validate,
    historyController.getPatientHistory
);

/**
 * @route   GET /api/history/nursing-home/:nursingHomeId
 * @desc    Get nursing home order history with optional date range
 * @access  Private (API Key)
 */
router.get(
    '/nursing-home/:nursingHomeId',
    authenticateApiKey,
    [
        param('nursingHomeId').isInt({ min: 1 }).withMessage('Valid nursing home ID is required'),
        ...dateRangeValidation
    ],
    validate,
    historyController.getNursingHomeHistory
);

/**
 * @route   GET /api/history/medication/:medicationId
 * @desc    Get medication order history with optional date range
 * @access  Private (API Key)
 */
router.get(
    '/medication/:medicationId',
    authenticateApiKey,
    [
        param('medicationId').isInt({ min: 1 }).withMessage('Valid medication ID is required'),
        ...dateRangeValidation
    ],
    validate,
    historyController.getMedicationHistory
);

module.exports = router;
