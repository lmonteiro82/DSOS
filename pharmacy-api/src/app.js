const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const { sequelize, testConnection } = require('./config/database');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Import routes
const orderRoutes = require('./routes/orders');
const historyRoutes = require('./routes/history');
const invoiceRoutes = require('./routes/invoices');

const app = express();
const PORT = process.env.PORT || 3000;
const API_PREFIX = process.env.API_PREFIX || '/api';

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Pharmacy API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// API routes
app.use(`${API_PREFIX}/orders`, orderRoutes);
app.use(`${API_PREFIX}/history`, historyRoutes);
app.use(`${API_PREFIX}/invoices`, invoiceRoutes);

// API documentation endpoint
app.get(`${API_PREFIX}`, (req, res) => {
    res.json({
        success: true,
        message: 'Pharmacy REST API',
        version: '1.0.0',
        endpoints: {
            orders: {
                'POST /api/orders': 'Create a single order',
                'POST /api/orders/batch': 'Create multiple orders',
                'GET /api/orders/:orderId': 'Get order status',
                'PUT /api/orders/:orderId/cancel': 'Cancel order (only if SENT_TO_PHARMACY)',
                'PUT /api/orders/:orderId/status': 'Update order status'
            },
            history: {
                'GET /api/history/patient/:patientId': 'Get patient order history',
                'GET /api/history/nursing-home/:nursingHomeId': 'Get nursing home order history',
                'GET /api/history/medication/:medicationId': 'Get medication order history'
            },
            invoices: {
                'GET /api/invoices/:orderId': 'Get invoice for specific order',
                'GET /api/invoices/nursing-home/:nursingHomeId': 'Get all invoices for nursing home'
            }
        },
        authentication: 'API Key (x-api-key header) or JWT Bearer token',
        orderStatuses: [
            'SENT_TO_PHARMACY',
            'PROCESSING',
            'SENT_TO_NURSING_HOME',
            'RECEIVED',
            'CANCELLED'
        ]
    });
});

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Database initialization and server start
const startServer = async () => {
    try {
        console.log('🔄 Connecting to database...');
        await testConnection();

        console.log('🔄 Synchronizing database models...');
        await sequelize.sync({ alter: false }); // Set to true for development to auto-update schema

        console.log('✓ Database synchronized');

        app.listen(PORT, () => {
            console.log(`✓ Server running on port ${PORT}`);
            console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`✓ API available at http://localhost:${PORT}${API_PREFIX}`);
            console.log(`✓ Health check at http://localhost:${PORT}/health`);
        });
    } catch (error) {
        console.error('✗ Failed to start server:', error);
        process.exit(1);
    }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server');
    await sequelize.close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT signal received: closing HTTP server');
    await sequelize.close();
    process.exit(0);
});

// Start the server
if (require.main === module) {
    startServer();
}

module.exports = app;
