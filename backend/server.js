const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
require('dotenv').config();

const { testConnection, syncDatabase } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;

// Создаем директории для загрузок СРАЗУ
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
fs.ensureDirSync(uploadDir);
fs.ensureDirSync(path.join(uploadDir, 'input'));
fs.ensureDirSync(path.join(uploadDir, 'output'));
fs.ensureDirSync(path.join(uploadDir, 'models'));

// Middleware
app.use(cors({
  origin: '*', // Разрешаем запросы с любого домена
  credentials: true
}));
app.use(express.json({ limit: '50mb' })); // Увеличиваем лимит для base64 изображений
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ВАЖНО: Раздача файлов ПЕРЕД статическими файлами фронтенда!
// Раздаём GLB модели
app.use('/uploads/models', express.static(path.join(__dirname, uploadDir, 'models'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.glb')) {
      res.setHeader('Content-Type', 'model/gltf-binary');
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
  }
}));

// Раздаём исходные изображения для превью
const staticPath = path.join(__dirname, '..', uploadDir, 'input');
app.use('/uploads/input', express.static(staticPath, {
  setHeaders: (res, filePath) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Устанавливаем правильный Content-Type для изображений
    const ext = path.extname(filePath).toLowerCase();
    const imageTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };
    if (imageTypes[ext]) {
      res.setHeader('Content-Type', imageTypes[ext]);
    }
  }
}));

// Обслуживание статических файлов фронтенда
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
} else {
  app.use(express.static('public'));
}

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(uploadDir, 'input'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Только изображения разрешены!'));
    }
  }
});

// Импорт роутов
const generationRoutes = require('./routes/generation');
const userRoutes = require('./routes/users');
const modelsRoutes = require('./routes/models');

// Роуты
app.use('/api/generation', generationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/models', modelsRoutes);

// API роуты
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Photo to 3D API Server',
    status: 'running',
    version: '1.0.0'
  });
});

// Проверка API ключа
app.get('/api/check-api-key', (req, res) => {
  const apiKey = process.env.GENAPI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API ключ не установлен' });
  }
  res.json({ 
    message: 'API ключ установлен',
    key: apiKey.substring(0, 10) + '...' // Показываем только часть ключа для безопасности
  });
});

// Обслуживание React приложения для всех остальных маршрутов
// ВАЖНО: Исключаем /uploads/* чтобы не перехватывать статические файлы
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res, next) => {
    // Пропускаем запросы к статическим файлам
    if (req.path.startsWith('/uploads/')) {
      return next();
    }
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

// Обработка ошибок
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Файл слишком большой!' });
    }
  }
  res.status(500).json({ error: error.message });
});

// Инициализация базы данных и запуск сервера
const startServer = async () => {
  try {
    // Проверяем подключение к БД
    await testConnection();
    
    // Синхронизируем модели с БД
    await syncDatabase();
    
    // Запускаем сервер
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Сервер запущен на порту ${PORT}`);
      console.log(`📁 Директория загрузок: ${uploadDir}`);
      console.log(`🌐 CORS настроен для: * (все домены)`);
      console.log(`🗄️  База данных подключена`);
    });
  } catch (error) {
    console.error('❌ Ошибка запуска сервера:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
