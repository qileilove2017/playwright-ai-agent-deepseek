const express = require('express');
const router = express.Router();
const { generateScript } = require('../utils/scriptGenerator');
const { executeScripts } = require('../controllers/scriptController');

// 生成脚本路由
router.post('/generate', async (req, res) => {
    try {
        const { url, userPrompt, pageAnalysis } = req.body;
        
        if (!url || !userPrompt) {
            return res.status(400).json({ 
                success: false, 
                error: '请提供URL和用户需求描述' 
            });
        }
        
        const result = await generateScript({
            url,
            userPrompt,
            pageAnalysis,
            scriptType: 'playwright'
        });
        
        return res.json(result);
    } catch (error) {
        console.error('脚本生成失败:', error);
        return res.status(500).json({
            success: false,
            error: `脚本生成失败: ${error.message}`
        });
    }
});

// 执行脚本路由
router.post('/run', async (req, res, next) => {
    try {
        const { scripts, mode } = req.body;
        
        if (!scripts || !scripts.length) {
            return res.status(400).json({ 
                success: false, 
                error: '请提供脚本内容' 
            });
        }

        // 调用 executeScripts 控制器函数，传入正确的参数
        await executeScripts(req, res, next);
        
    } catch (error) {
        next(error);
    }
});

// 健康检查端点
router.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
