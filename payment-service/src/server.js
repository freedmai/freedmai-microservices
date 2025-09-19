const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const winston = require('winston');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3003;

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/payment.log' })
  ]
});

app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'payment-service', timestamp: new Date().toISOString() });
});

// Mock payment data
const payments = [];

// Process payment
app.post('/process-payment', (req, res) => {
  try {
    const { billerId, consumerNumber, amount, paymentMode, customerInfo } = req.body;
    
    if (!billerId || !consumerNumber || !amount || !paymentMode) {
      return res.status(400).json({ error: 'Missing required payment parameters' });
    }

    // Mock payment processing
    const payment = {
      transactionId: uuidv4(),
      billerId,
      consumerNumber,
      amount,
      paymentMode,
      status: Math.random() > 0.1 ? 'success' : 'failed', // 90% success rate
      timestamp: new Date().toISOString(),
      customerInfo
    };

    payments.push(payment);
    
    logger.info(`Payment processed: ${payment.transactionId} - ${payment.status}`);
    res.json({ 
      success: payment.status === 'success',
      transactionId: payment.transactionId,
      status: payment.status,
      message: payment.status === 'success' ? 'Payment successful' : 'Payment failed'
    });
  } catch (error) {
    logger.error('Process payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check payment status
app.get('/status/:transactionId', (req, res) => {
  try {
    const { transactionId } = req.params;
    const payment = payments.find(p => p.transactionId === transactionId);
    
    if (!payment) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    logger.info(`Payment status checked: ${transactionId}`);
    res.json({ 
      transactionId: payment.transactionId,
      status: payment.status,
      amount: payment.amount,
      timestamp: payment.timestamp
    });
  } catch (error) {
    logger.error('Check status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get payment history
app.get('/history/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    // Mock payment history
    const userPayments = payments.filter(p => p.customerInfo?.userId == userId);
    
    logger.info(`Payment history retrieved for user: ${userId}`);
    res.json({ payments: userPayments });
  } catch (error) {
    logger.error('Get history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get supported payment modes
app.get('/payment-modes', (req, res) => {
  const paymentModes = [
    { code: 'UPI', name: 'UPI Payment', enabled: true },
    { code: 'NEFT', name: 'NEFT Transfer', enabled: true },
    { code: 'IMPS', name: 'IMPS Transfer', enabled: true },
    { code: 'DEBIT_CARD', name: 'Debit Card', enabled: true },
    { code: 'CREDIT_CARD', name: 'Credit Card', enabled: true },
    { code: 'NET_BANKING', name: 'Net Banking', enabled: true }
  ];
  
  res.json({ paymentModes });
});

app.listen(PORT, () => {
  logger.info(`Payment service running on port ${PORT}`);
});

module.exports = app;
