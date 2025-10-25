// Скрипт для очистки базы данных (для тестирования)
// Запуск: node clear-database.js

const { Sequelize } = require('sequelize');
require('dotenv').config();

// Настройки подключения к БД
const sequelize = new Sequelize({
  dialect: 'postgresql',
  host: process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).hostname : 'localhost',
  port: process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).port : 5432,
  database: process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).pathname.slice(1) : 'photo_to_3d',
  username: process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).username : 'postgres',
  password: process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).password : '',
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
  logging: console.log
});

async function clearDatabase() {
  try {
    console.log('🔄 Подключение к базе данных...');

    await sequelize.authenticate();
    console.log('✅ Подключение успешно');

    console.log('🗑️  Очистка таблицы пользователей...');

    // Очистка таблицы пользователей
    await sequelize.query('DELETE FROM users');

    // Сброс счетчика ID
    await sequelize.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');

    console.log('✅ База данных очищена!');
    console.log('📧 Теперь можно регистрировать email заново');

  } catch (error) {
    console.error('❌ Ошибка очистки базы данных:', error.message);
  } finally {
    await sequelize.close();
  }
}

// Запуск скрипта
if (require.main === module) {
  clearDatabase();
}

module.exports = { clearDatabase };
