const mysql = require('mysql2/promise');
require('dotenv').config();

class Database {
  constructor() {
    this.connection = null;
    this.config = {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME,
      connectTimeout: 20000,
      acquireTimeout: 20000,
      timeout: 20000,
      reconnect: true
    };
  }

  async connect() {
    try {
      console.log('🔍 Attempting database connection...');
      console.log(`Host: ${this.config.host}`);
      console.log(`Database: ${this.config.database}`);
      console.log(`User: ${this.config.user}`);
      
      this.connection = await mysql.createConnection(this.config);
      
      console.log('✅ Database connected successfully!');
      
      // Test the connection
      const [rows] = await this.connection.execute('SELECT 1 as test');
      console.log('✅ Database test query successful');
      
      return this.connection;
      
    } catch (error) {
      console.error('❌ Database connection failed:');
      console.error('Error Code:', error.code);
      console.error('Error Message:', error.message);
      
      if (error.code === 'ETIMEDOUT') {
        console.error('💡 Network timeout - check security groups and network connectivity');
      } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
        console.error('💡 Access denied - check username/password');
      } else if (error.code === 'ENOTFOUND') {
        console.error('💡 Host not found - check database endpoint');
      }
      
      throw error;
    }
  }

  async disconnect() {
    if (this.connection) {
      await this.connection.end();
      console.log('✅ Database disconnected');
    }
  }

  getConnection() {
    return this.connection;
  }
}

module.exports = new Database();
