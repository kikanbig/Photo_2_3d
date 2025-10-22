const express = require('express');
const router = express.Router();
const Model3D = require('../models/Model3D');
const { Op } = require('sequelize');

// Получить все модели
router.get('/', async (req, res) => {
  try {
    const { status = 'active', limit = 100, offset = 0 } = req.query;

    const models = await Model3D.findAll({
      where: {
        status: status
      },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const total = await Model3D.count({
      where: { status: status }
    });

    res.json({
      success: true,
      data: models,
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
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const model = await Model3D.findByPk(id);

    if (!model) {
      return res.status(404).json({
        success: false,
        error: 'Модель не найдена'
      });
    }

    res.json({
      success: true,
      data: model
    });
  } catch (error) {
    console.error('Ошибка получения модели:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
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

    const model = await Model3D.create({
      name: name || 'Untitled Model',
      description,
      modelUrl,
      previewImageUrl,
      originalImageUrl,
      dimensions,
      taskId,
      metadata,
      status: 'active'
    });

    console.log(`✅ Модель создана: ${model.id} - ${model.name}`);

    res.status(201).json({
      success: true,
      data: model
    });
  } catch (error) {
    console.error('Ошибка создания модели:', error);
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

