const OpenAI = require('openai');
const TestCase = require('../models/TestCase');
const Project = require('../models/Project');
const config = require('../config/config');

// 初始化 DeepSeek 客户端
const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: config.DEEPSEEEK_BASE_URL,
});

/**
 * 根据提示词从 DeepSeek API 生成并保存测试用例
 * @param {string} prompt - 用户输入的提示词
 * @param {number} projectId - 所属项目ID
 * @returns {Promise<object>} - 创建的测试用例对象
 */
async function generateTestCaseFromDeepSeek(prompt, projectId) {
  // 检查 projectId 是否存在
  const project = await Project.findByPk(projectId);
  if (!project) {
    throw new Error('项目不存在');
  }

  // 构建给 DeepSeek 的指令
  const systemMessage = `你是一个专业的软件测试工程师，请根据用户提供的需求，生成一个详细的软件测试用例。
  请以严格的JSON格式返回，不要包含任何额外的文本或Markdown语法（如\`\`\`json）。
  JSON结构必须包含以下字段：
  - name: string (测试用例名称)
  - description: string (测试用例详细描述)
  - steps: array (测试步骤数组，每个元素是一个对象)
    - action: string (操作类型，例如 "navigate", "click", "type", "assert", "wait", "select", "custom")
    - target: string (操作目标，例如 CSS 选择器, XPath, URL)
    - value: string (操作值，例如输入文本, 验证文本, 等待时间)
    - description: string (步骤描述)
  - tags: array (字符串数组，例如 ["冒烟测试", "登录功能"])
  - module: string (所属模块，例如 "用户管理", "订单管理")
  - priority: string (优先级，例如 "low", "medium", "high", "critical")
  - status: string (状态，例如 "draft", "active")

  请确保所有字段都符合其类型要求，特别是 steps 数组中的每个对象。
  如果某个字段没有明确的值，请使用空字符串或空数组。`;

  const userMessage = `需求：${prompt}`;

  const chatCompletion = await openai.chat.completions.create({
    model: "deepseek-coder", // 或者其他适合你的模型，例如 "deepseek-chat"
    messages: [
      { role: "system", content: systemMessage },
      { role: "user", content: userMessage }
    ],
    response_format: { type: "json_object" }, // 明确要求 JSON 格式
    temperature: 0.7,
  });

  const generatedContent = chatCompletion.choices[0].message.content;
  let testCaseData;
  try {
    testCaseData = JSON.parse(generatedContent);
  } catch (parseError) {
    console.error('解析 DeepSeek 返回的 JSON 失败:', parseError);
    console.error('DeepSeek 原始返回:', generatedContent);
    throw new Error('AI 生成的测试用例格式不正确，请重试。');
  }

  // 验证并清理数据，确保符合 TestCase 模型的预期
  const newTestCase = await TestCase.create({
    projectId: projectId,
    name: testCaseData.name || '未命名测试用例',
    description: testCaseData.description || '',
    steps: testCaseData.steps || [],
    tags: testCaseData.tags || [],
    module: testCaseData.module || '通用',
    priority: testCaseData.priority || 'medium',
    status: testCaseData.status || 'draft',
    // 其他字段如果需要，也从 testCaseData 中获取
    generatedCode: generatedContent, // 保存原始的生成代码
  });

  return newTestCase;
}

async function generateAutomationCode(testCaseText, language, framework) {
  let systemMessage = '';
  let userMessage = `根据以下测试用例文本，生成${framework} ${language} 自动化代码：\n\n${testCaseText}`;

  switch (`${framework}-${language}`) {
    case 'Playwright-JavaScript':
      systemMessage = `你是一个专业的自动化测试工程师，请根据提供的测试用例文本，生成 Playwright JavaScript 自动化测试代码。
请只返回代码，不要包含任何解释性文字或Markdown语法（如\`\`\`javascript\`\`\`）。
代码应该可以直接运行，并包含必要的导入和设置。`;
      break;
    case 'Playwright-Python':
      systemMessage = `你是一个专业的自动化测试工程师，请根据提供的测试用例文本，生成 Playwright Python 自动化测试代码。
请只返回代码，不要包含任何解释性文字或Markdown语法（如\`\`\`python\`\`\`）。
代码应该可以直接运行，并包含必要的导入和设置。`;
      break;
    case 'WebDriver-Java':
      systemMessage = `你是一个专业的自动化测试工程师，请根据提供的测试用例文本，生成 WebDriver Java 自动化测试代码。
请只返回代码，不要包含任何解释性文字或Markdown语法（如\`\`\`java\`\`\`）。
代码应该可以直接运行，并包含必要的导入和设置。`;
      break;
    case 'WebDriver-Python':
      systemMessage = `你是一个专业的自动化测试工程师，请根据提供的测试用例文本，生成 WebDriver Python 自动化测试代码。
请只返回代码，不要包含任何解释性文字或Markdown语法（如\`\`\`python\`\`\`）。
代码应该可以直接运行，并包含必要的导入和设置。`;
      break;
    default:
      throw new Error('不支持的自动化代码类型');
  }

  const chatCompletion = await openai.chat.completions.create({
    model: "deepseek-coder", // 或者其他适合你的模型
    messages: [
      { role: "system", content: systemMessage },
      { role: "user", content: userMessage }
    ],
    temperature: 0.7,
  });

  return chatCompletion.choices[0].message.content;
}

module.exports = {
  generateTestCaseFromDeepSeek,
  generateAutomationCode,
};