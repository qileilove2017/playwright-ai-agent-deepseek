const { DataTypes } = require('sequelize');
const sequelize = require('./mysql'); // 引入 Sequelize 实例
const Project = require('./Project'); // 引入 Project 模型

const TestCase = sequelize.define('TestCase', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '测试用例名称'
  },
  description: {
    type: DataTypes.TEXT,
    comment: '测试用例描述'
  },
  // 新增 projectId 字段
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: false, // 项目ID不能为空
    references: {
      model: Project, // 引用 Project 模型
      key: 'id',      // 引用 Project 模型的主键 id
    },
    comment: '所属项目ID'
  },
  // ... 其他测试步骤、数据、验证点等字段 ...
  // 示例：
  steps: {
    type: DataTypes.JSON, // 存储为 JSON 格式
    defaultValue: [],
    comment: '测试步骤'
  },
  testData: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: '测试数据'
  },
  verificationPoints: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: '验证点'
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'draft',
    comment: '用例状态 (draft, active, deprecated)'
  },
  generatedCode: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'AI 生成的原始测试用例内容'
  },
  playwrightJsCode: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Playwright JavaScript 自动化代码'
  },
  playwrightPyCode: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Playwright Python 自动化代码'
  },
  webdriverJavaCode: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'WebDriver Java 自动化代码'
    },
    webdriverPyCode: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'WebDriver Python 自动化代码'
    }
}, {
  tableName: 'test_cases',
  timestamps: true,
});

// 定义关联：一个项目可以有多个测试用例
TestCase.belongsTo(Project, {
  foreignKey: 'projectId',
  as: 'project'
});

module.exports = TestCase;