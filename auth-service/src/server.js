const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const cors = require('cors');
const winston = require('winston');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/auth.log' })
  ]
});

app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'auth-service', timestamp: new Date().toISOString() });
});

// Mock user data
const users = [
  { id: 1, email: 'admin@freedmai.com', password: '$2a$10$hash', role: 'admin' },
  { id: 2, email: 'user@freedmai.com', password: '$2a$10$hash', role: 'user' }
];

// Login endpoint
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // In production, use bcrypt.compare
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    logger.info(`User login: ${email}`);
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify token endpoint
app.post('/verify', (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.status(401).json({ valid: false, error: 'Invalid token' });
  }
});

// Logout endpoint
app.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

app.listen(PORT, () => {
  logger.info(`Auth service running on port ${PORT}`);
});

module.exports = app;
