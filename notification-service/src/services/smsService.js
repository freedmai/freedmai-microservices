const { v4: uuidv4 } = require('uuid');
const templateService = require('./templateService');

class SMSService {
  
  constructor() {
    this.templateService = templateService;
  }
  
  // Send direct SMS message
  async sendDirectSMS(mobileNumber, message) {
    try {
      // Validate message length
      if (message.length > 160) {
        throw new Error('SMS message too long (max 160 characters)');
      }
      
      // Send SMS (placeholder - will integrate with actual SMS gateway)
      const messageId = await this.sendToGateway(mobileNumber, message, 'FREEDM');
      
      return {
        success: true,
        message_id: messageId
      };
      
    } catch (error) {
      console.error('Send Direct SMS Error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
  
  // Send templated SMS
  async sendTemplatedSMS(mobileNumber, templateType, variables) {
    try {
      // Get SMS template
      const template = this.templateService.getSMSTemplate(templateType, variables);
      
      // Send SMS using template
      const messageId = await this.sendToGateway(mobileNumber, template.message, template.sender_id);
      
      return {
        success: true,
        message_id: messageId,
        template_used: templateType
      };
      
    } catch (error) {
      console.error('Send Templated SMS Error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
  
  // Send to SMS Gateway (placeholder)
  async sendToGateway(mobileNumber, message, senderId) {
    try {
      // This will be replaced with actual SMS gateway integration
      // Examples: Twilio, AWS SNS, TextLocal, etc.
      
      console.log('📱 SMS Gateway (Mock):');
      console.log(`To: ${mobileNumber}`);
      console.log(`From: ${senderId}`);
      console.log(`Message: ${message}`);
      console.log('Status: Sent');
      
      // Simulate SMS gateway response
      const messageId = `sms_${uuidv4()}`;
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return messageId;
      
    } catch (error) {
      console.error('SMS Gateway Error:', error);
      throw new Error('SMS gateway failed');
    }
  }
  
  // Get SMS delivery status (placeholder)
  async getDeliveryStatus(messageId) {
    // This will query SMS gateway for delivery status
    return {
      message_id: messageId,
      status: 'delivered',
      delivered_at: new Date().toISOString()
    };
  }
}

module.exports = new SMSService();
