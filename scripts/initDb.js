const sequelize = require('../models/mysql');
const Script = require('../models/Script');

async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    console.log('MySQL连接成功');

    // 同步表结构
    await sequelize.sync({ force: true });
    console.log('表结构同步成功');

    // 插入测试数据
    await Script.create({
      script: 'await page.goto("https://www.example.com");',
      description: '测试脚本',
      testCase: '访问示例网站',
      metadata: { type: 'test' }
    });
    console.log('测试数据添加成功');

    console.log('数据库初始化完成！');
  } catch (error) {
    console.error('数据库初始化失败:', error);
  } finally {
    await sequelize.close();
  }
}

initializeDatabase();