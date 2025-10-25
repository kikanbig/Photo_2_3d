# 🛠️ Руководство по разработке - Photo to 3D v3.0

## 📋 Содержание

1. [Архитектура проекта](#архитектура-проекта)
2. [Настройка окружения](#настройка-окружения)
3. [Backend разработка](#backend-разработка)
4. [Frontend разработка](#frontend-разработка)
5. [База данных](#база-данных)
6. [Тестирование](#тестирование)
7. [Деплой](#деплой)
8. [Отладка](#отладка)

---

## 🏗️ Архитектура проекта

### Общая архитектура

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   External API  │
│   (React)       │◄──►│   (Node.js)     │◄──►│   GenAPI/Trellis│
│                 │    │                 │    │                 │
│ • 3D Viewer     │    │ • File Upload   │    │ • AI Generation │
│ • Model List    │    │ • API Routes    │    │ • Model Download│
│ • AR Integration│    │ • Database      │    │ • Status Check  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Browser       │    │   PostgreSQL    │    │   File Storage  │
│   (Three.js)    │    │   (Models)      │    │   (GLB Files)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Компоненты системы

#### Frontend (React)
- **Страницы:** Home, MyModels, ModelView, ARView
- **Компоненты:** ModelViewer, ImageUpload, ModelSettings, StatusCard
- **Стили:** CSS3 с анимациями и адаптивным дизайном
- **3D:** Three.js + React Three Fiber для интерактивного просмотра

#### Backend (Node.js)
- **API Routes:** Генерация, модели, пользователи
- **Services:** GenAPI интеграция, GLB обработка
- **Models:** Sequelize ORM для PostgreSQL
- **Storage:** Локальные файлы + PostgreSQL BLOB

#### AI Integration
- **GenAPI:** Платформа для AI генерации
- **Trellis:** Специализированная модель для 3D из изображений
- **Асинхронность:** Long-polling для отслеживания задач

---

## ⚙️ Настройка окружения

### Системные требования

#### Минимальные требования
- **Node.js:** 18.0.0+
- **PostgreSQL:** 13.0+
- **RAM:** 4GB+
- **Disk:** 10GB+ (для моделей и БД)

#### Рекомендуемые требования
- **Node.js:** 20.0.0+
- **PostgreSQL:** 15.0+
- **RAM:** 8GB+
- **Disk:** SSD 50GB+

### 1. Инициализация проекта

```bash
# Клонирование
git clone <repository-url>
cd Photo_to_3D

# Установка зависимостей
cd backend && npm install
cd ../frontend && npm install
```

### 2. Конфигурация Backend

Создайте `.env` в папке `backend/`:

```env
# === ОБЯЗАТЕЛЬНЫЕ НАСТРОЙКИ ===
GENAPI_API_KEY=your_api_key_here          # Получите на gen-api.ru
GENAPI_BASE_URL=https://gen-api.ru/api/v1

# === БАЗА ДАННЫХ ===
DATABASE_URL=postgresql://user:pass@localhost:5432/photo_to_3d

# === СЕРВЕР ===
PORT=3001
NODE_ENV=development

# === ФАЙЛЫ ===
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_DIR=uploads

# === FRONTEND ===
FRONTEND_URL=http://localhost:3000
```

### 3. Настройка PostgreSQL

```sql
-- Создание базы данных
CREATE DATABASE photo_to_3d;
GRANT ALL PRIVILEGES ON DATABASE photo_to_3d TO your_username;

-- Проверка подключения
psql -h localhost -U your_username -d photo_to_3d -c "SELECT version();"
```

### 4. Запуск в development

```bash
# Терминал 1 - Backend
cd backend
npm run dev  # или npm start

# Терминал 2 - Frontend
cd frontend
npm start

# Проверка
curl http://localhost:3001/api
curl http://localhost:3000
```

---

## 🔧 Backend разработка

### Структура backend

```
backend/
├── config/
│   └── database.js           # PostgreSQL + Sequelize
├── models/
│   └── Model3D.js           # Модель 3D объектов
├── routes/
│   ├── generation.js        # API генерации
│   ├── models.js            # API моделей
│   └── users.js             # API пользователей
├── services/
│   ├── genapi.js            # GenAPI интеграция
│   └── glb-scaler.js        # Масштабирование GLB
├── uploads/                 # Файлы пользователей
├── server.js               # Главный сервер
└── package.json
```

### Создание нового роута

**Пример: Создание роута для статистики**

```javascript
// routes/stats.js
const express = require('express');
const router = express.Router();
const Model3D = require('../models/Model3D');

// GET /api/stats - Получить статистику
router.get('/', async (req, res) => {
  try {
    const totalModels = await Model3D.count();
    const activeModels = await Model3D.count({
      where: { status: 'active' }
    });

    res.json({
      success: true,
      data: {
        totalModels,
        activeModels,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
```

Добавьте в `server.js`:
```javascript
const statsRoutes = require('./routes/stats');
app.use('/api/stats', statsRoutes);
```

### Работа с моделями Sequelize

**Создание новой модели:**

```javascript
// models/User.js
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
  name: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'users',
  timestamps: true,
  indexes: [
    {
      fields: ['email'],
      unique: true
    }
  ]
});

module.exports = User;
```

**Миграции:**
```javascript
// Создание таблицы
await User.sync({ force: false }); // НЕ ИСПОЛЬЗУЙТЕ force: true в production!

// Изменение таблицы
await User.sync({ alter: true }); // Безопасное изменение структуры
```

### Интеграция с внешними API

**Пример сервиса для внешнего API:**

```javascript
// services/externalApi.js
const axios = require('axios');

class ExternalAPIService {
  constructor(baseURL, apiKey) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
  }

  async makeRequest(endpoint, data = {}) {
    try {
      const response = await axios.post(
        `${this.baseURL}${endpoint}`,
        data,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );
      return response.data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = ExternalAPIService;
```

### Обработка файлов

**Загрузка и обработка:**

```javascript
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');

// Конфигурация multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/input';
    fs.ensureDirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const isValid = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    cb(null, isValid);
  }
});

// В роуте
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }

    // Обработка файла
    const result = await processImage(req.file.path);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## 🎨 Frontend разработка

### Структура frontend

```
frontend/src/
├── components/              # Переиспользуемые компоненты
│   ├── ModelViewer.js      # 3D просмотрщик с авто-фитом
│   ├── ImageUpload.js      # Загрузка изображений
│   ├── ModelSettings.js    # Настройки модели
│   ├── LoadingSpinner.js   # Индикаторы загрузки
│   ├── StatusCard.js       # Карточки статуса
│   └── ...
├── pages/                  # Страницы приложения
│   ├── Home.js            # Главная страница генерации
│   ├── MyModels.js        # Список моделей
│   ├── ModelView.js       # Просмотр модели
│   └── ARView.js          # AR просмотр
├── services/              # API сервисы
│   └── api.js             # HTTP клиент
├── App.js                 # Главный компонент
└── App.css                # Глобальные стили
```

### Создание нового компонента

**Пример: Компонент карточки модели**

```javascript
// components/ModelCard.js
import React from 'react';
import { Download, Eye, Trash2 } from 'lucide-react';
import './ModelCard.css';

const ModelCard = ({ model, onView, onDownload, onDelete }) => {
  const handleImageError = (e) => {
    e.target.src = '/placeholder-model.png';
  };

  return (
    <div className="model-card">
      <div className="model-card__image">
        <img
          src={model.previewImageUrl}
          alt={model.name}
          onError={handleImageError}
        />
      </div>

      <div className="model-card__info">
        <h3 className="model-card__title">{model.name}</h3>
        <p className="model-card__dimensions">
          {model.dimensions?.length} × {model.dimensions?.width} × {model.dimensions?.height} {model.dimensions?.unit}
        </p>
        <p className="model-card__date">
          {new Date(model.createdAt).toLocaleDateString()}
        </p>
      </div>

      <div className="model-card__actions">
        <button onClick={() => onView(model.id)} className="btn btn-secondary">
          <Eye size={16} />
          Просмотр
        </button>
        <button onClick={() => onDownload(model)} className="btn btn-primary">
          <Download size={16} />
          Скачать
        </button>
        <button onClick={() => onDelete(model.id)} className="btn btn-danger">
          <Trash2 size={16} />
          Удалить
        </button>
      </div>
    </div>
  );
};

export default ModelCard;
```

**CSS стили:**

```css
/* ModelCard.css */
.model-card {
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.2s ease;
}

.model-card:hover {
  transform: translateY(-2px);
}

.model-card__image {
  width: 100%;
  height: 200px;
  overflow: hidden;
}

.model-card__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.model-card__info {
  padding: 16px;
  flex: 1;
}

.model-card__title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #333;
}

.model-card__dimensions {
  color: #666;
  font-size: 14px;
  margin: 0 0 8px 0;
}

.model-card__date {
  color: #999;
  font-size: 12px;
  margin: 0;
}

.model-card__actions {
  display: flex;
  gap: 8px;
  padding: 16px;
  border-top: 1px solid #eee;
}
```

### Работа с Three.js

**Пример: Пользовательский 3D компонент**

```javascript
// components/Custom3DViewer.js
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Box } from '@react-three/drei';
import * as THREE from 'three';

function AnimatedBox({ position }) {
  const meshRef = useRef();

  useFrame((state) => {
    meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.2;
    meshRef.current.rotation.y += 0.01;
  });

  return (
    <Box ref={meshRef} position={position} args={[1, 1, 1]}>
      <meshStandardMaterial color="orange" />
    </Box>
  );
}

const Custom3DViewer = () => {
  return (
    <div style={{ width: '100%', height: '400px' }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />

        <AnimatedBox position={[0, 0, 0]} />

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={1}
          maxDistance={10}
        />
      </Canvas>
    </div>
  );
};

export default Custom3DViewer;
```

### API интеграция

**Пример сервиса API:**

```javascript
// services/api.js
const API_BASE = process.env.REACT_APP_BACKEND_URL || window.location.origin;

class APIService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Генерация модели
  async generateModel(imageFile, dimensions = null) {
    const formData = new FormData();
    formData.append('image', imageFile);

    if (dimensions) {
      formData.append('dimensions', JSON.stringify(dimensions));
    }

    return this.request('/api/generation/upload', {
      method: 'POST',
      body: formData,
      headers: {} // Не устанавливаем Content-Type для FormData
    });
  }

  // Получение статуса
  async getTaskStatus(taskId) {
    return this.request(`/api/generation/status/${taskId}`);
  }

  // Получение моделей
  async getModels(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/api/models${queryString ? `?${queryString}` : ''}`);
  }

  // Скачивание модели
  async downloadModel(model) {
    const url = `${API_BASE}${model.modelUrl}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to download model');
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `${model.name || 'model'}.glb`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);
  }
}

export const apiService = new APIService();
```

### State management

**Пример: Кастомный хук для моделей**

```javascript
// hooks/useModels.js
import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';

export const useModels = () => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchModels = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getModels(params);
      setModels(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteModel = useCallback(async (modelId) => {
    try {
      await apiService.request(`/api/models/${modelId}`, {
        method: 'DELETE'
      });

      setModels(prev => prev.filter(model => model.id !== modelId));
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  return {
    models,
    loading,
    error,
    fetchModels,
    deleteModel,
    refresh: () => fetchModels()
  };
};
```

---

## 🗄️ База данных

### Структура PostgreSQL

```sql
-- Основная таблица для 3D моделей
CREATE TABLE models_3d (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL DEFAULT 'Untitled Model',
    description TEXT,
    model_url TEXT NOT NULL,
    glb_file BYTEA,  -- PostgreSQL BLOB для GLB файлов
    preview_image_url TEXT,
    original_image_url TEXT,
    dimensions JSONB,
    task_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    metadata JSONB,
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для производительности
CREATE INDEX idx_models_3d_user_id ON models_3d(user_id);
CREATE INDEX idx_models_3d_status ON models_3d(status);
CREATE INDEX idx_models_3d_created_at ON models_3d(created_at DESC);
CREATE INDEX idx_models_3d_task_id ON models_3d(task_id);
```

### Sequelize модели

**Пример расширенной модели:**

```javascript
// models/Model3D.js
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
    defaultValue: 'Untitled Model',
    validate: {
      len: [1, 255]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 2000]
    }
  },
  modelUrl: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isUrl: true
    }
  },
  glbFile: {
    type: DataTypes.BLOB('long'), // PostgreSQL BYTEA
    allowNull: true
  },
  previewImageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  originalImageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  dimensions: {
    type: DataTypes.JSONB,
    allowNull: true,
    validate: {
      isValidDimensions(value) {
        if (value && (!value.length || !value.width || !value.height)) {
          throw new Error('Dimensions must include length, width, and height');
        }
      }
    }
  },
  taskId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  status: {
    type: DataTypes.ENUM('active', 'archived', 'deleted'),
    defaultValue: 'active',
    allowNull: false
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true
  }
}, {
  tableName: 'models_3d',
  timestamps: true,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['status']
    },
    {
      fields: ['createdAt']
    },
    {
      fields: ['taskId'],
      unique: true,
      where: {
        taskId: {
          [sequelize.Sequelize.Op.ne]: null
        }
      }
    }
  ]
});

// Виртуальные поля
Model3D.prototype.getFileSize = function() {
  return this.glbFile ? this.glbFile.length : 0;
};

Model3D.prototype.getFormattedDimensions = function() {
  if (!this.dimensions) return null;

  const { length, width, height, unit } = this.dimensions;
  return `${length} × ${width} × ${height} ${unit}`;
};

module.exports = Model3D;
```

### Миграции и обновления

**Создание миграции:**

```javascript
// migrations/001-create-models-table.js
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('models_3d', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'Untitled Model'
      },
      // ... другие поля
    });

    // Создание индексов
    await queryInterface.addIndex('models_3d', ['userId']);
    await queryInterface.addIndex('models_3d', ['createdAt']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('models_3d');
  }
};
```

**Запуск миграций:**
```bash
# Через Sequelize CLI
npx sequelize-cli db:migrate

# Или через npm script
npm run migrate
```

---

## 🧪 Тестирование

### Backend тесты

**Установка Jest и Supertest:**

```bash
cd backend
npm install --save-dev jest supertest
```

**Пример теста API:**

```javascript
// tests/api.test.js
const request = require('supertest');
const app = require('../server');

describe('API Tests', () => {
  test('GET /api should return API info', async () => {
    const response = await request(app)
      .get('/api')
      .expect(200);

    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('status', 'running');
  });

  test('POST /api/generation/upload without image should fail', async () => {
    const response = await request(app)
      .post('/api/generation/upload')
      .expect(400);

    expect(response.body.error).toBeDefined();
  });
});
```

**Запуск тестов:**
```bash
npm test
```

### Frontend тесты

**Пример компонента теста:**

```javascript
// src/components/ModelCard.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ModelCard from './ModelCard';

const mockModel = {
  id: '1',
  name: 'Test Model',
  previewImageUrl: '/test-image.jpg',
  dimensions: {
    length: 200,
    width: 100,
    height: 90,
    unit: 'cm'
  },
  createdAt: '2025-01-01T12:00:00Z'
};

test('renders model card correctly', () => {
  render(
    <ModelCard
      model={mockModel}
      onView={jest.fn()}
      onDownload={jest.fn()}
      onDelete={jest.fn()}
    />
  );

  expect(screen.getByText('Test Model')).toBeInTheDocument();
  expect(screen.getByText('200 × 100 × 90 cm')).toBeInTheDocument();
});

test('calls onView when view button is clicked', () => {
  const onView = jest.fn();
  render(<ModelCard model={mockModel} onView={onView} onDownload={jest.fn()} onDelete={jest.fn()} />);

  fireEvent.click(screen.getByText('Просмотр'));
  expect(onView).toHaveBeenCalledWith('1');
});
```

**E2E тесты с Cypress:**

```javascript
// cypress/integration/model-generation.spec.js
describe('Model Generation', () => {
  it('should generate 3D model from uploaded image', () => {
    // Загрузка изображения
    cy.visit('/');
    cy.get('input[type="file"]').selectFile('cypress/fixtures/test-image.jpg');

    // Заполнение настроек
    cy.get('#model-name').type('Test Model');
    cy.get('#length').type('200');
    cy.get('#width').type('100');
    cy.get('#height').type('90');

    // Генерация
    cy.get('button').contains('Создать 3D модель').click();

    // Проверка статуса
    cy.get('.status-card').should('contain', 'Генерация в процессе');

    // Ожидание завершения (мок)
    cy.get('.status-card').should('contain', 'Готово');
  });
});
```

---

## 🚀 Деплой

### Railway (Основной способ)

**Подготовка:**
```bash
# Убедитесь что все зависимости установлены
cd backend && npm install --production
cd ../frontend && npm install --production && npm run build

# Проверьте .env файл
cat backend/.env
```

**Деплой:**
```bash
# Установка Railway CLI
npm install -g @railway/cli

# Авторизация
railway login

# Создание проекта
railway init

# Настройка переменных окружения в Railway Dashboard
railway variables

# Деплой
railway up
```

**Настройка переменных в Railway:**
```env
GENAPI_API_KEY=your_production_key
DATABASE_URL=postgresql://railway:password@host:5432/railway
NODE_ENV=production
```

### Docker

**Dockerfile:**

```dockerfile
FROM node:18-alpine AS builder

# Backend
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install --production

# Frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install --production
COPY frontend/ ./
RUN npm run build

# Production image
FROM node:18-alpine
WORKDIR /app

# Копирование backend
COPY --from=builder /app/backend ./backend/
COPY --from=builder /app/frontend/build ./frontend/build

# Создание директорий
RUN mkdir -p uploads/input uploads/models uploads/temp

# Порты и запуск
EXPOSE 3001
WORKDIR /app/backend
CMD ["npm", "start"]
```

**Сборка и запуск:**
```bash
# Сборка
docker build -t photo-to-3d .

# Запуск
docker run -p 3001:3001 \
  -e GENAPI_API_KEY=your_key \
  -e DATABASE_URL=your_db_url \
  photo-to-3d
```

---

## 🐛 Отладка

### Backend отладка

**Логи сервера:**
```javascript
// Включение подробного логирования
console.log('📥 Запрос:', req.method, req.path);
console.log('📦 Параметры:', req.params);
console.log('🔍 Query:', req.query);
console.log('📄 Body:', req.body);

// Логирование ошибок
console.error('❌ Ошибка:', error);
console.error('🔍 Stack:', error.stack);
```

**Отладка Sequelize:**
```javascript
// Включение SQL логов
const sequelize = new Sequelize(connectionString, {
  logging: console.log, // Показывать все SQL запросы
  // или для конкретных запросов
  logging: (sql, timing) => {
    console.log('⏱️ SQL:', sql);
    console.log('⏱️ Время:', timing, 'ms');
  }
});
```

**Отладка GenAPI:**
```javascript
// Подробное логирование API вызовов
const response = await axios.post(url, data, {
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  timeout: 30000,
  onUploadProgress: (progressEvent) => {
    console.log('📈 Загрузка:', Math.round((progressEvent.loaded * 100) / progressEvent.total), '%');
  }
});

console.log('📥 Ответ API:', response.status);
console.log('📄 Данные ответа:', JSON.stringify(response.data, null, 2));
```

### Frontend отладка

**React DevTools:**
```bash
npm install --save-dev react-devtools
npx react-devtools
```

**Отладка Three.js:**
```javascript
// Включение отладки Three.js
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.debug.checkShaderErrors = true;

// Логирование объектов сцены
console.log('📦 Объекты в сцене:', scene.children);
console.log('📐 Bounding box:', box);
console.log('🎯 Центр:', center);
```

**Профилирование производительности:**
```javascript
// Измерение времени выполнения
console.time('Генерация модели');
await generateModel();
console.timeEnd('Генерация модели');

// Профилирование компонентов
import { Profiler } from 'react';
<Profiler id="ModelViewer" onRender={onRenderCallback}>
  <ModelViewer />
</Profiler>
```

### Мониторинг production

**Health check эндпоинты:**
```javascript
// server.js
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

app.get('/api/health/database', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});
```

**Логи в production:**
```bash
# Railway логи
railway logs

# Docker логи
docker logs photo-to-3d

# PM2 логи (если используется)
pm2 logs
```

---

## 📈 Производительность

### Оптимизации Backend

**База данных:**
- Индексы на часто запрашиваемые поля
- Connection pooling (Sequelize pool)
- Оптимизированные запросы

**Файлы:**
- Сжатие GLB файлов
- Ленивая загрузка
- Кэширование статических файлов

**API:**
- Rate limiting
- Response compression
- Pagination для больших списков

### Оптимизации Frontend

**React:**
- React.memo для предотвращения ре-рендеров
- useCallback и useMemo для функций
- Code splitting (lazy loading)

**Three.js:**
- LOD (Level of Detail)
- Instancing для повторяющихся объектов
- Texture compression

**Assets:**
- Изображения: WebP формат
- 3D модели: Оптимизация геометрии
- Кэширование: Service Workers

### Мониторинг

**Метрики:**
```javascript
// server.js
app.get('/metrics', (req, res) => {
  res.json({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    modelsCount: await Model3D.count(),
    databaseConnections: sequelize.connectionManager.pool.size
  });
});
```

---

## 🔒 Безопасность

### Валидация данных

**Backend:**
```javascript
// Валидация входных данных
const { body, params } = require('express-validator');

router.post('/models', [
  body('name').trim().isLength({ min: 1, max: 255 }),
  body('dimensions').optional().isObject(),
  body('dimensions.length').optional().isNumeric(),
  // ... другие валидации
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // Обработка запроса
});
```

**Frontend:**
```javascript
// Валидация форм
const validateModelSettings = (settings) => {
  const errors = {};

  if (!settings.name || settings.name.trim().length < 1) {
    errors.name = 'Название обязательно';
  }

  if (settings.dimensions) {
    const { length, width, height } = settings.dimensions;
    if (length <= 0 || width <= 0 || height <= 0) {
      errors.dimensions = 'Размеры должны быть положительными';
    }
  }

  return errors;
};
```

### Аутентификация (для будущего)

**JWT токены:**
```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Токен не предоставлен' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Неверный токен' });
    }
    req.user = user;
    next();
  });
};
```

---

## 📚 Полезные ресурсы

### Документация
- [Express.js](https://expressjs.com/) - Backend фреймворк
- [React](https://react.dev/) - UI библиотека
- [Three.js](https://threejs.org/) - 3D графика
- [Sequelize](https://sequelize.org/) - ORM для Node.js
- [Railway](https://railway.app/) - Платформа деплоя

### AI и 3D
- [GenAPI Documentation](https://gen-api.ru/docs) - AI генерация
- [Trellis Model](https://github.com/microsoft/TRELLIS) - 3D из изображений
- [Three.js Examples](https://threejs.org/examples/) - Примеры 3D

### Разработка
- [React DevTools](https://react.dev/learn/react-developer-tools) - Отладка React
- [Postman](https://www.postman.com/) - Тестирование API
- [Sequelize CLI](https://github.com/sequelize/cli) - Миграции БД

---

*📝 Последнее обновление: 25 октября 2025 | Версия руководства: 3.0*
