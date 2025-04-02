const mongoose = require('mongoose');
const ScriptModel = require('../models/scriptModel');
const ExecutionModel = require('../models/executionModel');

// MongoDB 连接配置
const mongoOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4
};

const MONGODB_URI = 'mongodb://127.0.0.1:27017/scriptdb';

async function initializeDatabase() {
    try {
        // 连接数据库
        await mongoose.connect(MONGODB_URI, mongoOptions);
        console.log('MongoDB连接成功');

        // 确保集合存在
        await Promise.all([
            // 创建脚本集合
            mongoose.connection.db.createCollection('scripts'),
            // 创建执行记录集合
            mongoose.connection.db.createCollection('executions')
        ]);

        console.log('数据库集合创建成功');

        // 创建索引
        await Promise.all([
            // 为脚本集合创建索引
            ScriptModel.collection.createIndex({ createdAt: -1 }),
            ScriptModel.collection.createIndex({ description: 'text' }),
            
            // 为执行记录集合创建索引
            ExecutionModel.collection.createIndex({ timestamp: -1 }),
            ExecutionModel.collection.createIndex({ status: 1 })
        ]);

        console.log('索引创建成功');

        // 可以添加一些测试数据
        const testScript = new ScriptModel({
            script: 'await page.goto("https://www.example.com");',
            description: '测试脚本',
            testCase: '访问示例网站',
            metadata: { type: 'test' }
        });

        await testScript.save();
        console.log('测试数据添加成功');

        console.log('数据库初始化完成！');
    } catch (error) {
        console.error('数据库初始化失败:', error);
    } finally {
        // 关闭数据库连接
        await mongoose.connection.close();
    }
}

// 运行初始化
initializeDatabase(); 