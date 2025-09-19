const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Microservice URLs
const SERVICES = {
  USER_SERVICE: process.env.USER_SERVICE_URL || 'http://localhost:3001',
  OTP_SERVICE: process.env.OTP_SERVICE_URL || 'http://localhost:3007',
  NOTIFICATION_SERVICE: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3006'
};

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors());
app.use(morgan('combined'));

// Serve static files
app.use('/static', express.static(path.join(__dirname, 'public')));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Documentation
app.get('/api-docs', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'api-docs.html'));
});

app.get('/api-docs/spec', (req, res) => {
  res.json({
    info: {
      title: 'FreedmAI Microservices API Gateway',
      version: '2.0.0',
      description: 'Microservices API Gateway for FreedmAI platform with OTP authentication, user management, and notifications'
    },
    architecture: 'microservices',
    services: {
      'api-gateway': {
        port: 3000,
        url: 'http://localhost:3000',
        role: 'Request routing and service discovery',
        health: '/health'
      },
      'user-service': {
        port: 3001,
        url: `${SERVICES.USER_SERVICE}`,
        role: 'User management and profiles',
        routes: '/api/users/*',
        tables: ['users', 'identities', 'kyc_summary']
      },
      'otp-service': {
        port: 3007,
        url: `${SERVICES.OTP_SERVICE}`,
        role: 'Authentication and OTP management',
        routes: '/api/auth/*',
        tables: ['otp_attempts', 'sessions']
      },
      'notification-service': {
        port: 3006,
        url: `${SERVICES.NOTIFICATION_SERVICE}`,
        role: 'SMS and email notifications',
        routes: '/api/notifications/*',
        tables: ['audit_logs']
      }
    },
    endpoints: [
      {
        id: 'send-otp',
        method: 'POST',
        path: '/api/auth/send-otp',
        service: 'otp-service',
        summary: 'Send OTP to phone number',
        description: 'Generate and send OTP for phone verification with rate limiting'
      },
      {
        id: 'verify-otp',
        method: 'POST',
        path: '/api/auth/verify-otp',
        service: 'otp-service',
        summary: 'Verify OTP and login',
        description: 'Verify OTP code and return JWT tokens for authentication'
      },
      {
        id: 'refresh-token',
        method: 'POST',
        path: '/api/auth/refresh',
        service: 'otp-service',
        summary: 'Refresh access token',
        description: 'Generate new access token using refresh token'
      },
      {
        id: 'user-register',
        method: 'POST',
        path: '/api/users/register',
        service: 'user-service',
        summary: 'Complete user registration',
        description: 'Complete user profile with personal information',
        auth: 'required'
      },
      {
        id: 'user-profile',
        method: 'GET',
        path: '/api/users/profile',
        service: 'user-service',
        summary: 'Get user profile',
        description: 'Retrieve complete user profile with KYC status',
        auth: 'required'
      },
      {
        id: 'update-profile',
        method: 'PUT',
        path: '/api/users/profile',
        service: 'user-service',
        summary: 'Update user profile',
        description: 'Update user profile information',
        auth: 'required'
      },
      {
        id: 'send-sms',
        method: 'POST',
        path: '/api/notifications/sms',
        service: 'notification-service',
        summary: 'Send SMS notification',
        description: 'Send SMS using templates with variable substitution'
      },
      {
        id: 'health-check',
        method: 'GET',
        path: '/health',
        service: 'api-gateway',
        summary: 'System health check',
        description: 'Check health of API Gateway and all connected microservices'
      }
    ],
    security: {
      authentication: 'JWT Bearer Token',
      otp: {
        length: 6,
        expiry: '5 minutes',
        rate_limit: '3 per 5 minutes'
      },
      tokens: {
        access_token: '15 minutes',
        refresh_token: '30 days'
      }
    }
  });
});

// Health check with service status
app.get('/health', async (req, res) => {
  const serviceHealth = {};
  
  // Check each microservice health
  for (const [name, url] of Object.entries(SERVICES)) {
    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(`${url}/health`, { timeout: 5000 });
      serviceHealth[name.toLowerCase()] = {
        status: response.ok ? 'UP' : 'DOWN',
        url: url
      };
    } catch (error) {
      serviceHealth[name.toLowerCase()] = {
        status: 'DOWN',
        url: url,
        error: error.message
      };
    }
  }

  const allServicesUp = Object.values(serviceHealth).every(s => s.status === 'UP');
  
  res.status(allServicesUp ? 200 : 503).json({
    status: allServicesUp ? 'UP' : 'DEGRADED',
    service: 'FreedmAI API Gateway',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: serviceHealth
  });
});

// Microservice Proxy Routes
app.use('/api/users', createProxyMiddleware({
  target: SERVICES.USER_SERVICE,
  changeOrigin: true,
  pathRewrite: {
    '^/api/users': '/users'
  },
  onError: (err, req, res) => {
    res.status(503).json({
      success: false,
      error: 'User Service Unavailable',
      message: 'Unable to connect to User Service'
    });
  }
}));

app.use('/api/auth', createProxyMiddleware({
  target: SERVICES.OTP_SERVICE,
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': '/otp'
  },
  onError: (err, req, res) => {
    res.status(503).json({
      success: false,
      error: 'OTP Service Unavailable',
      message: 'Unable to connect to OTP Service'
    });
  }
}));

app.use('/api/notifications', createProxyMiddleware({
  target: SERVICES.NOTIFICATION_SERVICE,
  changeOrigin: true,
  pathRewrite: {
    '^/api/notifications': '/notifications'
  },
  onError: (err, req, res) => {
    res.status(503).json({
      success: false,
      error: 'Notification Service Unavailable',
      message: 'Unable to connect to Notification Service'
    });
  }
}));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `${req.method} ${req.originalUrl} not found`,
    available_routes: ['/api/users/*', '/api/auth/*', '/api/notifications/*'],
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Gateway Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log('🚀 FreedmAI API Gateway running on port', PORT);
  console.log('📊 Health check: http://localhost:' + PORT + '/health');
  console.log('📚 API Documentation: http://localhost:' + PORT + '/api-docs');
  console.log('🔗 Routing to services:');
  Object.entries(SERVICES).forEach(([name, url]) => {
    console.log(`   ${name}: ${url}`);
  });
});

module.exports = app;
