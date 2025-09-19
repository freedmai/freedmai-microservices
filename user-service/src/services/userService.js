const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

class UserService {
  
  constructor() {
    this.OTP_SERVICE_URL = process.env.OTP_SERVICE_URL || 'http://localhost:3007';
    this.userStorage = new Map(); // Temporary storage (will be replaced with RDS)
  }
  
  // Generate JWT token (placeholder)
  generateAuthToken(userId) {
    // This will be replaced with proper JWT implementation
    return `jwt_token_${userId}_${Date.now()}`;
  }
  
  // Verify mobile OTP and create user
  async verifyMobileAndCreateUser(mobileNumber, otpCode, verificationId, userData = {}) {
    try {
      // Verify OTP via OTP service
      const otpResponse = await axios.post(`${this.OTP_SERVICE_URL}/otp/verify`, {
        identifier: mobileNumber,
        otp_code: otpCode,
        verification_id: verificationId
      });
      
      if (!otpResponse.data.success) {
        return {
          success: false,
          message: otpResponse.data.message,
          code: otpResponse.data.code
        };
      }
      
      // OTP verified, now create user
      const userId = await this.createUser(mobileNumber, userData);
      const authToken = this.generateAuthToken(userId);
      
      return {
        success: true,
        user_id: userId,
        auth_token: authToken
      };
      
    } catch (error) {
      console.error('Verify Mobile and Create User Error:', error);
      
      // Handle OTP service errors
      if (error.response && error.response.data) {
        return {
          success: false,
          message: error.response.data.message,
          code: error.response.data.code
        };
      }
      
      throw new Error('Failed to verify mobile and create user');
    }
  }
  
  // Create new user
  async createUser(mobileNumber, userData = {}) {
    // Check if user already exists
    for (const [userId, existingUser] of this.userStorage.entries()) {
      if (existingUser.mobile_number === mobileNumber) {
        return userId; // Return existing user ID
      }
    }
    
    // Create new user
    const userId = uuidv4();
    const newUser = {
      id: userId,
      mobile_number: mobileNumber,
      mobile_verified: true,
      email: userData.email || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      password: userData.password || null, // Will be hashed in production
      created_at: new Date(),
      updated_at: new Date()
    };
    
    this.userStorage.set(userId, newUser);
    
    console.log(`👤 User Created: ${userId} for mobile: ${mobileNumber}`);
    
    return userId;
  }
  
  // Login user
  async loginUser(mobileNumber, password) {
    try {
      // Find user by mobile number
      const user = await this.getUserByMobile(mobileNumber);
      
      if (!user) {
        return {
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        };
      }
      
      // TODO: Implement proper password hashing and verification
      if (user.password !== password) {
        return {
          success: false,
          message: 'Invalid password',
          code: 'INVALID_PASSWORD'
        };
      }
      
      const authToken = this.generateAuthToken(user.id);
      
      return {
        success: true,
        user_id: user.id,
        auth_token: authToken,
        user: {
          id: user.id,
          mobile_number: user.mobile_number,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          mobile_verified: user.mobile_verified
        }
      };
      
    } catch (error) {
      console.error('Login User Error:', error);
      throw new Error('Failed to login user');
    }
  }
  
  // Get user by ID
  async getUserById(userId) {
    const user = this.userStorage.get(userId);
    if (!user) return null;
    
    // Return user without sensitive data
    return {
      id: user.id,
      mobile_number: user.mobile_number,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      mobile_verified: user.mobile_verified,
      created_at: user.created_at,
      updated_at: user.updated_at
    };
  }
  
  // Get user by mobile number
  async getUserByMobile(mobileNumber) {
    for (const [userId, userData] of this.userStorage.entries()) {
      if (userData.mobile_number === mobileNumber) {
        return userData;
      }
    }
    return null;
  }
  
  // Update user profile
  async updateUserProfile(userId, updateData) {
    try {
      const user = this.userStorage.get(userId);
      
      if (!user) {
        return {
          success: false,
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        };
      }
      
      // Update allowed fields
      const allowedFields = ['email', 'firstName', 'lastName'];
      const updatedUser = { ...user };
      
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          updatedUser[field] = updateData[field];
        }
      });
      
      updatedUser.updated_at = new Date();
      this.userStorage.set(userId, updatedUser);
      
      return {
        success: true,
        user: await this.getUserById(userId)
      };
      
    } catch (error) {
      console.error('Update User Profile Error:', error);
      throw new Error('Failed to update user profile');
    }
  }
}

module.exports = new UserService();
