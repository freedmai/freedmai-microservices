const userService = require('../services/userService');

class UserController {
  
  // Register User (with OTP verification)
  async registerUser(req, res) {
    try {
      const { mobile_number, otp_code, verification_id, email, firstName, lastName } = req.body;
      
      // Validate required fields
      if (!mobile_number || !otp_code || !verification_id) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Mobile number, OTP code, and verification ID are required',
          code: 'REQUIRED_FIELDS_MISSING',
          timestamp: new Date().toISOString()
        });
      }
      
      // Verify OTP and create user
      const result = await userService.verifyMobileAndCreateUser(mobile_number, otp_code, verification_id, {
        email,
        firstName,
        lastName
      });
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: 'USER_REGISTRATION_FAILED',
          message: result.message,
          code: result.code,
          timestamp: new Date().toISOString()
        });
      }
      
      res.status(201).json({
        success: true,
        data: {
          user_id: result.user_id,
          auth_token: result.auth_token,
          mobile_verified: true
        },
        message: 'User registered successfully',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Register User Error:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to register user',
        code: 'USER_REGISTRATION_ERROR',
        timestamp: new Date().toISOString()
      });
    }
  }
  
  // Login User
  async loginUser(req, res) {
    try {
      const { mobile_number, password } = req.body;
      
      // Validate required fields
      if (!mobile_number || !password) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Mobile number and password are required',
          code: 'REQUIRED_FIELDS_MISSING',
          timestamp: new Date().toISOString()
        });
      }
      
      // Login user
      const result = await userService.loginUser(mobile_number, password);
      
      if (!result.success) {
        return res.status(401).json({
          success: false,
          error: 'LOGIN_FAILED',
          message: result.message,
          code: result.code,
          timestamp: new Date().toISOString()
        });
      }
      
      res.status(200).json({
        success: true,
        data: {
          user_id: result.user_id,
          auth_token: result.auth_token,
          user: result.user
        },
        message: 'Login successful',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Login User Error:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to login user',
        code: 'USER_LOGIN_ERROR',
        timestamp: new Date().toISOString()
      });
    }
  }
  
  // Get User Profile
  async getUserProfile(req, res) {
    try {
      // TODO: Extract user_id from JWT token
      const user_id = req.headers['x-user-id']; // Temporary - will be from JWT
      
      if (!user_id) {
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'User ID required',
          code: 'USER_ID_MISSING',
          timestamp: new Date().toISOString()
        });
      }
      
      const user = await userService.getUserById(user_id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'User not found',
          code: 'USER_NOT_FOUND',
          timestamp: new Date().toISOString()
        });
      }
      
      res.status(200).json({
        success: true,
        data: {
          user: user
        },
        message: 'User profile retrieved successfully',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Get User Profile Error:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get user profile',
        code: 'USER_PROFILE_ERROR',
        timestamp: new Date().toISOString()
      });
    }
  }
  
  // Update User Profile
  async updateUserProfile(req, res) {
    try {
      // TODO: Extract user_id from JWT token
      const user_id = req.headers['x-user-id']; // Temporary - will be from JWT
      const updateData = req.body;
      
      if (!user_id) {
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'User ID required',
          code: 'USER_ID_MISSING',
          timestamp: new Date().toISOString()
        });
      }
      
      const result = await userService.updateUserProfile(user_id, updateData);
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: 'USER_UPDATE_FAILED',
          message: result.message,
          code: result.code,
          timestamp: new Date().toISOString()
        });
      }
      
      res.status(200).json({
        success: true,
        data: {
          user: result.user
        },
        message: 'User profile updated successfully',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Update User Profile Error:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update user profile',
        code: 'USER_UPDATE_ERROR',
        timestamp: new Date().toISOString()
      });
    }
  }
}

module.exports = new UserController();
