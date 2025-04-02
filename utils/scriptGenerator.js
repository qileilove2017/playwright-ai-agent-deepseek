const { OpenAI } = require('openai');
require('dotenv').config();

// 初始化AI客户端
const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: process.env.DEEPSEEK_API_KEY,
});

/**
 * 通用脚本生成器 - 以JSON格式返回Playwright脚本
 * @param {Object} options 生成选项
 * @param {string} options.url 目标网页URL
 * @param {string} options.userPrompt 用户需求描述
 * @param {Object} options.pageAnalysis 页面分析结果
 * @param {string} options.scriptType 脚本类型 (playwright, puppeteer, selenium)
 * @returns {Promise<Object>} 生成的脚本和元数据
 */
async function generateScript(options) {
  const { url, userPrompt, pageAnalysis, scriptType = 'playwright' } = options;
  
  if (!url || !userPrompt) {
    throw new Error('URL和用户需求描述是必需的');
  }

  // 构建系统提示，要求返回JSON格式
  const systemPrompt = getSystemPrompt(scriptType);
  
  // 构建用户提示
  const userMessage = buildUserPrompt(url, userPrompt, pageAnalysis, scriptType);

  try {
    // 调用AI生成脚本
    const completion = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 3000
    });

    // 提取响应内容
    const responseContent = completion.choices[0].message.content;
    
    try {
      // 尝试提取JSON部分
      let jsonContent = responseContent;
      
      // 处理可能被包裹在```json和```之间的情况
      const jsonMatch = responseContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1].trim();
      }
      
      // 尝试解析JSON
      const scriptData = JSON.parse(jsonContent);
      
      // 确保返回的JSON包含所需字段
      if (!scriptData.script) {
        throw new Error("返回的JSON缺少'script'字段");
      }
      
      return {
        success: true,
        data: {
          script: scriptData.script,
          metadata: scriptData.metadata || {},
          description: scriptData.description || ''
        }
      };
    } catch (parseError) {
      console.warn("JSON解析失败，尝试提取脚本内容", parseError);
      
      // 如果JSON解析失败，尝试直接处理响应内容
      const extractedScript = extractScriptFromText(responseContent, url);
      return {
        success: true,
        data: {
          script: extractedScript,
          metadata: { 
            parseWarning: "JSON解析失败，使用备选提取方法",
            generatedAt: new Date().toISOString()
          }
        }
      };
    }
  } catch (error) {
    console.error("脚本生成错误:", error);
    throw new Error(`脚本生成失败: ${error.message}`);
  }
}

/**
 * 获取要求JSON输出的系统提示模板
 * @param {string} scriptType 脚本类型
 * @returns {string} 系统提示
 */
function getSystemPrompt(scriptType) {
  return `你是一个专业的自动化测试代码生成API。你需要根据用户的需求和页面分析结果，生成一个能够执行用户要求操作的${scriptType}脚本。

你的回复必须是一个有效的JSON对象，格式如下：
{
  "script": "生成的脚本代码，仅包含可执行代码，不含其他标记",
  "metadata": {
    "targetSelector": "主要操作的目标元素选择器",
    "estimatedSteps": 操作步骤数量,
    "scriptType": "${scriptType}"
  },
  "description": "一句话描述脚本的功能"
}

脚本内容必须满足：
1. 不包含任何函数定义或包装代码，直接从页面导航开始
2. 包含页面导航、必要的等待、用户操作步骤、截图和结果验证函数
3. 验证函数应命名为checkResult并返回布尔值
4. 不包含任何标记或其他markdown格式`;
}

/**
 * 构建用户提示
 * @param {string} url 目标URL
 * @param {string} userPrompt 用户需求描述
 * @param {Object} pageAnalysis 页面分析结果
 * @param {string} scriptType 脚本类型
 * @returns {string} 完整的用户提示
 */
function buildUserPrompt(url, userPrompt, pageAnalysis, scriptType) {
  let elementsInfo = '';
  
  if (pageAnalysis && pageAnalysis.interactiveElements) {
    elementsInfo = JSON.stringify(pageAnalysis.interactiveElements, null, 2);
  }
  
  return `请为以下网页和需求生成${scriptType}脚本：

目标网页: ${url}
网页标题: ${pageAnalysis?.title || '未知'}

用户需求:
${userPrompt}

可交互元素:
${elementsInfo || '未提供页面分析数据'}

你必须以JSON格式返回脚本，例如：
{
  "script": "await page.goto('https://example.com');\nawait page.fill('#username', 'test');\n// 更多操作...\nawait page.screenshot({ path: 'screenshots/result.png' });\ncheckResult = async (page) => {\n  return true;\n};",
  "metadata": { 
    "targetSelector": "#username", 
    "estimatedSteps": 5,
    "scriptType": "${scriptType}"
  },
  "description": "登录并验证账户信息"
}

仅返回JSON对象，不要添加任何解释或其他文本。`;
}

/**
 * 从文本中提取脚本内容（备选方法）
 * @param {string} text 响应文本
 * @param {string} url 目标URL，用于备选脚本生成
 * @returns {string} 提取的脚本
 */
function extractScriptFromText(text, url) {
  if (!text) return createDefaultScript(url);
  
  // 尝试从代码块中提取
  const codeBlockMatch = text.match(/```(?:javascript|js)?\s*([\s\S]+?)```/);
  if (codeBlockMatch) return codeBlockMatch[1].trim();
  
  // 尝试查找script字段
  const scriptFieldMatch = text.match(/"script"\s*:\s*"([\s\S]+?)(?:"|$)/);
  if (scriptFieldMatch) {
    return scriptFieldMatch[1]
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  }
  
  // 提取任何可能看起来像脚本的内容
  const awaitMatches = text.match(/await page\.[^\n;]+;/g);
  if (awaitMatches && awaitMatches.length > 2) {
    return awaitMatches.join('\n');
  }
  
  // 如果都失败，返回默认脚本
  return createDefaultScript(url);
}

/**
 * 创建默认脚本
 * @param {string} url 目标URL
 * @returns {string} 默认脚本
 */
function createDefaultScript(url) {
  return `// 导航到页面
await page.goto('${url}');

// 等待页面加载
await page.waitForLoadState('networkidle');

// 截图保存
await page.screenshot({ path: 'screenshots/result-${Date.now()}.png' });

// 验证函数
checkResult = async (page) => {
  const title = await page.title();
  return true;
};`;
}

module.exports = { generateScript };