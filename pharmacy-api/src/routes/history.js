const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');
const { authenticateApiKey } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { entityIdValidation, dateRangeValidation } = require('../validators/orderValidators');

/**
 * @route   GET /api/history/patient/:patientId
 * @desc    Get patient order history with optional date range
 * @access  Private (API Key)
 */
router.get(
    '/patient/:patientId',
    authenticateApiKey,
    [
        ...entityIdValidation.map(v => {
            // Change param name from 'id' to 'patientId'
            const newValidator = v;
            if (newValidator.builder && newValidator.builder.fields) {
                newValidator.builder.fields = ['patientId'];
            }
            return newValidator;
        }),
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
        ...entityIdValidation.map(v => {
            const newValidator = v;
            if (newValidator.builder && newValidator.builder.fields) {
                newValidator.builder.fields = ['nursingHomeId'];
            }
            return newValidator;
        }),
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
        ...entityIdValidation.map(v => {
            const newValidator = v;
            if (newValidator.builder && newValidator.builder.fields) {
                newValidator.builder.fields = ['medicationId'];
            }
            return newValidator;
        }),
        ...dateRangeValidation
    ],
    validate,
    historyController.getMedicationHistory
);

module.exports = router;
