const smsService = require('../services/smsService');

class SMSController {
  
  // Send SMS
  async sendSMS(req, res) {
    try {
      const { mobile_number, message, template_type, variables } = req.body;
      
      // Validate required fields
      if (!mobile_number || (!message && !template_type)) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Mobile number and (message or template_type) are required',
          code: 'REQUIRED_FIELDS_MISSING',
          timestamp: new Date().toISOString()
        });
      }
      
      // Validate mobile number format
      const mobileRegex = /^\+91[6-9]\d{9}$/;
      if (!mobileRegex.test(mobile_number)) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid mobile number format. Use +91XXXXXXXXXX',
          code: 'MOBILE_INVALID_FORMAT',
          timestamp: new Date().toISOString()
        });
      }
      
      let smsResult;
      
      if (template_type) {
        // Send using template
        smsResult = await smsService.sendTemplatedSMS(mobile_number, template_type, variables || {});
      } else {
        // Send direct message
        smsResult = await smsService.sendDirectSMS(mobile_number, message);
      }
      
      if (!smsResult.success) {
        return res.status(500).json({
          success: false,
          error: 'SMS_SEND_FAILED',
          message: smsResult.message,
          code: 'SMS_DELIVERY_FAILED',
          timestamp: new Date().toISOString()
        });
      }
      
      res.status(200).json({
        success: true,
        data: {
          message_id: smsResult.message_id,
          status: 'sent',
          mobile_number: mobile_number
        },
        message: 'SMS sent successfully',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Send SMS Error:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to send SMS',
        code: 'SMS_SERVICE_ERROR',
        timestamp: new Date().toISOString()
      });
    }
  }
}

module.exports = new SMSController();
