const nodemailer = require('nodemailer');

// Создаем транспорт для отправки email
const createTransporter = () => {
  // Используем Gmail SMTP (простой вариант для начала)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Ваш Gmail адрес
      pass: process.env.EMAIL_APP_PASSWORD // App Password, не обычный пароль
    }
  });

  return transporter;
};

// Функция отправки email
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    console.log(`📧 ПОПЫТКА отправки email: ${to} - ${subject}`);
    console.log(`   EMAIL_USER: ${process.env.EMAIL_USER}`);
    console.log(`   EMAIL_APP_PASSWORD: ${process.env.EMAIL_APP_PASSWORD ? 'Установлен' : 'НЕ установлен'}`);

    const transporter = createTransporter();

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
