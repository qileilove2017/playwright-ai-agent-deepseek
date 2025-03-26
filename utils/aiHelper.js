const OpenAI = require('openai');
const config = require('../config/config');

const openai = new OpenAI({
    baseURL: config.OPENAI_BASE_URL,
    apiKey: config.DEEPSEEK_API_KEY
});

async function generateAIResponse(userPrompt, pageAnalysis) {
    const prompt = `
        用户需求: ${userPrompt}
        页面分析结果:
        - URL: ${pageAnalysis.url}
        - 检测到的元素: ${JSON.stringify(pageAnalysis.elements, null, 2)}
        - 页面片段: ${pageAnalysis.pageSnippet}

        请生成一个 Playwright 脚本，接受 browser 和 page 参数，不包含浏览器启动和关闭逻辑。
        脚本应：
        1. 使用传入的 page 打开指定 URL
        2. 执行用户描述的操作（根据需求选择合适的元素）
        3. 添加适当的等待或验证步骤
        4. 截图保存为 "screenshots/result-${Date.now()}.png"
        5. 定义一个 checkResult(page) 函数，返回验证结果（true 或 false）
    `;

    const completion = await openai.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
            {
                role: 'system',
                content: '你是一个专业的 Playwright 脚本生成助手，能够根据用户需求和页面分析结果生成通用的自动化测试脚本，并添加验证逻辑。'
            },
            { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
    });

    return completion.choices[0].message.content.replace(/```javascript|```/g, '').trim();
}

module.exports = {
    generateAIResponse
};
