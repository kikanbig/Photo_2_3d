const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  username: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: [3, 30] // от 3 до 30 символов
    },
    comment: 'Уникальное имя пользователя (опционально)'
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Хешированный пароль (bcrypt)'
  },
  credits: {
    type: DataTypes.INTEGER,
    defaultValue: 5000,
    allowNull: false,
    comment: '🎁 Количество кредитов пользователя (стартовые 5000, генерация стоит 50)'
  },
  status: {
    type: DataTypes.ENUM('active', 'suspended', 'banned'),
    defaultValue: 'active'
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Последний вход в систему'
  },
  profile: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Профиль пользователя (имя, настройки и т.д.)'
  }
}, {
  tableName: 'users',
  timestamps: true,
  indexes: [
    {
      fields: ['email'],
      unique: true
    },
    {
      fields: ['username'],
      unique: true
    },
    {
      fields: ['status']
    },
    {
      fields: ['createdAt']
    },
    {
      fields: ['lastLoginAt']
    }
  ]
});

// Связь с моделями 3D
User.hasMany(require('./Model3D'), {
  foreignKey: 'userId',
  as: 'models'
});

module.exports = User;
