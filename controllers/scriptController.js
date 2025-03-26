const PlaywrightAgent = require('../services/PlaywrightAgent');
const { validationResult } = require('express-validator');

/**
 * Generate script based on prompt
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 */
async function generateScript(req, res, next) {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                errors: errors.array() 
            });
        }

        const { prompt } = req.body;
        if (!prompt?.trim()) {
            return res.status(400).json({ 
                success: false, 
                error: 'Prompt is required' 
            });
        }

        const agent = new PlaywrightAgent();
        try {
            const script = await agent.generateScript(prompt);
            res.json({ 
                success: true, 
                data: { script } 
            });
        } finally {
            await agent.cleanup?.(); // Cleanup resources if method exists
        }
    } catch (error) {
        next(error); // Pass to error handling middleware
    }
}

/**
 * Execute one or more scripts
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 */
async function executeScripts(req, res, next) {
    try {
        const { scripts, mode = 'sequential' } = req.body;
        const scriptArray = Array.isArray(scripts) ? scripts : [scripts];
        
        // Validate scripts
        if (!scriptArray.length) {
            return res.status(400).json({
                success: false,
                error: 'At least one script is required'
            });
        }

        if (!scriptArray.every(script => typeof script === 'string' && script.trim())) {
            return res.status(400).json({
                success: false,
                error: 'All scripts must be non-empty strings'
            });
        }

        // Validate mode
        const validModes = ['sequential', 'parallel'];
        if (!validModes.includes(mode)) {
            return res.status(400).json({
                success: false,
                error: `Mode must be one of: ${validModes.join(', ')}`
            });
        }

        const agent = new PlaywrightAgent();
        try {
            const results = await agent.runScripts(scriptArray, mode);
            
            // Process results
            const summary = {
                total: results.length,
                succeeded: results.filter(r => r.executed && r.validated).length,
                failed: results.filter(r => !r.executed || !r.validated).length
            };

            const statusCode = summary.failed === 0 ? 200 : 
                             summary.succeeded > 0 ? 422 : 500;

            res.status(statusCode).json({
                success: statusCode === 200,
                summary,
                results: results.map(r => ({
                    ...r,
                    error: r.error?.message || r.error
                }))
            });
        } finally {
            await agent.cleanup?.();
        }
    } catch (error) {
        next(error);
    }
}

module.exports = {
    generateScript,
    executeScripts
};
