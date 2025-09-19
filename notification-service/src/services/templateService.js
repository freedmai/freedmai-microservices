class TemplateService {
  
  constructor() {
    // SMS Templates (will be moved to files later)
    this.smsTemplates = {
      mobile_verification: {
        template: 'FreedmAI: Your mobile verification code is {{OTP_CODE}}. Valid for {{EXPIRY_MINUTES}} minutes. Do not share this code with anyone. - FreedmAI Team',
        sender_id: 'FREEDM',
        max_length: 160
      },
      email_verification: {
        template: 'FreedmAI: Your email verification code is {{OTP_CODE}}. Valid for {{EXPIRY_MINUTES}} minutes. Enter this code to verify your email address. - FreedmAI Team',
        sender_id: 'FREEDM',
        max_length: 160
      },
      password_reset: {
        template: 'FreedmAI: Your password reset code is {{OTP_CODE}}. Valid for {{EXPIRY_MINUTES}} minutes. If you didn\'t request this, please ignore. - FreedmAI Team',
        sender_id: 'FREEDM',
        max_length: 160
      }
    };
    
    // OTP Settings
    this.otpSettings = {
      length: 6,
      expiry_minutes: 5,
      max_attempts: 3,
      resend_cooldown: 60
    };
  }
  
  // Get SMS template with variables replaced
  getSMSTemplate(templateType, variables = {}) {
    const templateConfig = this.smsTemplates[templateType];
    
    if (!templateConfig) {
      throw new Error(`SMS template '${templateType}' not found`);
    }
    
    let message = templateConfig.template;
    
    // Replace variables in template
    Object.keys(variables).forEach(key => {
      const placeholder = `{{${key}}}`;
      message = message.replace(new RegExp(placeholder, 'g'), variables[key]);
    });
    
    // Validate message length
    if (message.length > templateConfig.max_length) {
      throw new Error(`SMS message too long: ${message.length} characters (max: ${templateConfig.max_length})`);
    }
    
    return {
      message: message,
      sender_id: templateConfig.sender_id,
      max_length: templateConfig.max_length,
      template_type: templateType
    };
  }
  
  // Get OTP settings
  getOTPSettings() {
    return this.otpSettings;
  }
  
  // Get available SMS templates
  getAvailableTemplates() {
    return Object.keys(this.smsTemplates);
  }
}

module.exports = new TemplateService();
