const { DataTypes } = require('sequelize');
const sequelize = require('./mysql');

const Script = sequelize.define('Script', {
  script: { type: DataTypes.TEXT, allowNull: false },
  description: { type: DataTypes.STRING, allowNull: false },
  testCase: { type: DataTypes.STRING },
  metadata: { type: DataTypes.JSON }
}, {
  tableName: 'scripts',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

module.exports = Script;