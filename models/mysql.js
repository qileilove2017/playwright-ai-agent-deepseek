const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE || 'scriptdb',
  process.env.MYSQL_USER || 'root',
  process.env.MYSQL_PASSWORD || '123456',
  {
    host: process.env.MYSQL_HOST || 'mysql',
    dialect: 'mysql',
    port: process.env.MYSQL_PORT || 3306,
    logging: false,
  }
);

module.exports = sequelize;