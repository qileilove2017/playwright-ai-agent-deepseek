const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authMiddleware } = require('../middlewares/authMiddleware');
const testCaseController = require('../controllers/testCaseController');

// 配置文件上传
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads/'));
    },
    filename: function (req, file, cb) {
        cb(null, `testcase-import-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 限制10MB
    fileFilter: function(req, file, cb) {
        const allowedExtensions = ['.json', '.csv', '.xlsx', '.xml'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (!allowedExtensions.includes(ext)) {
            return cb(new Error('只允许上传JSON、CSV、Excel或XML文件'));
        }
        cb(null, true);
    }
});

// 路由
// 获取所有测试用例
router.get('/test-cases', authMiddleware, testCaseController.getAllTestCases);

// 获取单个测试用例
router.get('/test-cases/:id', authMiddleware, testCaseController.getTestCase);

// 创建测试用例
router.post('/test-cases', authMiddleware, testCaseController.createTestCase);

// 更新测试用例
router.put('/test-cases/:id', authMiddleware, testCaseController.updateTestCase);

// 删除测试用例
router.delete('/test-cases/:id', authMiddleware, testCaseController.deleteTestCase);

// 批量操作测试用例
router.post('/test-cases/bulk', authMiddleware, testCaseController.bulkOperateTestCases);

// 导入测试用例
router.post(
    '/test-cases/import', 
    authMiddleware, 
    upload.single('file'),
    testCaseController.importTestCases
);

// 导出测试用例
router.get('/test-cases/export', authMiddleware, testCaseController.exportTestCases);

module.exports = router; 