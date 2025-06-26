const express = require('express');
const router = express.Router();
const { generateTestCaseFromDeepSeek } = require('../utils/scriptTestCase'); // 引入新的工具函数
const { generateAutomationCodeController } = require('../controllers/scriptController');

// 快速生成测试用例
router.post('/generate-test-case-from-prompt', async (req, res) => {
  const { prompt, projectId } = req.body;
  console.log('********************:', process.env.DEEPSEEK_API_KEY); // 调试输出，可以保留或移除

  if (!prompt || !projectId) {
    return res.status(400).json({ error: '提示词和项目ID是必填项' });
  }

  try {
    const newTestCase = await generateTestCaseFromDeepSeek(prompt, projectId);
    res.status(201).json(newTestCase);
  } catch (error) {
    console.error('生成测试用例失败:', error);
    // 根据错误类型返回不同的状态码和信息
    if (error.message === '项目不存在') {
      res.status(404).json({ error: error.message });
    } else if (error.message.includes('AI 生成的测试用例格式不正确')) {
      res.status(500).json({ error: error.message });
    } else if (error.response) { // DeepSeek API 错误
      console.error('DeepSeek API 错误响应:', error.response.status, error.response.data);
      res.status(error.response.status).json({ error: error.response.data.message || 'DeepSeek API 调用失败' });
    } else {
      res.status(500).json({ error: '生成测试用例时发生内部错误' });
    }
  }
});

// 生成自动化代码
router.post('/generate-automation-code', generateAutomationCodeController);

module.exports = router;