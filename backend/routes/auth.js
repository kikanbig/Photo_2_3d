const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendEmail } = require('../services/email');

const router = express.Router();

// Регистрация пользователя (упрощенная, без email подтверждения)
router.post('/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;

    // Валидация
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email и пароль обязательны'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Пароль должен содержать минимум 6 символов'
      });
    }

    // Проверяем, существует ли пользователь с таким email
    const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Пользователь с таким email уже существует'
      });
    }

    // Если указан username, проверяем его уникальность
    if (username) {
      const existingUsername = await User.findOne({ where: { username: username.toLowerCase() } });
      if (existingUsername) {
        return res.status(400).json({
          success: false,
          error: 'Пользователь с таким username уже существует'
        });
      }
    }

    // Хешируем пароль
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Создаем пользователя
    const user = await User.create({
      email: email.toLowerCase(),
      username: username ? username.toLowerCase() : null,
      password: hashedPassword,
      emailVerified: true, // Автоматически подтверждаем email
      credits: 5000 // 🎁 Стартовые кредиты для новых пользователей
    });

    console.log(`✅ Пользователь зарегистрирован: ${user.email} (ID: ${user.id})`);
    console.log(`🎁 Начислено ${user.credits} стартовых кредитов`);

    res.json({
      success: true,
      message: 'Добро пожаловать! Вам начислено 5000 стартовых кредитов! 🎁',
      data: {
        userId: user.id,
        email: user.email,
        username: user.username,
        credits: user.credits,
        emailVerified: user.emailVerified
      }
    });

  } catch (error) {
    console.error('Ошибка регистрации:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера при регистрации'
    });
  }
});

// Подтверждение email
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Токен подтверждения обязателен'
      });
    }

    // Находим пользователя по токену
    const user = await User.findOne({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: {
          [require('sequelize').Op.gt]: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Недействительный или истекший токен подтверждения'
      });
    }

    // Подтверждаем email
    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    console.log(`✅ Email подтвержден: ${user.email}`);

    res.json({
      success: true,
      message: 'Email успешно подтвержден. Теперь вы можете войти в систему.',
      data: {
        userId: user.id,
        email: user.email,
        credits: user.credits
      }
    });

  } catch (error) {
    console.error('Ошибка подтверждения email:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера при подтверждении email'
    });
  }
});

// Повторная отправка письма подтверждения
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email обязателен'
      });
    }

    const user = await User.findOne({ where: { email: email.toLowerCase() } });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Пользователь не найден'
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        error: 'Email уже подтвержден'
      });
    }

    // Генерируем новый токен
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = verificationExpires;
    await user.save();

    // Отправляем email
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;

    await sendEmail({
      to: user.email,
      subject: 'Подтвердите ваш email - Photo to 3D',
      html: `
        <h1>Подтверждение email</h1>
        <p>Для активации аккаунта нажмите на ссылку:</p>
        <a href="${verificationUrl}" style="background: #5743E8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Подтвердить email</a>
        <p>Ссылка действительна 24 часа.</p>
      `
    });

    res.json({
      success: true,
      message: 'Письмо подтверждения отправлено повторно'
    });

  } catch (error) {
    console.error('Ошибка повторной отправки:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера'
    });
  }
});

// Вход в систему
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email и пароль обязательны'
      });
    }

    // Находим пользователя
    const user = await User.findOne({ where: { email: email.toLowerCase() } });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Неверный email или пароль'
      });
    }

    // Проверяем пароль
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Неверный email или пароль'
      });
    }

    // Проверяем статус пользователя
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        error: 'Аккаунт не активен'
      });
    }

    // Обновляем время последнего входа
    user.lastLoginAt = new Date();
    await user.save();

    // Генерируем JWT токен
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        username: user.username,
        credits: user.credits
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    console.log(`🔐 Пользователь вошел: ${user.email}`);

    res.json({
      success: true,
      message: 'Вход выполнен успешно',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          credits: user.credits,
          lastLoginAt: user.lastLoginAt
        }
      }
    });

  } catch (error) {
    console.error('Ошибка входа:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера при входе'
    });
  }
});

// Получение профиля пользователя
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId, {
      attributes: ['id', 'email', 'username', 'credits', 'lastLoginAt', 'createdAt', 'profile']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Пользователь не найден'
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Ошибка получения профиля:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера'
    });
  }
});

// Middleware для проверки JWT токена
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Токен аутентификации обязателен'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: 'Недействительный токен'
      });
    }

    req.user = user;
    next();
  });
}

// Middleware для проверки кредитов
function checkCredits(requiredCredits = 1) {
  return async (req, res, next) => {
    try {
      const user = await User.findByPk(req.user.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Пользователь не найден'
        });
      }

      if (user.credits < requiredCredits) {
        return res.status(402).json({
          success: false,
          error: `Недостаточно кредитов. Требуется: ${requiredCredits}, доступно: ${user.credits}`
        });
      }

      req.user.credits = user.credits;
      next();
    } catch (error) {
      console.error('Ошибка проверки кредитов:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка сервера'
      });
    }
  };
}

// Middleware для списания кредитов (генерация 3D модели стоит 50 кредитов)
function deductCredits(requiredCredits = 1) {
  return async (req, res, next) => {
    try {
      const user = await User.findByPk(req.user.userId);

      if (user.credits < requiredCredits) {
        return res.status(402).json({
          success: false,
          error: `Недостаточно кредитов. Доступно: ${user.credits}`
        });
      }

      user.credits -= requiredCredits;
      await user.save();

      console.log(`💰 Списано ${requiredCredits} кредитов у ${user.email}. Остаток: ${user.credits}`);

      req.user.credits = user.credits;
      next();
    } catch (error) {
      console.error('Ошибка списания кредитов:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка сервера'
      });
    }
  };
}

module.exports = {
  router,
  authenticateToken,
  checkCredits,
  deductCredits
};
