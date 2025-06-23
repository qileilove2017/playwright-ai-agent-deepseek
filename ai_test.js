const express = require('express');
const fs = require('fs');
const path = require('path');
const config = require('./config/config');
const scriptRoutes = require('./routes/scriptRoutes');
const projectRoutes = require('./routes/projectRoutes');
const testCaseRoutes = require('./routes/testCaseRoutes');
const generateRoutes = require('./routes/generateRoutes'); // 引入新的生成路由
const cors = require('cors'); // 引入 cors 模块
const sequelize = require('./models/mysql');
const Script = require('./models/Script');
const Project = require('./models/Project');
const TestCase = require('./models/TestCase');

const app = express();

// Ensure config values with defaults
const SCREENSHOTS_DIR = config.SCREENSHOTS_DIR || 'screenshots';
const PORT = config.PORT || 3000;

// Middleware
app.use(express.json());
app.use('/screenshots', express.static(path.join(__dirname, SCREENSHOTS_DIR)));

// 配置 CORS
// 请将 'http://localhost:3001' 替换为你的前端实际运行的地址和端口
app.use(cors({
  origin: 'http://localhost:3001', // 允许前端的源访问
  credentials: true, // 允许发送 cookies 和认证头
}));

// Create screenshots directory
try {
    const screenshotsDir = path.join(__dirname, SCREENSHOTS_DIR);
    if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
    }
} catch (err) {
    console.error('Failed to create screenshots directory:', err);
    process.exit(1);
}

// Routes
app.use('/api', scriptRoutes);
app.use('/api', projectRoutes);
app.use('/api', testCaseRoutes);
app.use('/api', generateRoutes); // 添加新的生成路由

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        error: 'Internal Server Error'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

// 启动时自动同步表结构
// 确保所有模型都在这里被引入，以便 sequelize.sync() 能够识别它们并创建表和关联
sequelize.sync().then(() => {
    console.log('数据库表结构已同步');
}).catch(err => {
    console.error('数据库表结构同步失败:', err);
    process.exit(1);
});