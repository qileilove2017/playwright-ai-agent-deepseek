// require('dotenv').config(); // 直接引入 dotenv 以确保环境变量被加载
// const OpenAI = require('openai');

// let openai = null;

// // 直接从 process.env 获取 API key
// const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

// // 初始化 Deepseek API 客户端
// if (DEEPSEEK_API_KEY) {
//     openai = new OpenAI({
//         baseURL: 'https://api.deepseek.com/v1',
//         apiKey: DEEPSEEK_API_KEY,
//     });
// }

// async function generateAIResponse(userPrompt, pageAnalysis) {
//     if (!openai) {
//         throw new Error('未配置 API key，请在 .env 文件中设置 DEEPSEEK_API_KEY');
//     }

//     try {
//         const prompt = `
//             用户需求: ${userPrompt}
//             页面分析结果:
//             - URL: ${pageAnalysis.url}
//             - 检测到的元素: ${JSON.stringify(pageAnalysis.interactiveElements, null, 2)}
//             - 标题: ${pageAnalysis.title}

//             请生成一个 Playwright 脚本，接受 page 参数，不包含浏览器启动和关闭逻辑。
//             脚本应：
//             1. 使用传入的 page 打开指定 URL
//             2. 执行用户描述的操作（根据需求选择合适的元素）
//             3. 添加适当的等待或验证步骤
//             4. 截图保存为 "screenshots/result-${Date.now()}.png"
//             5. 定义一个 checkResult(page) 函数，返回验证结果（true 或 false）
//         `;

//         const completion = await openai.chat.completions.create({
//             model: 'deepseek-chat',  // 直接使用 Deepseek 的模型名称
//             messages: [
//                 {
//                     role: 'system',
//                     content: '你是一个专业的 Playwright 脚本生成助手，能够根据用户需求和页面分析结果生成通用的自动化测试脚本，并添加验证逻辑。'
//                 },
//                 { role: 'user', content: prompt }
//             ],
//             temperature: 0.7,
//             max_tokens: 2000
//         });

//         return completion.choices[0].message.content.replace(/```javascript|```/g, '').trim();
//     } catch (error) {
//         throw new Error(`AI 脚本生成失败: ${error.message}`);
//     }
// }

// module.exports = {
//     generateAIResponse
// };
