const express = require('express');
const router = express.Router();
const Project = require('../models/Project'); // 引入Sequelize Project模型

// 创建项目
router.post('/projects', async (req, res) => {
  try {
    const { name, description } = req.body;
    
    // 使用Sequelize的create方法创建项目
    const newProject = await Project.create({
      name,
      description
    });

    res.status(201).json(newProject);
  } catch (error) {
    // 检查是否是唯一性约束错误
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: '项目名称已存在' });
    }
    res.status(400).json({ error: error.message });
  }
});

// 获取项目列表
router.get('/projects', async (req, res) => {
  try {
    // 使用Sequelize的findAll方法获取所有项目
    const projects = await Project.findAll();
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: '获取项目列表失败', details: error.message });
  }
});

module.exports = router;