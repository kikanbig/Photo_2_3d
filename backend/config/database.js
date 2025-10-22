const { Sequelize } = require('sequelize');

// Подключение к PostgreSQL
const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'postgresql://localhost:5432/photo_to_3d',
  {
    dialect: 'postgres',
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Проверка подключения
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Подключение к базе данных установлено успешно');
    return true;
  } catch (error) {
    console.error('❌ Не удалось подключиться к базе данных:', error.message);
    return false;
  }
};

// Синхронизация моделей с БД
const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: true }); // alter: true - обновляет существующие таблицы
    console.log('✅ Модели синхронизированы с базой данных');
  } catch (error) {
    console.error('❌ Ошибка синхронизации моделей:', error.message);
  }
};

module.exports = {
  sequelize,
  testConnection,
  syncDatabase
};

