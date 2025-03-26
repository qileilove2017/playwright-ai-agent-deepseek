const express = require('express');
const router = express.Router();
const { generateScript, executeScripts } = require('../controllers/scriptController');

router.post('/generate', generateScript);
router.post('/run', executeScripts);
router.post('/screenshot', async (req, res, next) => {
    try {
        // Basic screenshot endpoint
        res.json({ 
            success: true, 
            message: 'Screenshot endpoint' 
        });
    } catch (error) {
        next(error);
    }
});

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
