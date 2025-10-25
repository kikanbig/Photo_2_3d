// Тестовый скрипт для проверки email настроек
// Запуск: node test-email.js EMAIL_USER=ваш@gmail.com EMAIL_APP_PASSWORD=ваш_пароль

require('dotenv').config();

// Переопределяем переменные из аргументов командной строки
if (process.argv[2]) process.env.EMAIL_USER = process.argv[2].split('=')[1];
if (process.argv[3]) process.env.EMAIL_APP_PASSWORD = process.argv[3].split('=')[1];

const { testEmailConnection, sendEmail } = require('./backend/services/email');

async function testEmail() {
  console.log('🧪 Тестирование email подключения...\n');

  console.log('📧 EMAIL_USER:', process.env.EMAIL_USER ? '✅ Установлен' : '❌ НЕ установлен');
  console.log('🔑 EMAIL_APP_PASSWORD:', process.env.EMAIL_APP_PASSWORD ? '✅ Установлен (' + process.env.EMAIL_APP_PASSWORD.length + ' символов)' : '❌ НЕ установлен');

  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    console.log('\n❌ Переменные окружения не установлены!');
    console.log('Использование: node test-email.js EMAIL_USER=ваш@gmail.com EMAIL_APP_PASSWORD=ваш_пароль');
    return;
  }

  try {
    // 1. Проверяем подключение
    console.log('\n1️⃣ Проверка подключения к SMTP серверу Gmail...');
    const connectionOk = await testEmailConnection();

    if (!connectionOk) {
      console.log('❌ Подключение к email серверу НЕ удалось');
      console.log('\n🔧 Возможные проблемы:');
      console.log('   • Неправильный EMAIL_USER');
      console.log('   • Неправильный EMAIL_APP_PASSWORD');
      console.log('   • Gmail блокирует подключение');
      console.log('   • Проблемы с сетью');
      console.log('\n🔍 Проверьте:');
      console.log('   1. Включена ли 2FA в Google аккаунте?');
      console.log('   2. Правильно ли скопирован App Password (16 символов без пробелов)?');
      console.log('   3. Правильный ли EMAIL_USER?');
      return;
    }

    console.log('✅ Подключение к email серверу успешно!');

    // 2. Проверяем отправку тестового письма
    console.log('\n2️⃣ Отправка тестового письма...');

    await sendEmail({
      to: process.env.EMAIL_USER, // Отправляем себе
      subject: 'Тест Photo to 3D - Email работает! 🚀',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">🎉 Email настроен правильно!</h2>
          <p>Если вы получили это письмо, значит настройки SMTP работают:</p>
          <ul style="background: #f9f9f9; padding: 15px; border-radius: 5px;">
            <li>✅ EMAIL_USER правильный</li>
            <li>✅ EMAIL_APP_PASSWORD правильный</li>
            <li>✅ SMTP подключение работает</li>
            <li>✅ Регистрация пользователей будет работать</li>
          </ul>
          <p style="color: #666; font-size: 14px;">
            <br>Photo to 3D - Тестовое письмо<br>
            Время отправки: ${new Date().toLocaleString('ru-RU')}
          </p>
        </div>
      `
    });

    console.log('✅ Тестовое письмо отправлено успешно!');
    console.log('📧 Проверьте ваш почтовый ящик (включая папку Спам)');
    console.log('⏱️  Письмо может прийти через 10-30 секунд');

  } catch (error) {
    console.log('❌ Ошибка при тестировании email:', error.message);
    console.log('\n🔧 Решение проблемы:');
    console.log('1. Перейдите: https://myaccount.google.com/security');
    console.log('2. Включите 2FA (двухфакторную аутентификацию)');
    console.log('3. Перейдите: App passwords → Mail → Other (custom name)');
    console.log('4. Введите имя: "Photo to 3D"');
    console.log('5. СКОПИРУЙТЕ 16-символьный пароль (без пробелов)');
    console.log('6. Добавьте в Railway: EMAIL_APP_PASSWORD=ваш_новый_пароль');
    console.log('7. Добавьте в Railway: EMAIL_USER=ваш-gmail@gmail.com');
  }
}

// Запуск теста
if (require.main === module) {
  testEmail();
}

module.exports = { testEmail };
