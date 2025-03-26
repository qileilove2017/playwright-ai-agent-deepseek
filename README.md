# playwright  deep seek aiagent

## 启动服务
```
npm install

npm run dev
```

## 调用api 生成测试脚本

需要填入 deepseek api token
request body: {

    "prompt":"我要测试百度网站的搜索功能，URL：https://www.baidu.com
}

agent 会启动playwright 无头模式获取百度搜索页的page context，获取所有element 然后传入给deepseek 让其自己决定选取哪个element 作为定位


生成成的script 如下：
```
await page.goto('https://www.baidu.com');
         await page.fill('#kw', 'test search 1'); await page.click('#su'); 
         await page.waitForTimeout(2000); await page.screenshot({ path: `screenshots/result-${Date.now()}.png` }); 
         checkResult = async (page) => { const content = await page.textContent('body'); return content.includes('test search 1'); };
```
## 通过调用api 执行生成的脚本如下
```
curl --request POST \
  --url http://localhost:3030/api/run \
  --header 'Content-Type: application/json' \
  --header 'User-Agent: insomnia/11.0.0' \
  --data '{
    "scripts": [
        "await page.goto('\''https://www.baidu.com'\''); await page.fill('\''#kw'\'', '\''test search 1'\''); await page.click('\''#su'\''); await page.waitForTimeout(2000); await page.screenshot({ path: `screenshots/result-${Date.now()}.png` }); checkResult = async (page) => { const content = await page.textContent('\''body'\''); return content.includes('\''test search 1'\''); };",
        "await page.goto('\''https://www.baidu.com'\''); await page.fill('\''#kw'\'', '\''test search 2'\''); await page.click('\''#su'\''); await page.waitForTimeout(2000); await page.screenshot({ path: `screenshots/result-${Date.now()}.png` }); checkResult = async (page) => { const content = await page.textContent('\''body'\''); return content.includes('\''wrong content'\''); };"
    ],
    "mode": "parallel"
}'
```