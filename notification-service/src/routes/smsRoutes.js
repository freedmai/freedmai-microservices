const express = require('express');
const smsController = require('../controllers/smsController');

const router = express.Router();

// SMS Routes
router.post('/sms/send', smsController.sendSMS);

module.exports = router;
