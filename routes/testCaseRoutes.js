const express = require('express');
const router = express.Router();
const { generateAutomationCode, executeAutomationCode } = require('../controllers/testCaseController');
const TestCase = require('../models/TestCase'); // 引入 TestCase 模型
const Project = require('../models/Project'); // 引入 Project 模型 - 修正了路径

// 创建测试用例
router.post('/test-cases', async (req, res) => {
  try {
    const { name, description, projectId, steps, testData, verificationPoints, status } = req.body;

    // 检查 projectId 是否存在
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({ error: '项目不存在' });
    }

    const newTestCase = await TestCase.create({
      name,
      description,
      projectId, // 保存 projectId
      steps,
      testData,
      verificationPoints,
      status
    });
    res.status(201).json(newTestCase);
  } catch (error) {
    console.error('创建测试用例失败:', error);
    res.status(400).json({ error: error.message });
  }
});

// 获取测试用例列表 (可按 projectId 过滤)
router.get('/test-cases', async (req, res) => {
  try {
    const { projectId } = req.query; // 从查询参数获取 projectId
    let whereClause = {};

    if (projectId) {
      whereClause.projectId = projectId;
    }

    const testCases = await TestCase.findAll({
      where: whereClause,
      include: [{
        model: Project,
        as: 'project',
        attributes: ['id', 'name'] // 只包含项目ID和名称
      }]
    });
    res.json(testCases);
  } catch (error) {
    console.error('获取测试用例列表失败:', error);
    res.status(500).json({ error: '获取测试用例列表失败', details: error.message });
  }
});

// 获取单个测试用例
router.get('/test-cases/:id', async (req, res) => {
  try {
    const testCase = await TestCase.findByPk(req.params.id, {
      include: [{
        model: Project,
        as: 'project',
        attributes: ['id', 'name']
      }]
    });
    if (!testCase) {
      return res.status(404).json({ error: '测试用例未找到' });
    }
    res.json(testCase);
  } catch (error) {
    console.error('获取测试用例失败:', error);
    res.status(500).json({ error: '获取测试用例失败', details: error.message });
  }
});

// 更新测试用例
router.put('/test-cases/:id', async (req, res) => {
  try {
    const { name, description, projectId, steps, testData, verificationPoints, status } = req.body;

    const testCase = await TestCase.findByPk(req.params.id);
    if (!testCase) {
      return res.status(404).json({ error: '测试用例未找到' });
    }

    // 检查 projectId 是否存在
    if (projectId) {
      const project = await Project.findByPk(projectId);
      if (!project) {
        return res.status(404).json({ error: '项目不存在' });
      }
    }

    await testCase.update({
      name,
      description,
      projectId,
      steps,
      testData,
      verificationPoints,
      status
    });
    res.json(testCase);
  } catch (error) {
    console.error('更新测试用例失败:', error);
    res.status(400).json({ error: error.message });
  }
});

// 删除测试用例
router.delete('/test-cases/:id', async (req, res) => {
  try {
    const testCase = await TestCase.findByPk(req.params.id);
    if (!testCase) {
      return res.status(404).json({ error: '测试用例未找到' });
    }
    await testCase.destroy();
    res.status(204).send(); // No Content
  } catch (error) {
    console.error('删除测试用例失败:', error);
    res.status(500).json({ error: '删除测试用例失败', details: error.message });
  }
});

// 执行自动化代码
router.post('/test-cases/:id/execute', executeAutomationCode);

module.exports = router;