const otpService = require('../services/otpService');

class OTPController {
  
  // Generate OTP
  async generateOTP(req, res) {
    try {
      const { identifier, type, user_id } = req.body;
      
      // Validate required fields
      if (!identifier || !type) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Identifier and type are required',
          code: 'REQUIRED_FIELDS_MISSING',
          timestamp: new Date().toISOString()
        });
      }
      
      // Validate identifier based on type
      if (type === 'mobile_verification') {
        const mobileRegex = /^\+91[6-9]\d{9}$/;
        if (!mobileRegex.test(identifier)) {
          return res.status(400).json({
            success: false,
            error: 'VALIDATION_ERROR',
            message: 'Invalid mobile number format. Use +91XXXXXXXXXX',
            code: 'MOBILE_INVALID_FORMAT',
            timestamp: new Date().toISOString()
          });
        }
      }
      
      // Generate OTP
      const result = await otpService.generateOTP(identifier, type, user_id);
      
      res.status(200).json({
        success: true,
        data: {
          verification_id: result.verification_id,
          expires_at: result.expires_at,
          otp_length: 6,
          retry_after: 60,
          type: type
        },
        message: 'OTP generated and sent successfully',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Generate OTP Error:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to generate OTP',
        code: 'OTP_GENERATION_FAILED',
        timestamp: new Date().toISOString()
      });
    }
  }
  
  // Verify OTP
  async verifyOTP(req, res) {
    try {
      const { identifier, otp_code, verification_id } = req.body;
      
      // Validate required fields
      if (!identifier || !otp_code || !verification_id) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Identifier, OTP code, and verification ID are required',
          code: 'REQUIRED_FIELDS_MISSING',
          timestamp: new Date().toISOString()
        });
      }
      
      // Validate OTP format
      if (!/^\d{6}$/.test(otp_code)) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'OTP must be 6 digits',
          code: 'OTP_INVALID_FORMAT',
          timestamp: new Date().toISOString()
        });
      }
      
      // Verify OTP
      const result = await otpService.verifyOTP(identifier, otp_code, verification_id);
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: 'OTP_VERIFICATION_FAILED',
          message: result.message,
          code: result.code,
          timestamp: new Date().toISOString()
        });
      }
      
      res.status(200).json({
        success: true,
        data: {
          verification_id: verification_id,
          verified: true,
          type: result.type,
          identifier: identifier
        },
        message: 'OTP verified successfully',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Verify OTP Error:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to verify OTP',
        code: 'OTP_VERIFICATION_ERROR',
        timestamp: new Date().toISOString()
      });
    }
  }
  
  // Resend OTP
  async resendOTP(req, res) {
    try {
      const { verification_id } = req.body;
      
      if (!verification_id) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Verification ID is required',
          code: 'VERIFICATION_ID_REQUIRED',
          timestamp: new Date().toISOString()
        });
      }
      
      const result = await otpService.resendOTP(verification_id);
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: 'OTP_RESEND_FAILED',
          message: result.message,
          code: result.code,
          timestamp: new Date().toISOString()
        });
      }
      
      res.status(200).json({
        success: true,
        data: {
          verification_id: verification_id,
          expires_at: result.expires_at,
          retry_after: 60
        },
        message: 'OTP resent successfully',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Resend OTP Error:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to resend OTP',
        code: 'OTP_RESEND_ERROR',
        timestamp: new Date().toISOString()
      });
    }
  }
  
  // Get OTP Status
  async getOTPStatus(req, res) {
    try {
      const { verification_id } = req.params;
      
      const result = await otpService.getOTPStatus(verification_id);
      
      if (!result.success) {
        return res.status(404).json({
          success: false,
          error: 'OTP_NOT_FOUND',
          message: result.message,
          code: 'VERIFICATION_ID_INVALID',
          timestamp: new Date().toISOString()
        });
      }
      
      res.status(200).json({
        success: true,
        data: result.data,
        message: 'OTP status retrieved successfully',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Get OTP Status Error:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get OTP status',
        code: 'OTP_STATUS_ERROR',
        timestamp: new Date().toISOString()
      });
    }
  }
}

module.exports = new OTPController();
