const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const winston = require('winston');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/billing.log' })
  ]
});

app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'billing-service', timestamp: new Date().toISOString() });
});

// Mock billing data
const bills = [
  { id: '1', userId: 1, amount: 150000, status: 'pending', billerId: 'MSEB00000NAT01', consumerNumber: '1234567890' },
  { id: '2', userId: 2, amount: 200000, status: 'paid', billerId: 'BESCOM0000NAT01', consumerNumber: '0987654321' }
];

// Get bills for user
app.get('/bills/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const userBills = bills.filter(bill => bill.userId == userId);
    
    logger.info(`Retrieved bills for user: ${userId}`);
    res.json({ bills: userBills });
  } catch (error) {
    logger.error('Get bills error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Fetch bill details
app.post('/fetch-bill', (req, res) => {
  try {
    const { billerId, consumerNumber } = req.body;
    
    if (!billerId || !consumerNumber) {
      return res.status(400).json({ error: 'Biller ID and consumer number required' });
    }

    // Mock bill fetch
    const billDetails = {
      billId: uuidv4(),
      billerId,
      consumerNumber,
      customerName: 'John Doe',
      billAmount: Math.floor(Math.random() * 500000) + 50000, // Random amount between 500-5500 rupees
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      billDate: new Date().toISOString(),
      status: 'unpaid'
    };

    logger.info(`Bill fetched for ${billerId}:${consumerNumber}`);
    res.json({ success: true, billDetails });
  } catch (error) {
    logger.error('Fetch bill error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Validate bill parameters
app.post('/validate-bill', (req, res) => {
  try {
    const { billerId, consumerNumber } = req.body;
    
    if (!billerId || !consumerNumber) {
      return res.status(400).json({ error: 'Biller ID and consumer number required' });
    }

    // Mock validation
    const isValid = consumerNumber.length >= 8 && consumerNumber.length <= 15;
    
    logger.info(`Bill validation for ${billerId}:${consumerNumber} - ${isValid ? 'valid' : 'invalid'}`);
    res.json({ valid: isValid, message: isValid ? 'Valid parameters' : 'Invalid consumer number format' });
  } catch (error) {
    logger.error('Validate bill error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get supported billers
app.get('/billers', (req, res) => {
  const billers = [
    { id: 'MSEB00000NAT01', name: 'Maharashtra State Electricity Board', code: 'MSEB' },
    { id: 'BESCOM0000NAT01', name: 'Bangalore Electricity Supply Company', code: 'BESCOM' },
    { id: 'TNEB00000NAT01', name: 'Tamil Nadu Electricity Board', code: 'TNEB' },
    { id: 'PSEB00000NAT01', name: 'Punjab State Electricity Board', code: 'PSEB' }
  ];
  
  res.json({ billers });
});

app.listen(PORT, () => {
  logger.info(`Billing service running on port ${PORT}`);
});

module.exports = app;
