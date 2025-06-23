require('dotenv').config();

module.exports = {
    PORT: process.env.PORT || 3000,
    DEEPSEEEK_BASE_URL: 'https://api.deepseek.com/v1',
    APP_URL: process.env.APP_URL || 'http://localhost:3000',
    SCREENSHOTS_DIR: 'screenshots',
    headless: process.env.HEADLESS === 'true' || process.env.HEADLESS === true,
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-test-platform',
    JWT_SECRET: process.env.JWT_SECRET || 'secret-key-for-jwt-generation',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    MAX_UPLOAD_SIZE: process.env.MAX_UPLOAD_SIZE || 10 * 1024 * 1024, // 10MB
    TEMP_DIR: process.env.TEMP_DIR || 'uploads'
};
