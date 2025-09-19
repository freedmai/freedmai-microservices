const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const winston = require('winston');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3005;

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/notification.log' })
  ]
});

app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'notification-service', timestamp: new Date().toISOString() });
});

// Mock notification data
const notifications = [];

// Send notification
app.post('/send', (req, res) => {
  try {
    const { userId, type, message, channel } = req.body;
    
    if (!userId || !type || !message) {
      return res.status(400).json({ error: 'Missing required notification parameters' });
    }

    const notification = {
      id: uuidv4(),
      userId,
      type, // 'payment_success', 'payment_failed', 'bill_reminder', etc.
      message,
      channel: channel || 'email', // email, sms, push
      status: 'sent',
      timestamp: new Date().toISOString()
    };

    notifications.push(notification);
    
    logger.info(`Notification sent: ${notification.id} to user ${userId}`);
    res.json({ 
      success: true,
      notificationId: notification.id,
      message: 'Notification sent successfully'
    });
  } catch (error) {
    logger.error('Send notification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user notifications
app.get('/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const userNotifications = notifications
      .filter(n => n.userId == userId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    logger.info(`Notifications retrieved for user: ${userId}`);
    res.json({ notifications: userNotifications });
  } catch (error) {
    logger.error('Get notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark notification as read
app.put('/read/:notificationId', (req, res) => {
  try {
    const { notificationId } = req.params;
    const notification = notifications.find(n => n.id === notificationId);
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    notification.status = 'read';
    notification.readAt = new Date().toISOString();

    logger.info(`Notification marked as read: ${notificationId}`);
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    logger.error('Mark read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get notification templates
app.get('/templates', (req, res) => {
  const templates = [
    { type: 'payment_success', template: 'Your payment of ₹{amount} for {biller} has been successful. Transaction ID: {transactionId}' },
    { type: 'payment_failed', template: 'Your payment of ₹{amount} for {biller} has failed. Please try again.' },
    { type: 'bill_reminder', template: 'Your {biller} bill of ₹{amount} is due on {dueDate}. Pay now to avoid late fees.' },
    { type: 'account_update', template: 'Your account information has been updated successfully.' }
  ];
  
  res.json({ templates });
});

app.listen(PORT, () => {
  logger.info(`Notification service running on port ${PORT}`);
});

module.exports = app;
