const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const GenAPIService = require('../services/genapi');
const { scaleGLB } = require('../services/glb-scaler');

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

// Хранилище задач - используем JSON файл для персистентности
const tasksFilePath = path.join(process.env.UPLOAD_DIR || 'uploads', 'tasks.json');

// Загружаем задачи из файла при старте
let tasks = new Map();
try {
  if (fs.existsSync(tasksFilePath)) {
    const tasksData = JSON.parse(fs.readFileSync(tasksFilePath, 'utf8'));
    tasks = new Map(Object.entries(tasksData));
    console.log(`✅ Загружено ${tasks.size} задач из файла`);
  }
} catch (error) {
  console.error('⚠️ Ошибка загрузки задач из файла:', error.message);
}

// Функция сохранения задач в файл
function saveTasks() {
  try {
    const tasksData = Object.fromEntries(tasks);
    fs.writeFileSync(tasksFilePath, JSON.stringify(tasksData, null, 2));
  } catch (error) {
    console.error('⚠️ Ошибка сохранения задач:', error.message);
  }
}

// Загрузка изображения и запуск генерации
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл изображения не предоставлен' });
    }

    const taskId = uuidv4();
    const imagePath = req.file.path;
    
    // Получаем размеры из запроса если они есть
    let dimensions = null;
    if (req.body.dimensions) {
      try {
        dimensions = JSON.parse(req.body.dimensions);
        console.log(`[Задача ${taskId}] Размеры объекта:`, dimensions);
      } catch (e) {
        console.warn(`[Задача ${taskId}] Не удалось распарсить размеры:`, e);
      }
    }

    console.log(`[Задача ${taskId}] Создана новая задача для файла: ${imagePath}`);

    // Сохраняем информацию о задаче
    tasks.set(taskId, {
      id: taskId,
      status: 'processing',
      imagePath: imagePath,
      dimensions: dimensions,
      createdAt: new Date(),
      result: null,
      error: null
    });

    console.log(`[Задача ${taskId}] Информация сохранена. Всего задач в памяти: ${tasks.size}`);

    // Сохраняем задачи в файл
    saveTasks();

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
    
    console.log(`[Проверка статуса] Запрос для задачи: ${taskId}. Всего задач: ${tasks.size}`);
    
    const task = tasks.get(taskId);

    if (!task) {
      console.log(`[Проверка статуса] Задача ${taskId} НЕ НАЙДЕНА! Список задач:`, Array.from(tasks.keys()));
      return res.status(404).json({ error: 'Задача не найдена' });
    }

    console.log(`[Проверка статуса] Задача ${taskId} найдена. Статус: ${task.status}`);

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

// Отладка: получить все задачи
router.get('/debug/tasks', async (req, res) => {
  try {
    const allTasks = Array.from(tasks.entries()).map(([id, task]) => ({
      id,
      status: task.status,
      createdAt: task.createdAt,
      hasResult: !!task.result,
      hasError: !!task.error
    }));
    
    res.json({
      success: true,
      totalTasks: tasks.size,
      tasks: allTasks
    });
  } catch (error) {
    console.error('Ошибка получения задач:', error);
    res.status(500).json({ error: error.message });
  }
});

// Асинхронная генерация 3D модели
async function generate3DModelAsync(taskId, imagePath) {
  try {
    const task = tasks.get(taskId);
    if (!task) return;

    console.log(`[Задача ${taskId}] Начинаем генерацию 3D модели...`);
    
    // PRESET_ULTIMATE: Максимальное качество для финальных работ, презентаций, рендеринга и 3D печати
    const response = await genapiService.generate3DModel(imagePath, {
      is_sync: true,
      ss_guidance_strength: 8.5,     // Очень высокая точность следования изображению
      ss_sampling_steps: 50,         // МАКСИМУМ: 50 шагов для лучшего качества
      slat_guidance_strength: 4.0,   // Высокая детализация геометрии
      slat_sampling_steps: 50,       // МАКСИМУМ: 50 шагов детализации
      mesh_simplify: 0.98,           // МАКСИМУМ: минимальное упрощение сетки
      texture_size: 2048             // МАКСИМУМ: 2K текстуры для высокой четкости
    });
    
    console.log(`[Задача ${taskId}] Получен ответ от API:`, JSON.stringify(response, null, 2));
    
    if (response && response.request_id) {
      console.log(`[Задача ${taskId}] Получен request_id: ${response.request_id}, запускаем проверку статуса`);
      // Используем long-pooling для проверки статуса
      await pollTaskStatus(taskId, response.request_id);
    } else if (response && response.status === 'success' && response.output && response.output.model_url) {
      console.log(`[Задача ${taskId}] Получен результат сразу. URL модели: ${response.output.model_url}`);
      // Получили результат сразу (is_sync=true)
      const resultUrl = response.output.model_url;
      
      // Скачиваем результат во временную папку
      const outputDir = path.join(process.env.UPLOAD_DIR || 'uploads', 'temp');
      await fs.ensureDir(outputDir);

      const tempPath = path.join(outputDir, `${taskId}.glb`);
      await genapiService.downloadResult(resultUrl, tempPath);

      // Читаем файл для сохранения в БД
      const glbBuffer = await fs.readFile(tempPath);
      console.log(`📦 GLB прочитан: ${(glbBuffer.length / 1024 / 1024).toFixed(2)} MB`);

      // 🔄 МАСШТАБИРУЕМ GLB В 2 РАЗА (потому что модель генерируется в половинном размере)
      console.log('🔄 Масштабируем GLB файл в 2 раза...');
      const scaledGLBBuffer = scaleGLB(glbBuffer, 2.0);
      console.log(`✅ GLB масштабирован: ${(scaledGLBBuffer.length / 1024 / 1024).toFixed(2)} MB`);

      // Сохраняем масштабированный GLB в БД
      const Model3D = require('../models/Model3D');
      await Model3D.create({
        name: `Model ${taskId}`,
        modelUrl: `/api/models/${taskId}/download`,
        glbFile: scaledGLBBuffer,  // Используем масштабированный буфер!
        originalImageUrl: `/uploads/input/${path.basename(imagePath)}`, // Сохраняем путь к исходному изображению
        taskId: taskId,
        status: 'active'
      });
      console.log(`💾 Масштабированный GLB сохранён в БД для задачи: ${taskId}`);

      // Удаляем временный файл
      await fs.remove(tempPath);

      // URL для фронтенда
      const apiModelUrl = `/api/models/${taskId}/download`;

      // Обновляем задачу
      task.status = 'completed';
      task.result = {
        url: apiModelUrl, // URL для скачивания из БД
        externalUrl: resultUrl, // Внешний URL для справки
        downloadedAt: new Date(),
        modelUrl: apiModelUrl // URL для model-viewer
      };
      tasks.set(taskId, task);
      saveTasks();

      console.log(`✅ Задача ${taskId} завершена. URL: ${apiModelUrl}`);
    } else {
      console.log(`[Задача ${taskId}] Получен неожиданный формат ответа от API:`, JSON.stringify(response, null, 2));
      
      // Проверяем, есть ли в ответе HTML-страница (признак того, что API вернул веб-страницу вместо JSON)
      if (typeof response === 'string' && response.includes('<!DOCTYPE html>')) {
        throw new Error('API вернул HTML-страницу вместо ожидаемого JSON. Возможно, проблема с аутентификацией или URL API.');
      }
      
      // Проверяем наличие URL модели в любом формате ответа
      if (response && typeof response === 'object') {
        // Попробуем найти URL модели в любом поле ответа
        const findModelUrl = (obj) => {
          if (!obj || typeof obj !== 'object') return null;
          
          // Проверяем прямые поля, которые могут содержать URL модели
          for (const key of ['model_url', 'url', 'result', 'output']) {
            if (obj[key] && typeof obj[key] === 'string' && obj[key].startsWith('http')) {
              return obj[key];
            } else if (obj[key] && typeof obj[key] === 'object') {
              const nestedUrl = findModelUrl(obj[key]);
              if (nestedUrl) return nestedUrl;
            }
          }
          
          // Проверяем все поля объекта
          for (const key in obj) {
            if (obj[key] && typeof obj[key] === 'object') {
              const nestedUrl = findModelUrl(obj[key]);
              if (nestedUrl) return nestedUrl;
            }
          }
          
          return null;
        };
        
        const modelUrl = findModelUrl(response);
        if (modelUrl) {
          console.log(`[Задача ${taskId}] Найден URL модели в нестандартном формате ответа: ${modelUrl}`);
          
          // Скачиваем во временную папку
          const outputDir = path.join(process.env.UPLOAD_DIR || 'uploads', 'temp');
          await fs.ensureDir(outputDir);
          
          const tempPath = path.join(outputDir, `${taskId}.glb`);
          await genapiService.downloadResult(modelUrl, tempPath);
          
          // Читаем и сохраняем в БД
          const glbBuffer = await fs.readFile(tempPath);
          console.log(`📦 GLB прочитан: ${(glbBuffer.length / 1024 / 1024).toFixed(2)} MB`);
          
          // 🔄 МАСШТАБИРУЕМ GLB В 2 РАЗА (потому что модель генерируется в половинном размере)
          console.log('🔄 Масштабируем GLB файл в 2 раза...');
          const scaledGLBBuffer = scaleGLB(glbBuffer, 2.0);
          console.log(`✅ GLB масштабирован: ${(scaledGLBBuffer.length / 1024 / 1024).toFixed(2)} MB`);

          const Model3D = require('../models/Model3D');
          await Model3D.create({
            name: `Model ${taskId}`,
            modelUrl: `/api/models/${taskId}/download`,
            glbFile: scaledGLBBuffer,  // Используем масштабированный буфер!
            originalImageUrl: `/uploads/input/${path.basename(imagePath)}`, // Сохраняем путь к исходному изображению
            taskId: taskId,
            status: 'active'
          });
          console.log(`💾 Масштабированный GLB сохранён в БД для задачи: ${taskId}`);
          
          // Удаляем временный файл
          await fs.remove(tempPath);
          
          const apiModelUrl = `/api/models/${taskId}/download`;
          
          // Обновляем задачу
          task.status = 'completed';
          task.result = {
            url: apiModelUrl,
            externalUrl: modelUrl,
            downloadedAt: new Date(),
            modelUrl: apiModelUrl
          };
          tasks.set(taskId, task);
          saveTasks();
          
          console.log(`✅ Задача ${taskId} завершена (нестандартный формат). URL: ${apiModelUrl}`);
          return;
        }
      }
      
      throw new Error('Некорректный ответ от API: не удалось найти URL модели');
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

  console.log(`[Задача ${taskId}] Запускаем опрос статуса для request_id: ${requestId}`);

  const poll = async () => {
    try {
      attempts++;
      console.log(`[Задача ${taskId}] Попытка ${attempts}/${maxAttempts} проверки статуса...`);
      
      const statusResponse = await genapiService.checkTaskStatus(requestId);
      console.log(`[Задача ${taskId}] ===== ПОЛНЫЙ ОТВЕТ ОТ API =====`);
      console.log(JSON.stringify(statusResponse, null, 2));
      console.log(`[Задача ${taskId}] ===== КОНЕЦ ОТВЕТА =====`);
      
      if (statusResponse.status === 'success') {
        // Задача завершена успешно
        // GenAPI может возвращать результат в разных полях: output, result, full_response
        let resultUrl = null;
        
        // Проверяем поле result (может быть массивом или строкой)
        if (statusResponse.result) {
          if (Array.isArray(statusResponse.result) && statusResponse.result.length > 0) {
            resultUrl = statusResponse.result[0]; // Берем первый элемент массива
          } else if (typeof statusResponse.result === 'string') {
            resultUrl = statusResponse.result;
          }
        }
        
        // Если не нашли в result, проверяем output
        if (!resultUrl && statusResponse.output) {
          const output = statusResponse.output;
          if (typeof output === 'string' && output.startsWith('http')) {
            resultUrl = output;
          } else if (output && typeof output === 'object') {
            resultUrl = output.model_url || output.url || output.glb || output.file;
          }
        }
        
        // Если не нашли в output, проверяем full_response
        if (!resultUrl && statusResponse.full_response && Array.isArray(statusResponse.full_response)) {
          const firstResponse = statusResponse.full_response[0];
          if (firstResponse && firstResponse.url) {
            resultUrl = firstResponse.url;
          }
        }
        
        if (resultUrl) {
          console.log(`[Задача ${taskId}] Найден URL модели: ${resultUrl}`);
          
          // Скачиваем во временную папку
          const outputDir = path.join(process.env.UPLOAD_DIR || 'uploads', 'temp');
          await fs.ensureDir(outputDir);
          
          const tempPath = path.join(outputDir, `${taskId}.glb`);
          await genapiService.downloadResult(resultUrl, tempPath);
          
          // Читаем и сохраняем в БД
          const glbBuffer = await fs.readFile(tempPath);
          console.log(`📦 GLB прочитан: ${(glbBuffer.length / 1024 / 1024).toFixed(2)} MB`);

          // 🔄 МАСШТАБИРУЕМ GLB В 2 РАЗА (потому что модель генерируется в половинном размере)
          console.log('🔄 Масштабируем GLB файл в 2 раза...');
          const scaledGLBBuffer = scaleGLB(glbBuffer, 2.0);
          console.log(`✅ GLB масштабирован: ${(scaledGLBBuffer.length / 1024 / 1024).toFixed(2)} MB`);

          const Model3D = require('../models/Model3D');
          await Model3D.create({
            name: `Model ${taskId}`,
            modelUrl: `/api/models/${taskId}/download`,
            glbFile: scaledGLBBuffer,  // Используем масштабированный буфер!
            originalImageUrl: `/uploads/input/${path.basename(imagePath)}`, // Сохраняем путь к исходному изображению
            taskId: taskId,
            status: 'active'
          });
          console.log(`💾 Масштабированный GLB сохранён в БД для задачи: ${taskId}`);
          
          // Удаляем временный файл
          await fs.remove(tempPath);
          
          const apiModelUrl = `/api/models/${taskId}/download`;
          
          // Обновляем задачу
          task.status = 'completed';
          task.result = {
            url: apiModelUrl,
            externalUrl: resultUrl,
            downloadedAt: new Date(),
            modelUrl: apiModelUrl
          };
          tasks.set(taskId, task);
          saveTasks();
          
          console.log(`✅ Задача ${taskId} завершена успешно. URL: ${apiModelUrl}`);
        } else {
          console.log(`[Задача ${taskId}] URL не найден. Полный ответ:`, JSON.stringify(statusResponse, null, 2));
          throw new Error('URL результата не получен');
        }
      } else if (statusResponse.status === 'failed' || statusResponse.status === 'error') {
        // Задача завершена с ошибкой
        task.status = 'failed';
        task.error = statusResponse.error || 'Неизвестная ошибка генерации';
        tasks.set(taskId, task);
        saveTasks(); // Сохраняем в файл
        
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
