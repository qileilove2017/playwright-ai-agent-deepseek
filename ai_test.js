const express = require('express');
const { chromium } = require('playwright');
const fs = require('fs');
const vm = require('vm');
const OpenAI = require('openai');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3030;

const DEEPSEEK_API_KEY = '你的DeepSeek API密钥';

const openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: DEEPSEEK_API_KEY
});

app.use(express.json());
app.use('/screenshots', express.static(path.join(__dirname, 'screenshots')));

class PlaywrightAgent {
    constructor() {
        this.browser = null;
        this.context = null;
        this.page = null;
    }

    async initialize() {
        this.browser = await chromium.launch({ headless: false });
        this.context = await this.browser.newContext();
        this.page = await this.context.newPage();
    }

    async analyzePage(url) {
        try {
            await this.page.goto(url, { waitUntil: 'domcontentloaded' });
            const pageContent = await this.page.content();

            const elements = {
                inputs: await this.page.$$eval('input, textarea', els => els.map(el => ({
                    type: el.type || 'text',
                    id: el.id || '',
                    name: el.name || '',
                    placeholder: el.placeholder || '',
                    selector: el.id ? `#${el.id}` : el.name ? `[name="${el.name}"]` : el.type ? `input[type="${el.type}"]` : 'input'
                }))),
                buttons: await this.page.$$eval('button, input[type="submit"], input[type="button"]', els => els.map(el => ({
                    id: el.id || '',
                    text: el.textContent.trim() || el.value || '',
                    selector: el.id ? `#${el.id}` : el.textContent ? `button:text("${el.textContent.trim()}")` : 'button'
                }))),
                links: await this.page.$$eval('a', els => els.map(el => ({
                    id: el.id || '',
                    text: el.textContent.trim() || '',
                    href: el.href || '',
                    selector: el.id ? `#${el.id}` : el.textContent ? `a:text("${el.textContent.trim()}")` : 'a'
                })))
            };

            return {
                url,
                elements,
                pageSnippet: pageContent.substring(0, 1000)
            };
        } catch (error) {
            throw new Error(`页面分析失败: ${error.message}`);
        }
    }

    async generateScript(userPrompt) {
        try {
            const urlMatch = userPrompt.match(/URL[：:]\s*(https?:\/\/[^\s]+)/i);
            const url = urlMatch ? urlMatch[1] : null;
            if (!url) throw new Error('请在输入中提供 URL');

            await this.initialize();
            const pageAnalysis = await this.analyzePage(url);

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
                注意：选择最合适的元素 selector，确保脚本可运行。
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

            const generatedCode = completion.choices[0].message.content;
            return this.cleanCode(generatedCode);
        } catch (error) {
            throw new Error(`生成脚本失败: ${error.message}`);
        } finally {
            await this.cleanup();
        }
    }

    cleanCode(rawCode) {
        return rawCode.replace(/```javascript|```/g, '').trim();
    }

    async runSingleScript(script) {
        try {
            await this.initialize();
            const scriptCode = `
                async function runScript(browser, page) {
                    ${script}
                    return checkResult; // 返回 checkResult 函数
                }
                runScript;
            `;
            const sandbox = {
                require: require,
                console: console,
                process: process,
                Buffer: Buffer,
                setTimeout: setTimeout,
                clearTimeout: clearTimeout,
                browser: this.browser,
                page: this.page
            };
            const scriptObj = new vm.Script(scriptCode);
            const context = vm.createContext(sandbox);

            const runFunction = await scriptObj.runInContext(context);
            const checkResult = await runFunction(this.browser, this.page);

            const isValid = checkResult ? await checkResult(this.page) : true;

            const screenshotMatch = script.match(/screenshots\/result-\d+\.png/);
            const screenshotPath = screenshotMatch ? screenshotMatch[0] : null;

            return {
                executed: true,
                validated: isValid,
                screenshot: screenshotPath ? `/screenshots/${path.basename(screenshotPath)}` : null
            };
        } catch (error) {
            return {
                executed: false,
                validated: false,
                error: error.message,
                screenshot: null
            };
        } finally {
            await this.cleanup();
        }
    }

    async runScripts(scripts, mode = 'sequential') {
        const results = [];

        if (mode === 'parallel') {
            // 并发执行
            const promises = scripts.map(script => {
                const agent = new PlaywrightAgent();
                return agent.runSingleScript(script);
            });
            results.push(...await Promise.all(promises));
        } else {
            // 顺序执行
            for (const script of scripts) {
                const agent = new PlaywrightAgent();
                const result = await agent.runSingleScript(script);
                results.push(result);
            }
        }

        return results;
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

// 创建 screenshots 目录
const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
}

// API 端点 1: 生成脚本
app.post('/generate', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: '请提供有效的 prompt' });
    }

    const agent = new PlaywrightAgent();
    try {
        const script = await agent.generateScript(prompt);
        res.json({
            success: true,
            script
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// API 端点 2: 执行脚本
app.post('/run', async (req, res) => {
    const { scripts, mode } = req.body;

    // 兼容单脚本（向后兼容）
    const scriptArray = Array.isArray(scripts) ? scripts : [scripts];
    if (!scriptArray.length || !scriptArray.every(s => typeof s === 'string')) {
        return res.status(400).json({ error: '请提供有效的 scripts 数组或单个 script' });
    }

    const validModes = ['sequential', 'parallel'];
    const executionMode = validModes.includes(mode) ? mode : 'sequential';

    const agent = new PlaywrightAgent();
    try {
        const results = await agent.runScripts(scriptArray, executionMode);
        const allExecuted = results.every(r => r.executed);
        const allValidated = results.every(r => r.validated);

        if (allExecuted && allValidated) {
            res.status(200).json({
                success: true,
                message: '所有脚本执行成功且验证通过',
                results
            });
        } else if (allExecuted) {
            res.status(422).json({
                success: false,
                message: '所有脚本执行成功但部分验证未通过',
                results
            });
        } else {
            res.status(500).json({
                success: false,
                message: '部分或所有脚本执行失败',
                results
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 启动服务
app.listen(PORT, () => {
    console.log(`服务运行在 http://localhost:${PORT}`);
});