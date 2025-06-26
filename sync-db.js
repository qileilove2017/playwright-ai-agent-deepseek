const sequelize = require('./models/mysql');
require('./models/Project');
require('./models/TestCase');

async function syncDatabase() {
  try {
    // The { alter: true } option will check the current state of the table in the database,
    // and then perform the necessary changes in the table to make it match the model.
    await sequelize.sync({ alter: true });
    console.log('Database synchronized successfully.');
  } catch (error) {
    console.error('Error synchronizing the database:', error);
  } finally {
    await sequelize.close();
  }
}

syncDatabase();