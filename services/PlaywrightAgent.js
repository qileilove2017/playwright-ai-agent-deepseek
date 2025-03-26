const { chromium } = require('playwright');
const vm = require('vm');
const path = require('path');
const { generateAIResponse } = require('../utils/aiHelper');
const config = require('../config/config');

const HeadLess = config.headless || false;

class PlaywrightAgent {
    constructor() {
        this.browser = null;
        this.context = null;
    }

    async generateScript(userPrompt) {
        try {
            const urlMatch = userPrompt.match(/URL[：:]\s*(https?:\/\/[^\s]+)/i);
            const url = urlMatch ? urlMatch[1] : null;
            if (!url) throw new Error('请在输入中提供 URL');

            await this.initialize();
            const pageAnalysis = await this.analyzePage(url);
            
            return await generateAIResponse(userPrompt, pageAnalysis);
        } catch (error) {
            throw new Error(`生成脚本失败: ${error.message}`);
        } finally {
            await this.cleanup();
        }
    }

    async runScripts(scripts, mode = 'sequential') {
        try {
            this.browser = await chromium.launch({ headless: HeadLess });
            this.context = await this.browser.newContext();

            if (mode === 'parallel') {
                return await Promise.all(scripts.map(script => this.executeScript(script)));
            } else {
                const results = [];
                for (const script of scripts) {
                    results.push(await this.executeScript(script));
                }
                return results;
            }
        } catch (error) {
            throw new Error(`Script execution failed: ${error.message}`);
        }
    }

    async executeScript(script) {
        const page = await this.context.newPage();
        try {
            // Create function from script string
            const scriptFn = new Function('page', `return (async () => { ${script} })()`);
            await scriptFn(page);
            
            return {
                executed: true,
                validated: true,
                message: 'Script executed successfully'
            };
        } catch (error) {
            return {
                executed: false,
                validated: false,
                error: error.message
            };
        } finally {
            await page.close();
        }
    }

    async initialize() {
        if (!this.browser) {
            this.browser = await chromium.launch({ headless: HeadLess });
            this.context = await this.browser.newContext();
        }
    }

    async analyzePage(url) {
        try {
            const page = await this.context.newPage();
            await page.goto(url);

            const analysis = await page.evaluate(() => {
                // Get all interactive elements
                const interactiveElements = [...document.querySelectorAll(
                    'button, input, select, a, [role="button"], [role="link"], data-testid'
                )].map(el => ({
                    tag: el.tagName.toLowerCase(),
                    type: el.type || null,
                    id: el.id || null,
                    text: el.textContent?.trim() || null,
                    placeholder: el.placeholder || null,
                    name: el.name || null,
                    href: el.href || null,
                    value: el.value || null,
                    role: el.getAttribute('role') || null,
                    classes: Array.from(el.classList).join(' '),
                    isVisible: el.offsetParent !== null
                }));

                // Get form information
                const forms = [...document.querySelectorAll('form')].map(form => ({
                    id: form.id || null,
                    action: form.action || null,
                    method: form.method || null,
                    elements: [...form.elements].map(el => ({
                        tag: el.tagName.toLowerCase(),
                        type: el.type || null,
                        name: el.name || null,
                        id: el.id || null
                    }))
                }));

                return {
                    title: document.title,
                    url: window.location.href,
                    interactiveElements,
                    forms,
                    timestamp: new Date().toISOString()
                };
            });

            // Take a screenshot
            const screenshotPath = path.join(__dirname, '..', config.SCREENSHOTS_DIR, `${Date.now()}.png`);
            await page.screenshot({ path: screenshotPath, fullPage: true });
            analysis.screenshotPath = screenshotPath;

            await page.close();
            return analysis;

        } catch (error) {
            throw new Error(`页面分析失败: ${error.message}`);
        }
    }

    async cleanup() {
        try {
            await this.context?.close();
            await this.browser?.close();
        } catch (error) {
            console.error('Cleanup failed:', error);
        }
    }
}

module.exports = PlaywrightAgent;
