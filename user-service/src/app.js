const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const userRoutes = require('./routes/userRoutes');
const database = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'FreedmAI User Service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Database health check
app.get('/health/db', async (req, res) => {
  try {
    const connection = database.getConnection();
    if (!connection) {
      return res.status(503).json({
        status: 'ERROR',
        message: 'Database not connected',
        timestamp: new Date().toISOString()
      });
    }
    
    const [rows] = await connection.execute('SELECT 1 as test');
    res.status(200).json({
      status: 'OK',
      message: 'Database connected',
      test_result: rows[0],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      message: 'Database connection failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Routes
app.use('/users', userRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// Initialize database connection and start server
async function startServer() {
  try {
    // Try to connect to database
    await database.connect();
    
    app.listen(PORT, () => {
      console.log(`🚀 FreedmAI User Service running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🗄️  Database health: http://localhost:${PORT}/health/db`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.log('🔄 Starting server without database connection...');
    
    app.listen(PORT, () => {
      console.log(`🚀 FreedmAI User Service running on port ${PORT} (DB disconnected)`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🗄️  Database health: http://localhost:${PORT}/health/db`);
    });
  }
}

startServer();

module.exports = app;
