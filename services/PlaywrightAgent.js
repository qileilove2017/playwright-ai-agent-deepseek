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
