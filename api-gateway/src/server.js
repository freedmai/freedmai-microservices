const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/gateway.log' })
  ]
});

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Service routes configuration - using Docker service names
const services = {
  '/api/auth': process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
  '/api/billing': process.env.BILLING_SERVICE_URL || 'http://billing-service:3002',
  '/api/payment': process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3003',
  '/api/user': process.env.USER_SERVICE_URL || 'http://user-service:3004',
  '/api/notification': process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3005'
};

// Setup proxy middleware for each service
Object.keys(services).forEach(path => {
  app.use(path, createProxyMiddleware({
    target: services[path],
    changeOrigin: true,
    pathRewrite: { [`^${path}`]: '' },
    onError: (err, req, res) => {
      logger.error(`Proxy error for ${path}:`, err.message);
      res.status(503).json({ error: 'Service unavailable' });
    },
    onProxyReq: (proxyReq, req) => {
      logger.info(`Proxying ${req.method} ${req.url} to ${services[path]}`);
    }
  }));
});

// Error handling
app.use((err, req, res, next) => {
  logger.error('Gateway error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`);
  logger.info('Service routes:', services);
});

module.exports = app;
