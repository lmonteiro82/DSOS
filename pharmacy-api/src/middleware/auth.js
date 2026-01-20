const { NursingHome } = require('../models');
const { verifyToken } = require('../config/auth');

/**
 * Middleware to authenticate requests using API Key
 */
const authenticateApiKey = async (req, res, next) => {
    try {
        const apiKey = req.headers['x-api-key'];

        if (!apiKey) {
            return res.status(401).json({
                success: false,
                error: 'API key is required'
            });
        }

        const nursingHome = await NursingHome.findOne({ where: { apiKey } });

        if (!nursingHome) {
            return res.status(401).json({
                success: false,
                error: 'Invalid API key'
            });
        }

        // Attach nursing home info to request
        req.nursingHome = nursingHome;
        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: 'Authentication failed'
        });
    }
};

/**
 * Middleware to authenticate requests using JWT token
 */
const authenticateJWT = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'JWT token is required'
            });
        }

        const token = authHeader.substring(7);
        const decoded = verifyToken(token);

        if (!decoded) {
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired token'
            });
        }

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: 'Authentication failed'
        });
    }
};

/**
 * Optional authentication - tries both methods
 */
const optionalAuth = async (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    const authHeader = req.headers.authorization;

    if (apiKey) {
        return authenticateApiKey(req, res, next);
    } else if (authHeader) {
        return authenticateJWT(req, res, next);
    } else {
        next();
    }
};

module.exports = {
    authenticateApiKey,
    authenticateJWT,
    optionalAuth
};
