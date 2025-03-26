require('dotenv').config();

module.exports = {
    PORT: process.env.PORT || 3030,
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
    OPENAI_BASE_URL: 'https://api.deepseek.com',
    SCREENSHOTS_DIR: 'screenshots',
    headless: process.env.HEADLESS || false
};
