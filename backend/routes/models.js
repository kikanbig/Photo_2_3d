const express = require('express');
const router = express.Router();
const Model3D = require('../models/Model3D');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs-extra');
const { authenticateToken } = require('./auth');

// Получить модели пользователя
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status = 'active', limit = 100, offset = 0 } = req.query;

    const models = await Model3D.findAll({
      where: {
        userId: req.user.userId, // Фильтруем по пользователю
        status: status
      },
      attributes: { exclude: ['glbFile'] }, // Исключаем огромный BLOB для быстрой загрузки
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const total = await Model3D.count({
      where: {
        userId: req.user.userId,
        status: status
      }
    });

    // Добавляем imageUrl для обратной совместимости и делаем пути абсолютными
    const modelsWithImageUrl = models.map(model => {
      const modelData = model.toJSON();
      const baseUrl = process.env.RAILWAY_PUBLIC_DOMAIN 
        ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
        : '';
      
      // Формируем абсолютный URL для изображения
      let imageUrl = modelData.previewImageUrl || modelData.originalImageUrl;
      if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = baseUrl + imageUrl;
      }
      
      return {
        ...modelData,
        imageUrl: imageUrl,
        originalImageUrl: modelData.originalImageUrl && !modelData.originalImageUrl.startsWith('http') 
          ? baseUrl + modelData.originalImageUrl 
          : modelData.originalImageUrl,
        previewImageUrl: modelData.previewImageUrl && !modelData.previewImageUrl.startsWith('http')
          ? baseUrl + modelData.previewImageUrl
          : modelData.previewImageUrl
      };
    });

    res.json({
      success: true,
      data: modelsWithImageUrl,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Ошибка получения моделей:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Получить одну модель по ID (публичный доступ для AR просмотра)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const isAuthenticated = !!(req.user && req.user.userId);

    console.log(`🔍 Запрос модели ${id}, авторизован: ${isAuthenticated}`);

    // Сначала пытаемся найти по ID модели, если не нашли - по taskId (для обратной совместимости)
    let whereCondition = { id: id };

    // Если пользователь авторизован, показываем его модели
    // Если не авторизован, показываем только активные модели (для QR кодов)
    if (isAuthenticated) {
      whereCondition.userId = req.user.userId;
      console.log(`🔐 Поиск модели пользователя ${req.user.userId}`);
    } else {
      whereCondition.status = 'active'; // Для публичного доступа - только активные модели
      console.log(`🌐 Публичный доступ - поиск активной модели`);
    }

    let model = await Model3D.findOne({
      where: whereCondition,
      attributes: { exclude: ['glbFile'] } // Исключаем огромный BLOB
    });

    // Для обратной совместимости - ищем по taskId
    if (!model && !isAuthenticated) {
      console.log(`🔄 Попытка поиска по taskId ${id}`);
      model = await Model3D.findOne({
        where: { taskId: id, status: 'active' },
        attributes: { exclude: ['glbFile'] }
      });
    }

    if (!model) {
      console.log(`❌ Модель ${id} не найдена`);
      return res.status(404).json({
        success: false,
        error: 'Модель не найдена или доступ запрещен'
      });
    }

    console.log(`✅ Модель ${id} найдена: ${model.name || 'без имени'}`);

    // Добавляем imageUrl для обратной совместимости и делаем пути абсолютными
    const modelData = model.toJSON();
    const baseUrl = process.env.RAILWAY_PUBLIC_DOMAIN 
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
      : '';
    
    // Формируем абсолютный URL для изображения
    let imageUrl = modelData.previewImageUrl || modelData.originalImageUrl;
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = baseUrl + imageUrl;
    }
    
    const data = {
      ...modelData,
      imageUrl: imageUrl,
      originalImageUrl: modelData.originalImageUrl && !modelData.originalImageUrl.startsWith('http') 
        ? baseUrl + modelData.originalImageUrl 
        : modelData.originalImageUrl,
      previewImageUrl: modelData.previewImageUrl && !modelData.previewImageUrl.startsWith('http')
        ? baseUrl + modelData.previewImageUrl
        : modelData.previewImageUrl,
      glbFile: undefined // Не отправляем бинарные данные
    };

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Ошибка получения модели:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// iOS AR Quick Look - HTML страница с rel="ar" ссылкой
router.get('/:id/ar-quick-look', async (req, res) => {
  try {
    const { id } = req.params;

    const model = await Model3D.findOne({
      where: { id: id, status: 'active' },
      attributes: ['name', 'previewImageUrl', 'originalImageUrl']
    });

    if (!model) {
      return res.status(404).send('Модель не найдена');
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const glbUrl = `${baseUrl}/api/models/${id}/download-glb`;
    const previewUrl = model.previewImageUrl || model.originalImageUrl || '';
    const fullPreviewUrl = previewUrl.startsWith('http') ? previewUrl : `${baseUrl}${previewUrl}`;

    // HTML страница с rel="ar" для iOS AR Quick Look + автоматический клик
    const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${model.name || '3D Model'} - AR</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            text-align: center;
            background: white;
            padding: 2rem;
            border-radius: 20px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }
        h1 { margin: 0 0 1rem 0; color: #333; }
        .ar-link {
            display: inline-block;
            padding: 1rem 2rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 12px;
            font-size: 1.2rem;
            font-weight: 600;
            margin-top: 1rem;
        }
        img { max-width: 100%; height: auto; border-radius: 12px; margin: 1rem 0; }
        .spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #667eea;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="spinner"></div>
        <h1>📱 Запуск AR...</h1>
        ${previewUrl ? `<img src="${fullPreviewUrl}" alt="Preview" style="max-width: 200px;" />` : ''}
        <a href="${glbUrl}" rel="ar" id="ar-link" class="ar-link" style="display: none;">
            🚀 Открыть в AR
        </a>
        <p style="margin-top: 1rem; color: #666; font-size: 0.9rem;">
            Если AR не открылся автоматически, <a href="${glbUrl}" rel="ar" style="color: #667eea; font-weight: 600;">нажмите здесь</a>
        </p>
    </div>
    <script>
        // Автоматически кликаем по AR ссылке
        window.onload = function() {
            setTimeout(function() {
                var link = document.getElementById('ar-link');
                if (link) {
                    console.log('🚀 Автоматический клик по AR ссылке');
                    link.click();
                }
            }, 500);
        };
    </script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    console.error('Ошибка AR Quick Look:', error);
    res.status(500).send('Ошибка');
  }
});

// Получить GLB файл модели для AR (прямая ссылка) - публичный доступ для QR кодов
router.get('/:id/glb', async (req, res) => {
  try {
    const { id } = req.params;

    const model = await Model3D.findOne({
      where: {
        id: id,
        status: 'active' // Только активные модели доступны публично
      },
      attributes: ['glbFile', 'name']
    });

    if (!model || !model.glbFile) {
      return res.status(404).send('GLB файл не найден');
    }

    // Создаем полный URL для AR
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const glbUrl = `${baseUrl}/api/models/${id}/download-glb`;
    const arUrl = `https://arvr.google.com/scene-viewer/1.1?file=${encodeURIComponent(glbUrl)}&mode=ar_preferred&title=${encodeURIComponent(model.name || '3D Model')}`;

    // Перенаправляем на Google Scene Viewer для прямого AR открытия
    console.log(`📱 Перенаправление на AR: ${arUrl}`);
    res.redirect(302, arUrl);
  } catch (error) {
    console.error('Ошибка получения GLB для AR:', error);
    res.status(500).send('Ошибка получения файла');
  }
});

// Скачать GLB файл модели из БД для AR
router.get('/:id/download-glb', async (req, res) => {
  try {
    const { id } = req.params;

    // Сначала пытаемся найти по ID модели, если не нашли - по taskId (для обратной совместимости)
    let model = await Model3D.findOne({
      where: { id: id, status: 'active' },
      attributes: ['glbFile', 'name']
    });

    if (!model) {
      // Для обратной совместимости - ищем по taskId
      model = await Model3D.findOne({
        where: { taskId: id, status: 'active' },
        attributes: ['glbFile', 'name']
      });
    }

    if (!model || !model.glbFile) {
      return res.status(404).send('GLB файл не найден');
    }

    // Очистка имени файла от специальных символов (для Content-Disposition)
    const cleanFileName = (model.name || 'model')
      .replace(/[^a-zA-Z0-9\-_\.\s]/g, '') // Убираем все кроме букв, цифр, дефиса, подчеркивания, точки и пробела
      .replace(/\s+/g, '_') // Заменяем пробелы на подчеркивания
      .substring(0, 50); // Ограничиваем длину

    const fileSize = model.glbFile.length;
    const range = req.headers.range;

    // Заголовки для правильного отображения в AR viewers (включая iOS)
    res.setHeader('Content-Type', 'model/gltf-binary');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, Accept');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Disposition', `inline; filename="${cleanFileName}.glb"`);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Кеширование на 1 час
    res.setHeader('ETag', `"${model.id}-${model.updatedAt?.getTime() || Date.now()}"`);

    // Обработка Range requests для iOS Safari (важно для больших файлов)
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = (end - start) + 1;
      const chunk = model.glbFile.slice(start, end + 1);

      res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      res.setHeader('Content-Length', chunkSize);
      res.status(206); // Partial Content

      console.log(`📱 Отдаем часть GLB файла "${model.name || 'без имени'}" (${start}-${end}/${fileSize} байт) для iOS`);
      res.send(chunk);
    } else {
      // Полный файл
      res.setHeader('Content-Length', fileSize);
      console.log(`📱 Отдаем полный GLB файл "${model.name || 'без имени'}" (${fileSize} байт) для AR`);
      res.send(model.glbFile);
    }
    
    console.log(`📤 GLB файл отдан из БД: ${id}`);
  } catch (error) {
    console.error('Ошибка скачивания GLB:', error);
    res.status(500).send('Ошибка скачивания файла');
  }
});

// Скачивание USDZ файла модели (для iOS AR Quick Look)
router.get('/:id/download-usdz', async (req, res) => {
  try {
    const { id } = req.params;

    // Сначала пытаемся найти по ID модели, если не нашли - по taskId (для обратной совместимости)
    let model = await Model3D.findOne({
      where: { id: id, status: 'active' },
      attributes: ['usdzFile', 'name', 'id', 'updatedAt']
    });

    if (!model) {
      // Для обратной совместимости - ищем по taskId
      model = await Model3D.findOne({
        where: { taskId: id, status: 'active' },
        attributes: ['usdzFile', 'name', 'id', 'updatedAt']
      });
    }

    if (!model || !model.usdzFile) {
      return res.status(404).send('USDZ файл не найден. Модель может быть создана до внедрения поддержки iOS AR.');
    }

    // Очистка имени файла от специальных символов
    const cleanFileName = (model.name || 'model')
      .replace(/[^a-zA-Z0-9\-_\.\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);

    const fileSize = model.usdzFile.length;
    const range = req.headers.range;

    // Заголовки для iOS AR Quick Look
    res.setHeader('Content-Type', 'model/vnd.usdz+zip');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, Accept');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Disposition', `inline; filename="${cleanFileName}.usdz"`);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('ETag', `"${model.id}-${model.updatedAt?.getTime() || Date.now()}"`);

    // Обработка Range requests для iOS Safari
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = (end - start) + 1;
      const chunk = model.usdzFile.slice(start, end + 1);

      res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      res.status(206); // Partial Content

      console.log(`📱 Отдаем часть USDZ файла "${model.name || 'без имени'}" (${start}-${end}/${fileSize} байт) для iOS`);
      res.send(chunk);
    } else {
      // Полный файл
      res.setHeader('Content-Length', fileSize);
      console.log(`📱 Отдаем полный USDZ файл "${model.name || 'без имени'}" (${fileSize} байт) для iOS AR`);
      res.send(model.usdzFile);
    }
    
    console.log(`📤 USDZ файл отдан из БД: ${id}`);
  } catch (error) {
    console.error('Ошибка скачивания USDZ:', error);
    res.status(500).send('Ошибка скачивания файла');
  }
});

// Создать новую модель (сохранить)
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      modelUrl,
      previewImageUrl,
      originalImageUrl,
      dimensions,
      taskId,
      metadata
    } = req.body;

    // Валидация
    if (!modelUrl) {
      return res.status(400).json({
        success: false,
        error: 'modelUrl обязателен'
      });
    }

    // Если это локальный файл, читаем его и сохраняем в БД
    let glbFileBuffer = null;
    if (modelUrl.startsWith('/uploads/models/')) {
      try {
        const filePath = path.join(__dirname, '..', modelUrl);
        if (await fs.pathExists(filePath)) {
          glbFileBuffer = await fs.readFile(filePath);
          console.log(`📦 GLB файл прочитан для сохранения в БД: ${(glbFileBuffer.length / 1024 / 1024).toFixed(2)} MB`);
        }
      } catch (err) {
        console.warn('⚠️ Не удалось прочитать GLB файл:', err.message);
      }
    }

    const model = await Model3D.create({
      name: name || 'Untitled Model',
      description,
      modelUrl: taskId ? `/api/models/${taskId}/download` : modelUrl, // URL для скачивания из БД или внешний
      glbFile: glbFileBuffer, // Бинарный файл
      previewImageUrl,
      originalImageUrl,
      dimensions,
      taskId,
      metadata,
      status: 'active'
    });

    console.log(`✅ Модель создана: ${model.id} - ${model.name}`);
    if (glbFileBuffer) {
      console.log(`💾 GLB файл сохранён в БД: ${(glbFileBuffer.length / 1024 / 1024).toFixed(2)} MB`);
    }

    res.status(201).json({
      success: true,
      data: {
        ...model.toJSON(),
        glbFile: undefined // Не отправляем бинарные данные в ответе
      }
    });
  } catch (error) {
    console.error('Ошибка создания модели:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Обновить метаданные модели по taskId
router.put('/update-metadata/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { name, description, dimensions, metadata } = req.body;

    const model = await Model3D.findOne({ where: { taskId } });

    if (!model) {
      return res.status(404).json({
        success: false,
        error: 'Модель не найдена'
      });
    }

    // Обновляем метаданные
    if (name !== undefined) model.name = name;
    if (description !== undefined) model.description = description;
    if (dimensions !== undefined) model.dimensions = dimensions;
    if (metadata !== undefined) model.metadata = metadata;

    await model.save();

    console.log(`✅ Метаданные обновлены для модели: ${model.id}`);

    res.json({
      success: true,
      data: {
        ...model.toJSON(),
        glbFile: undefined
      }
    });
  } catch (error) {
    console.error('Ошибка обновления метаданных:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Обновить модель
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      dimensions,
      status,
      metadata
    } = req.body;

    const model = await Model3D.findByPk(id);

    if (!model) {
      return res.status(404).json({
        success: false,
        error: 'Модель не найдена'
      });
    }

    // Обновляем только переданные поля
    if (name !== undefined) model.name = name;
    if (description !== undefined) model.description = description;
    if (dimensions !== undefined) model.dimensions = dimensions;
    if (status !== undefined) model.status = status;
    if (metadata !== undefined) model.metadata = metadata;

    await model.save();

    console.log(`✅ Модель обновлена: ${model.id}`);

    res.json({
      success: true,
      data: model
    });
  } catch (error) {
    console.error('Ошибка обновления модели:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Удалить модель (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { hard = false } = req.query;

    const model = await Model3D.findByPk(id);

    if (!model) {
      return res.status(404).json({
        success: false,
        error: 'Модель не найдена'
      });
    }

    if (hard === 'true') {
      // Жёсткое удаление
      await model.destroy();
      console.log(`🗑️ Модель удалена: ${id}`);
    } else {
      // Мягкое удаление (меняем статус)
      model.status = 'deleted';
      await model.save();
      console.log(`📦 Модель архивирована: ${id}`);
    }

    res.json({
      success: true,
      message: hard === 'true' ? 'Модель удалена' : 'Модель архивирована'
    });
  } catch (error) {
    console.error('Ошибка удаления модели:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Поиск моделей
router.get('/search', async (req, res) => {
  try {
    const { q, status = 'active' } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Параметр поиска q обязателен'
      });
    }

    const models = await Model3D.findAll({
      where: {
        status: status,
        [Op.or]: [
          { name: { [Op.iLike]: `%${q}%` } },
          { description: { [Op.iLike]: `%${q}%` } }
        ]
      },
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    res.json({
      success: true,
      data: models,
      count: models.length
    });
  } catch (error) {
    console.error('Ошибка поиска моделей:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

