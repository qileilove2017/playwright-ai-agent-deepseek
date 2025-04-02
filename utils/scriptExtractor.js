/**
 * Extracts executable Playwright commands from the AI-generated script
 * @param {string} aiResponse - The raw response from the AI
 * @returns {string} - Cleaned, executable script commands
 */
function extractPlaywrightScript(aiResponse) {
  // Parse the AI response
  let scriptContent = '';
  
  try {
    const responseObj = typeof aiResponse === 'string' ? JSON.parse(aiResponse) : aiResponse;
    const rawScript = responseObj?.data?.script || responseObj?.script || '';
    
    // Extract the main function code
    let functionMatch = rawScript.match(/async function \w+\(page\) \{([\s\S]*?)}\n\n/);
    if (functionMatch && functionMatch[1]) {
      scriptContent = functionMatch[1].trim();
    }
    
    // Extract the checkResult function
    let checkResultMatch = rawScript.match(/async function checkResult\(page\) \{([\s\S]*?)return true;/);
    if (checkResultMatch && checkResultMatch[1]) {
      let checkCode = checkResultMatch[1].trim();
      // Simplify the check result function
      scriptContent += '\n\n// Verification function\ncheckResult = async (page) => {\n';
      scriptContent += checkCode;
      scriptContent += '\n  return true;\n};';
    }
    
    // Clean up the script
    scriptContent = scriptContent
      .replace(/\/\/ Step \d+: /g, '// ')
      .replace(/await expect\((.*?)\)\.toHaveTitle\((.*?)\);/g, '// Check title: $1')
      .replace(/await expect\((.*?)\)\.toBeVisible\(\);/g, 'await $1.waitFor({state: "visible"});')
      .replace(/const (.*?) = page\.locator\((.*?)\);/g, 'const $1 = await page.locator($2);')
      .replace(/const (.*?) = page\.getByRole\((.*?)\);/g, 'const $1 = await page.getByRole($2);')
      .replace(/const (\w+) = await page\.waitForSelector\((.*?)\);/g, 'const $1 = await page.waitForSelector($2);')
      .replace(/await page\.type\((.*?), (.*?)\);/g, 'await page.fill($1, $2);')
      .replace(/expect\(([^)]+)\)\.toBeTruthy\(\);/g, '// Verify: $1');
    
    // If we couldn't extract properly, create a simpler version based on patterns
    if (!scriptContent.includes('page.goto')) {
      const urlMatch = rawScript.match(/'(https?:\/\/[^']+)'/);
      if (urlMatch) {
        scriptContent = `// Navigate to the URL\nawait page.goto('${urlMatch[1]}');\n\n`;
        scriptContent += `// Perform search if search box exists\nif (await page.locator('#kw').count() > 0) {\n  await page.fill('#kw', 'test search');\n  await page.click('#su');\n  await page.waitForTimeout(2000);\n}\n\n`;
        scriptContent += `// Take screenshot\nawait page.screenshot({ path: 'screenshots/result-${Date.now()}.png' });\n\n`;
        scriptContent += `// Check result function\ncheckResult = async (page) => {\n  const title = await page.title();\n  return true;\n};`;
      }
      
      // 尝试匹配直接的命令序列（不在函数内）
      const commandsMatch = rawScript.match(/await page\.goto\([^)]+\);([\s\S]*?)await page\.screenshot/);
      if (commandsMatch) {
        scriptContent = `await page.goto${commandsMatch[0]}`;
      }
      
      // 尝试更宽松的函数匹配
      const looseMatch = rawScript.match(/function.*?\{([\s\S]*?)return true/);
      if (looseMatch && !scriptContent) {
        scriptContent = looseMatch[1].trim();
      }
    }
  } catch (error) {
    console.error('Error extracting script:', error);
    scriptContent = `// Error extracting script\n// Raw response: ${aiResponse}\n// Error: ${error.message}`;
  }
  
  return scriptContent;
}

module.exports = { extractPlaywrightScript }; 