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
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Хешированный пароль (bcrypt)'
  },
  emailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Подтвержден ли email'
  },
  emailVerificationToken: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Токен для подтверждения email'
  },
  emailVerificationExpires: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Срок действия токена подтверждения'
  },
  credits: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
    allowNull: false,
    comment: 'Количество кредитов пользователя (стартовые 100)'
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
      fields: ['emailVerificationToken']
    },
    {
      fields: ['status']
    },
    {
      fields: ['createdAt']
    }
  ]
});

// Связь с моделями 3D
User.hasMany(require('./Model3D'), {
  foreignKey: 'userId',
  as: 'models'
});

module.exports = User;
