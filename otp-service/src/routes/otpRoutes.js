const express = require('express');
const otpController = require('../controllers/otpController');

const router = express.Router();

// Authentication Routes (OTP-based)
router.post('/send-otp', otpController.sendOTP);
router.post('/verify-otp', otpController.verifyOTP);
router.post('/refresh', otpController.refreshToken);
router.post('/logout', otpController.logout);

// Legacy OTP Routes (for backward compatibility)
router.post('/generate', otpController.generateOTP);
router.post('/verify', otpController.verifyOTP);
router.post('/resend', otpController.resendOTP);
router.get('/status/:verification_id', otpController.getOTPStatus);

module.exports = router;
