const express = require('express');
const cors = require('cors');
const scriptRoutes = require('./routes/scriptRoutes');

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 路由
app.use('/api/scripts', scriptRoutes);

// 错误处理
app.use((err, req, res, next) => {
    console.error('服务器错误:', err.stack);
    res.status(500).json({
        success: false,
        error: '服务器内部错误: ' + (err.message || '未知错误')
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
});

// 导出应用
module.exports = app;