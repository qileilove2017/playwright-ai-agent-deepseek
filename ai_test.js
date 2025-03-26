const express = require('express');
const fs = require('fs');
const path = require('path');
const config = require('./config/config');
const scriptRoutes = require('./routes/scriptRoutes');

const app = express();

// Ensure config values with defaults
const SCREENSHOTS_DIR = config.SCREENSHOTS_DIR || 'screenshots';
const PORT = config.PORT || 3000;

// Middleware
app.use(express.json());
app.use('/screenshots', express.static(path.join(__dirname, SCREENSHOTS_DIR)));

// Create screenshots directory
try {
    const screenshotsDir = path.join(__dirname, SCREENSHOTS_DIR);
    if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
    }
} catch (err) {
    console.error('Failed to create screenshots directory:', err);
    process.exit(1);
}

// Routes
app.use('/api', scriptRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        error: 'Internal Server Error'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});