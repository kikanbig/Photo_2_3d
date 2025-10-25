// Тестовый скрипт для проверки email настроек
// Запуск: node test-email.js

require('dotenv').config();
const { testEmailConnection, sendEmail } = require('./backend/services/email');

async function testEmail() {
  console.log('🧪 Тестирование email подключения...\n');

  try {
    // 1. Проверяем подключение
    console.log('1️⃣ Проверка подключения к SMTP серверу...');
    const connectionOk = await testEmailConnection();

    if (!connectionOk) {
      console.log('❌ Подключение к email серверу НЕ удалось');
      console.log('\n🔧 Возможные проблемы:');
      console.log('   • Неправильный EMAIL_USER');
      console.log('   • Неправильный EMAIL_APP_PASSWORD');
      console.log('   • Gmail блокирует подключение');
      console.log('   • Проблемы с сетью');
      return;
    }

    console.log('✅ Подключение к email серверу успешно!');

    // 2. Проверяем отправку тестового письма
    console.log('\n2️⃣ Отправка тестового письма...');

    await sendEmail({
      to: process.env.EMAIL_USER, // Отправляем себе
      subject: 'Тест Photo to 3D - Email работает!',
      html: `
        <h2>🎉 Email настроен правильно!</h2>
        <p>Если вы получили это письмо, значит:</p>
        <ul>
          <li>✅ EMAIL_USER правильный</li>
          <li>✅ EMAIL_APP_PASSWORD правильный</li>
          <li>✅ SMTP подключение работает</li>
        </ul>
        <p>Теперь регистрация пользователей будет работать!</p>
        <br>
        <p><small>Photo to 3D - Тестовое письмо</small></p>
      `
    });

    console.log('✅ Тестовое письмо отправлено успешно!');
    console.log('📧 Проверьте ваш почтовый ящик');

  } catch (error) {
    console.log('❌ Ошибка при тестировании email:', error.message);
    console.log('\n🔧 Решение проблемы:');
    console.log('1. Перейдите: https://myaccount.google.com/security');
    console.log('2. Включите 2FA (двухфакторную аутентификацию)');
    console.log('3. Перейдите: App passwords → Mail → Other');
    console.log('4. Скопируйте 16-символьный пароль');
    console.log('5. Добавьте в Railway: EMAIL_APP_PASSWORD=ваш_новый_пароль');
  }
}

// Запуск теста
if (require.main === module) {
  testEmail();
}

module.exports = { testEmail };
