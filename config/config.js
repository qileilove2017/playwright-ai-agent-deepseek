require('dotenv').config();

module.exports = {
    PORT: process.env.PORT || 3000,
    OPENROUTER_API_KEY: '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',
    APP_URL: process.env.APP_URL || 'http://localhost:3000',
    SCREENSHOTS_DIR: 'screenshots',
    headless: process.env.HEADLESS === 'true' || process.env.HEADLESS === true
};
