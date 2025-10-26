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

    // Добавляем imageUrl для обратной совместимости
    const modelsWithImageUrl = models.map(model => {
      const modelData = model.toJSON();
      return {
        ...modelData,
        imageUrl: modelData.originalImageUrl || modelData.previewImageUrl
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

// Получить одну модель по ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const model = await Model3D.findOne({
      where: {
        id: id,
        userId: req.user.userId // Проверяем, что модель принадлежит пользователю
      }
    });

    if (!model) {
      return res.status(404).json({
        success: false,
        error: 'Модель не найдена или доступ запрещен'
      });
    }

    res.json({
      success: true,
      data: {
        ...model.toJSON(),
        glbFile: undefined // Не отправляем бинарные данные
      }
    });
  } catch (error) {
    console.error('Ошибка получения модели:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Скачать GLB файл модели из БД
router.get('/:id/download', async (req, res) => {
  try {
    const { id } = req.params;

    const model = await Model3D.findOne({
      where: { taskId: id }, // Ищем по taskId
      attributes: ['glbFile', 'name']
    });

    if (!model || !model.glbFile) {
      return res.status(404).send('GLB файл не найден');
    }

    res.setHeader('Content-Type', 'model/gltf-binary');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Range');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Disposition', `inline; filename="${model.name || 'model'}.glb"`);

    // Дополнительные заголовки для AR поддержки
    res.setHeader('X-Frame-Options', 'ALLOWALL');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.send(model.glbFile);
    
    console.log(`📤 GLB файл отдан из БД: ${id}`);
  } catch (error) {
    console.error('Ошибка скачивания GLB:', error);
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

