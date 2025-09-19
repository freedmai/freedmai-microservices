const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

class OTPService {
  
  constructor() {
    this.otpStorage = new Map(); // Temporary storage (will be replaced with RDS)
    this.NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3006';
    this.OTP_EXPIRY_MINUTES = 5;
    this.MAX_ATTEMPTS = 3;
    this.RESEND_COOLDOWN = 60; // seconds
  }
  
  // Generate 6-digit OTP
  generateOTPCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
  
  // Generate OTP and send notification
  async generateOTP(identifier, type, userId = null) {
    try {
      // Check rate limiting (basic implementation)
      await this.checkRateLimit(identifier, type);
      
      // Generate OTP and verification ID
      const otpCode = this.generateOTPCode();
      const verificationId = uuidv4();
      const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);
      
      // Store OTP data
      this.otpStorage.set(verificationId, {
        identifier: identifier,
        otp_code: otpCode,
        type: type,
        user_id: userId,
        expires_at: expiresAt,
        verified: false,
        attempts: 0,
        created_at: new Date(),
        last_resent: new Date()
      });
      
      // Send notification
      await this.sendOTPNotification(identifier, type, otpCode);
      
      return {
        verification_id: verificationId,
        expires_at: expiresAt.toISOString()
      };
      
    } catch (error) {
      console.error('Generate OTP Error:', error);
      throw new Error('Failed to generate OTP');
    }
  }
  
  // Verify OTP
  async verifyOTP(identifier, otpCode, verificationId) {
    try {
      // Get OTP data from storage
      const otpData = this.otpStorage.get(verificationId);
      
      if (!otpData) {
        return {
          success: false,
          message: 'Invalid verification ID',
          code: 'VERIFICATION_ID_INVALID'
        };
      }
      
      // Check if OTP expired
      if (new Date() > otpData.expires_at) {
        this.otpStorage.delete(verificationId);
        return {
          success: false,
          message: 'OTP has expired',
          code: 'OTP_EXPIRED'
        };
      }
      
      // Check identifier match
      if (otpData.identifier !== identifier) {
        return {
          success: false,
          message: 'Identifier mismatch',
          code: 'IDENTIFIER_MISMATCH'
        };
      }
      
      // Check attempts limit
      if (otpData.attempts >= this.MAX_ATTEMPTS) {
        this.otpStorage.delete(verificationId);
        return {
          success: false,
          message: 'Maximum OTP attempts exceeded',
          code: 'MAX_ATTEMPTS_EXCEEDED'
        };
      }
      
      // Increment attempts
      otpData.attempts += 1;
      
      // Verify OTP code
      if (otpData.otp_code !== otpCode) {
        this.otpStorage.set(verificationId, otpData);
        return {
          success: false,
          message: 'Invalid OTP code',
          code: 'OTP_INVALID'
        };
      }
      
      // OTP verified successfully
      otpData.verified = true;
      otpData.verified_at = new Date();
      this.otpStorage.set(verificationId, otpData);
      
      return {
        success: true,
        type: otpData.type,
        user_id: otpData.user_id
      };
      
    } catch (error) {
      console.error('Verify OTP Error:', error);
      throw new Error('Failed to verify OTP');
    }
  }
  
  // Resend OTP
  async resendOTP(verificationId) {
    try {
      const otpData = this.otpStorage.get(verificationId);
      
      if (!otpData) {
        return {
          success: false,
          message: 'Invalid verification ID',
          code: 'VERIFICATION_ID_INVALID'
        };
      }
      
      // Check if already verified
      if (otpData.verified) {
        return {
          success: false,
          message: 'OTP already verified',
          code: 'OTP_ALREADY_VERIFIED'
        };
      }
      
      // Check resend cooldown
      const timeSinceLastResend = (new Date() - otpData.last_resent) / 1000;
      if (timeSinceLastResend < this.RESEND_COOLDOWN) {
        return {
          success: false,
          message: `Please wait ${Math.ceil(this.RESEND_COOLDOWN - timeSinceLastResend)} seconds before resending`,
          code: 'RESEND_COOLDOWN_ACTIVE'
        };
      }
      
      // Generate new OTP
      const newOtpCode = this.generateOTPCode();
      const newExpiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);
      
      // Update OTP data
      otpData.otp_code = newOtpCode;
      otpData.expires_at = newExpiresAt;
      otpData.attempts = 0; // Reset attempts
      otpData.last_resent = new Date();
      
      this.otpStorage.set(verificationId, otpData);
      
      // Send notification
      await this.sendOTPNotification(otpData.identifier, otpData.type, newOtpCode);
      
      return {
        success: true,
        expires_at: newExpiresAt.toISOString()
      };
      
    } catch (error) {
      console.error('Resend OTP Error:', error);
      throw new Error('Failed to resend OTP');
    }
  }
  
  // Get OTP Status
  async getOTPStatus(verificationId) {
    try {
      const otpData = this.otpStorage.get(verificationId);
      
      if (!otpData) {
        return {
          success: false,
          message: 'Invalid verification ID'
        };
      }
      
      return {
        success: true,
        data: {
          verification_id: verificationId,
          type: otpData.type,
          identifier: otpData.identifier,
          verified: otpData.verified,
          attempts: otpData.attempts,
          max_attempts: this.MAX_ATTEMPTS,
          expires_at: otpData.expires_at.toISOString(),
          expired: new Date() > otpData.expires_at,
          created_at: otpData.created_at.toISOString()
        }
      };
      
    } catch (error) {
      console.error('Get OTP Status Error:', error);
      throw new Error('Failed to get OTP status');
    }
  }
  
  // Send OTP notification
  async sendOTPNotification(identifier, type, otpCode) {
    try {
      let templateType;
      let variables = {
        OTP_CODE: otpCode,
        EXPIRY_MINUTES: this.OTP_EXPIRY_MINUTES.toString()
      };
      
      // Map OTP type to notification template
      switch (type) {
        case 'mobile_verification':
          templateType = 'mobile_verification';
          break;
        case 'email_verification':
          templateType = 'email_verification';
          break;
        case 'password_reset':
          templateType = 'password_reset';
          break;
        default:
          templateType = 'mobile_verification';
      }
      
      // Send via notification service
      const response = await axios.post(`${this.NOTIFICATION_SERVICE_URL}/notifications/sms/send`, {
        mobile_number: identifier,
        template_type: templateType,
        variables: variables
      });
      
      return response.data;
      
    } catch (error) {
      console.error('Send OTP Notification Error:', error);
      throw new Error('Failed to send OTP notification');
    }
  }
  
  // Basic rate limiting check
  async checkRateLimit(identifier, type) {
    // This is a basic implementation
    // In production, use Redis or database for proper rate limiting
    const rateLimitKey = `${identifier}_${type}`;
    // Implementation would check recent OTP requests
    return true;
  }
  
  // Cleanup expired OTPs (utility method)
  cleanupExpiredOTPs() {
    const now = new Date();
    for (const [verificationId, otpData] of this.otpStorage.entries()) {
      if (now > otpData.expires_at) {
        this.otpStorage.delete(verificationId);
      }
    }
  }
}

module.exports = new OTPService();
