const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Model3D = sequelize.define('Model3D', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Untitled Model'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // URL модели (GLB файл)
  modelUrl: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // URL превью изображения
  previewImageUrl: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Исходное изображение
  originalImageUrl: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Размеры для AR
  dimensions: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Объект с полями: length, width, height, unit'
  },
  // ID задачи генерации
  taskId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Статус
  status: {
    type: DataTypes.ENUM('active', 'archived', 'deleted'),
    defaultValue: 'active'
  },
  // Метаданные
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Дополнительные данные (параметры генерации и т.д.)'
  },
  // Для будущего: привязка к пользователю
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'ID пользователя (для будущей реализации авторизации)'
  }
}, {
  tableName: 'models_3d',
  timestamps: true, // createdAt, updatedAt
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['status']
    },
    {
      fields: ['createdAt']
    }
  ]
});

module.exports = Model3D;

