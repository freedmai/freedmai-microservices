const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const winston = require('winston');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3004;

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/user.log' })
  ]
});

app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'user-service', timestamp: new Date().toISOString() });
});

// Mock user data
const users = [
  { 
    id: 1, 
    email: 'admin@freedmai.com', 
    name: 'Admin User', 
    role: 'admin',
    profile: { phone: '9876543210', address: 'Mumbai, India' }
  },
  { 
    id: 2, 
    email: 'user@freedmai.com', 
    name: 'Regular User', 
    role: 'user',
    profile: { phone: '9876543211', address: 'Delhi, India' }
  }
];

// Get user profile
app.get('/profile/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const user = users.find(u => u.id == userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    logger.info(`Profile retrieved for user: ${userId}`);
    res.json({ 
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      profile: user.profile
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
app.put('/profile/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const { name, profile } = req.body;
    
    const userIndex = users.findIndex(u => u.id == userId);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (name) users[userIndex].name = name;
    if (profile) users[userIndex].profile = { ...users[userIndex].profile, ...profile };

    logger.info(`Profile updated for user: ${userId}`);
    res.json({ 
      message: 'Profile updated successfully',
      user: {
        id: users[userIndex].id,
        email: users[userIndex].email,
        name: users[userIndex].name,
        profile: users[userIndex].profile
      }
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users (admin only)
app.get('/users', (req, res) => {
  try {
    const userList = users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role
    }));

    logger.info('User list retrieved');
    res.json({ users: userList });
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  logger.info(`User service running on port ${PORT}`);
});

module.exports = app;
