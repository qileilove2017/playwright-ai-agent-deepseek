const PlaywrightAgent = require('../services/PlaywrightAgent');
const { validationResult } = require('express-validator');
const { generateAutomationCode } = require('../utils/scriptTestCase');
const TestCase = require('../models/TestCase');

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
        } catch (error) {
            // 更详细的错误信息
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to generate script'
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

async function generateAutomationCodeController(req, res, next) {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { testCaseId, codeType } = req.body;

        if (!testCaseId || !codeType) {
            return res.status(400).json({
                success: false,
                error: 'testCaseId and codeType are required'
            });
        }

        const testCase = await TestCase.findByPk(testCaseId);
        if (!testCase) {
            return res.status(404).json({
                success: false,
                error: 'Test Case not found'
            });
        }

        if (!testCase.generatedCode) {
            return res.status(400).json({
                success: false,
                error: 'No generated test case content available to generate automation code from.'
            });
        }

        let updateField = '';

        // Determine language and framework from codeType
        let [framework, language] = codeType.split('-');
        if (language === 'Js') language = 'JavaScript';
        if (language === 'Py') language = 'Python';
        if (language === 'Java') language = 'Java';

        // Determine the field to update
        switch (codeType) {
            case 'Playwright-Js':
                updateField = 'playwrightJsCode';
                break;
            case 'Playwright-Py':
                updateField = 'playwrightPyCode';
                break;
            case 'WebDriver-Java':
                updateField = 'webDriverJavaCode';
                break;
            case 'WebDriver-Py':
                updateField = 'webDriverPyCode';
                break;
            default:
                return res.status(400).json({
                    success: false,
                    error: 'Invalid codeType provided'
                });
        }

        // Check if automation code already exists in the database
        // IMPORTANT: Ensure that if testCase[updateField] is true, it's treated as an empty string
        let existingCode = testCase[updateField];
        // Treat 'true' string or boolean true as empty string
        if ((typeof existingCode === 'boolean' && existingCode === true) || (typeof existingCode === 'string' && existingCode.toLowerCase() === 'true')) {
            existingCode = ''; // Treat true (boolean or string) as empty string
        }

        // If existingCode is not empty (and not true) and not just whitespace
        if (existingCode && existingCode.trim()) {
            return res.json({
                success: true,
                data: { [updateField]: existingCode }
            });
        }

        // If code does not exist, generate it
        let generatedAutomationCode = await generateAutomationCode(testCase.generatedCode, language, framework);

        // Ensure generatedAutomationCode is a string before saving
        if (typeof generatedAutomationCode !== 'string') {
            generatedAutomationCode = String(generatedAutomationCode); // Convert to string
        }

        // Save the generated code to the database
        testCase[updateField] = generatedAutomationCode;
        await testCase.save();

        res.json({
            success: true,
            data: { [updateField]: generatedAutomationCode }
        });

    } catch (error) {
        next(error);
    }
}

module.exports = {
    generateScript,
    executeScripts,
    generateAutomationCodeController
};
