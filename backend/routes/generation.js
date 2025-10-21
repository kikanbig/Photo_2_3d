const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const GenAPIService = require('../services/genapi');

const router = express.Router();
const genapiService = new GenAPIService();

// Настройка multer для этого роута
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.env.UPLOAD_DIR || 'uploads', 'input'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024
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

// Хранилище задач (в реальном проекте используйте базу данных)
const tasks = new Map();

// Загрузка изображения и запуск генерации
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл изображения не предоставлен' });
    }

    const taskId = uuidv4();
    const imagePath = req.file.path;
    
    // Сохраняем информацию о задаче
    tasks.set(taskId, {
      id: taskId,
      status: 'processing',
      imagePath: imagePath,
      createdAt: new Date(),
      result: null,
      error: null
    });

    // Запускаем генерацию в фоновом режиме
    generate3DModelAsync(taskId, imagePath);

    res.json({
      success: true,
      taskId: taskId,
      message: 'Генерация 3D модели запущена'
    });

  } catch (error) {
    console.error('Ошибка загрузки файла:', error);
    res.status(500).json({ error: error.message });
  }
});

// Проверка статуса задачи
router.get('/status/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = tasks.get(taskId);

    if (!task) {
      return res.status(404).json({ error: 'Задача не найдена' });
    }

    res.json({
      success: true,
      task: {
        id: task.id,
        status: task.status,
        createdAt: task.createdAt,
        result: task.result,
        error: task.error
      }
    });

  } catch (error) {
    console.error('Ошибка проверки статуса:', error);
    res.status(500).json({ error: error.message });
  }
});

// Скачивание результата
router.get('/download/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = tasks.get(taskId);

    if (!task) {
      return res.status(404).json({ error: 'Задача не найдена' });
    }

    if (task.status !== 'completed') {
      return res.status(400).json({ error: 'Задача еще не завершена' });
    }

    if (!task.result || !task.result.filePath) {
      return res.status(404).json({ error: 'Файл результата не найден' });
    }

    const filePath = task.result.filePath;
    
    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({ error: 'Файл не существует' });
    }

    res.download(filePath, `3d_model_${taskId}.glb`);

  } catch (error) {
    console.error('Ошибка скачивания:', error);
    res.status(500).json({ error: error.message });
  }
});

// Получение информации о пользователе GenAPI
router.get('/user-info', async (req, res) => {
  try {
    const userInfo = await genapiService.getUserInfo();
    res.json({
      success: true,
      user: userInfo
    });
  } catch (error) {
    console.error('Ошибка получения информации о пользователе:', error);
    res.status(500).json({ error: error.message });
  }
});

// Асинхронная генерация 3D модели
async function generate3DModelAsync(taskId, imagePath) {
  try {
    const task = tasks.get(taskId);
    if (!task) return;

    console.log(`Начинаем генерацию 3D модели для задачи ${taskId}`);
    
    // Отправляем запрос на генерацию
    const response = await genapiService.generate3DModel(imagePath, { is_sync: false });
    
    if (response && response.request_id) {
      // Используем long-pooling для проверки статуса
      await pollTaskStatus(taskId, response.request_id);
    } else if (response && response.status === 'success' && response.output && response.output.model_url) {
      // Получили результат сразу (is_sync=true)
      const resultUrl = response.output.model_url;
      
      // Скачиваем результат
      const outputDir = path.join(process.env.UPLOAD_DIR || 'uploads', 'output');
      await fs.ensureDir(outputDir);
      
      const outputPath = path.join(outputDir, `${taskId}.glb`);
      await genapiService.downloadResult(resultUrl, outputPath);
      
      // Обновляем задачу
      task.status = 'completed';
      task.result = {
        url: resultUrl,
        filePath: outputPath,
        downloadedAt: new Date()
      };
      tasks.set(taskId, task);
      
      console.log(`Задача ${taskId} завершена успешно сразу`);
    } else {
      throw new Error('Некорректный ответ от API');
    }

  } catch (error) {
    console.error(`Ошибка генерации для задачи ${taskId}:`, error);
    
    const task = tasks.get(taskId);
    if (task) {
      task.status = 'failed';
      task.error = error.message;
      tasks.set(taskId, task);
    }
  }
}

// Опрос статуса задачи
async function pollTaskStatus(taskId, requestId) {
  const task = tasks.get(taskId);
  if (!task) return;

  const maxAttempts = 60; // Максимум 5 минут (60 * 5 секунд)
  let attempts = 0;

  const poll = async () => {
    try {
      attempts++;
      
      const statusResponse = await genapiService.checkTaskStatus(requestId);
      
      if (statusResponse.status === 'success') {
        // Задача завершена успешно
        const resultUrl = statusResponse.result;
        
        if (resultUrl) {
          // Скачиваем результат
          const outputDir = path.join(process.env.UPLOAD_DIR || 'uploads', 'output');
          await fs.ensureDir(outputDir);
          
          const outputPath = path.join(outputDir, `${taskId}.glb`);
          await genapiService.downloadResult(resultUrl, outputPath);
          
          // Обновляем задачу
          task.status = 'completed';
          task.result = {
            url: resultUrl,
            filePath: outputPath,
            downloadedAt: new Date()
          };
          tasks.set(taskId, task);
          
          console.log(`Задача ${taskId} завершена успешно`);
        } else {
          throw new Error('URL результата не получен');
        }
      } else if (statusResponse.status === 'failed') {
        // Задача завершена с ошибкой
        task.status = 'failed';
        task.error = statusResponse.error || 'Неизвестная ошибка генерации';
        tasks.set(taskId, task);
        
        console.log(`Задача ${taskId} завершена с ошибкой: ${task.error}`);
      } else if (statusResponse.status === 'processing') {
        // Задача еще выполняется
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000); // Повторяем через 5 секунд
        } else {
          // Превышено время ожидания
          task.status = 'timeout';
          task.error = 'Превышено время ожидания генерации';
          tasks.set(taskId, task);
          
          console.log(`Задача ${taskId} превысила время ожидания`);
        }
      }
    } catch (error) {
      console.error(`Ошибка опроса статуса для задачи ${taskId}:`, error);
      
      if (attempts < maxAttempts) {
        setTimeout(poll, 5000);
      } else {
        task.status = 'failed';
        task.error = error.message;
        tasks.set(taskId, task);
      }
    }
  };

  // Начинаем опрос через 5 секунд
  setTimeout(poll, 5000);
}

module.exports = router;
