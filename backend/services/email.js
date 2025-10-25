const nodemailer = require('nodemailer');

// Альтернативный транспорт для Yandex.Mail (если Gmail не работает)
const createYandexTransporter = () => {
  console.log('🔧 Создаем Yandex SMTP транспорт');
  const transporter = nodemailer.createTransport({
    host: 'smtp.yandex.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER, // yandex.ru email
      pass: process.env.EMAIL_APP_PASSWORD // Пароль приложения Yandex
    },
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 10000
  });
  return transporter;
};

// SendGrid транспорт (надежный вариант, 100 email/день бесплатно)
const createSendGridTransporter = () => {
  console.log('🔧 Создаем SendGrid транспорт');
  // Для SendGrid используем прямой API вызов вместо nodemailer
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  // Создаем nodemailer совместимый транспорт
  const transporter = nodemailer.createTransport({
    send: (mail, callback) => {
      const msg = {
        to: mail.data.to,
        from: process.env.EMAIL_USER, // Используем EMAIL_USER как отправителя
        subject: mail.data.subject,
        html: mail.data.html || mail.data.text,
      };

      sgMail.send(msg)
        .then(() => callback(null, { messageId: 'sendgrid-' + Date.now() }))
        .catch(callback);
    }
  });

  return transporter;
};

// Создаем транспорт для отправки email
const createTransporter = () => {
  // Используем Gmail SMTP с дополнительными настройками
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD
    },
    // Дополнительные настройки для стабильности
    secure: true, // Использовать SSL
    pool: true, // Connection pooling
    maxConnections: 1, // Максимум 1 соединение
    maxMessages: 5, // Максимум 5 сообщений на соединение
    // Таймауты
    connectionTimeout: 10000, // 10 секунд на подключение
    greetingTimeout: 5000,   // 5 секунд на приветствие
    socketTimeout: 10000     // 10 секунд на сокет
  });

  return transporter;
};

// Функция отправки email
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    console.log(`📧 ПОПЫТКА отправки email: ${to} - ${subject}`);
    console.log(`   EMAIL_USER: ${process.env.EMAIL_USER}`);
    console.log(`   EMAIL_APP_PASSWORD: ${process.env.EMAIL_APP_PASSWORD ? 'Установлен' : 'НЕ установлен'}`);
    console.log(`   EMAIL_PROVIDER: ${process.env.EMAIL_PROVIDER || 'gmail'}`);

    // Выбираем провайдер email
    let transporter;
    if (process.env.EMAIL_PROVIDER === 'sendgrid') {
      console.log('📧 Используем SendGrid');
      transporter = createSendGridTransporter();
    } else if (process.env.EMAIL_PROVIDER === 'yandex') {
      console.log('📧 Используем Yandex.Mail');
      transporter = createYandexTransporter();
    } else {
      console.log('📧 Используем Gmail');
      transporter = createTransporter();
    }

    const mailOptions = {
      from: `"Photo to 3D" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '') // Убираем HTML теги для text версии
    };

    console.log(`📧 Отправка email через Gmail SMTP...`);
    const result = await transporter.sendMail(mailOptions);

    console.log(`✅ Email отправлен успешно: ${to} - ${subject}`);
    console.log(`   Message ID: ${result.messageId}`);
    console.log(`   Response: ${result.response}`);

    return result;
  } catch (error) {
    console.error('❌ Ошибка отправки email:', error.message);
    console.error('   Полная ошибка:', error);
    throw error;
  }
};

// Тестовая функция для проверки подключения
const testEmailConnection = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email сервер готов к отправке');
    return true;
  } catch (error) {
    console.error('❌ Email сервер не настроен:', error.message);
    return false;
  }
};

module.exports = {
  sendEmail,
  testEmailConnection
};
