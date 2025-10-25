# 📸 Photo to 3D - Генерация 3D моделей из фотографий

## 🎉 Версия 3.1 - Стабильная версия с исправлениями превью изображений

Веб-приложение для создания 3D моделей из фотографий с использованием ИИ через **GenAPI** и **Trellis**. Полнофункциональное решение с интерактивным 3D просмотром, управлением моделями и AR поддержкой.

![Photo to 3D](https://img.shields.io/badge/Status-Stable%203.1-brightgreen) ![Node.js](https://img.shields.io/badge/Node.js-18+-green) ![React](https://img.shields.io/badge/React-18+-blue) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Required-blue)

---

## 🚀 Ключевые возможности

### ✨ Основной функционал
- 📸 **Загрузка изображений** (JPG, PNG, GIF, WebP до 10MB)
- 🤖 **Генерация 3D моделей** с помощью Trellis AI
- 👀 **Интерактивный 3D просмотр** с авто-масштабированием
- 💾 **Скачивание моделей** в формате GLB
- 📱 **Адаптивный дизайн** для всех устройств
- ⚡ **Асинхронная обработка** с реал-тайм статусом

### 🎮 Расширенные функции
- 🏠 **AR просмотр** на мобильных устройствах (Scene Viewer / Quick Look)
- 📐 **Настройка размеров** для правильного масштаба в AR
- 🏷️ **Именование моделей** перед сохранением
- 📚 **Управление коллекцией** - список всех созданных моделей с превью изображений
- 🔄 **Авто-подгонка размера** - модели всегда помещаются в окно
- 🎯 **Умное позиционирование** - центрирование и нормализация масштаба
- 🖼️ **Полные превью фото** - изображения полностью видны без обрезки

---

## 🏗️ Архитектура системы

### Backend (Node.js + Express)
```mermaid
graph TB
    A[Express Server] --> B[PostgreSQL Database]
    A --> C[GenAPI Integration]
    A --> D[File Storage]
    C --> E[Trellis AI Engine]
    D --> F[/uploads/input - Images]
    D --> G[/uploads/models - 3D Models]
```

### Frontend (React + Three.js)
```mermaid
graph TB
    A[React App] --> B[Three.js Canvas]
    A --> C[Model Viewer]
    A --> D[AR Integration]
    B --> E[Auto-scaling]
    B --> F[Orbit Controls]
    C --> G[@google/model-viewer]
    D --> H[QR Code Generation]
```

---

## 🛠️ Технологический стек

### Backend
- **Node.js** 18+ - Серверная платформа
- **Express.js** - Web фреймворк
- **PostgreSQL** - Реляционная база данных
- **Sequelize ORM** - Работа с БД
- **Multer** - Обработка файлов
- **Axios** - HTTP клиент для GenAPI
- **fs-extra** - Расширенная файловая система

### Frontend
- **React** 18+ - UI библиотека
- **React Router** - Навигация
- **Three.js** - 3D графика
- **React Three Fiber** - React рендерер для Three.js
- **React Three Drei** - Утилиты для 3D (OrbitControls, Environment)
- **Google Model Viewer** - AR просмотр
- **Lucide React** - Иконки
- **QR Code React** - Генерация QR кодов

### AI & 3D Processing
- **GenAPI** - Платформа для AI генерации
- **Trellis** - Специализированная модель для 3D из изображений
- **GLB** - Стандартный формат 3D моделей

---

## 📦 Установка и запуск

### Предварительные требования
- Node.js 18+
- PostgreSQL база данных
- GenAPI аккаунт и API ключ

### 1. Клонирование и установка

```bash
# Клонирование репозитория
git clone <repository-url>
cd Photo_to_3D

# Установка зависимостей backend
cd backend
npm install

# Установка зависимостей frontend
cd ../frontend
npm install
```

### 2. Конфигурация backend

Создайте `.env` файл в папке `backend/`:

```env
# GenAPI настройки (ОБЯЗАТЕЛЬНО)
GENAPI_API_KEY=your_api_key_here
GENAPI_BASE_URL=https://gen-api.ru/api/v1

# Сервер
PORT=3001
NODE_ENV=development

# Загрузки
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_DIR=uploads

# Frontend URL (для production)
FRONTEND_URL=http://localhost:3000

# База данных
DATABASE_URL=postgresql://username:password@localhost:5432/photo_to_3d
```

### 3. Конфигурация базы данных

Установите PostgreSQL и создайте базу данных:

```sql
CREATE DATABASE photo_to_3d;
GRANT ALL PRIVILEGES ON DATABASE photo_to_3d TO your_username;
```

### 4. Запуск

```bash
# Запуск backend (порт 3001)
cd backend
npm start

# Запуск frontend (порт 3000) - в новом терминале
cd frontend
npm start
```

Приложение доступно по адресу: **http://localhost:3000**

---

## 🔧 API документация

### Основные эндпоинты

#### Генерация моделей
- `POST /api/generation/upload` - Загрузка изображения и запуск генерации
- `GET /api/generation/status/:taskId` - Проверка статуса задачи
- `GET /api/generation/download/:taskId` - Скачивание результата

#### Управление моделями
- `GET /api/models` - Получить все модели пользователя
- `GET /api/models/:id` - Получить конкретную модель
- `GET /api/models/:id/download` - Скачать GLB файл модели
- `POST /api/models` - Сохранить модель в коллекцию
- `DELETE /api/models/:id` - Удалить модель

#### Пользовательские функции
- `GET /api/generation/user-info` - Информация о GenAPI аккаунте

### Параметры генерации

При создании модели можно настроить:

```javascript
{
  // Сила наведения для точности следования изображению (0-10)
  "ss_guidance_strength": 8.5,

  // Количество шагов выборки для качества формы (1-50)
  "ss_sampling_steps": 50,

  // Сила SLAT-наведения для детализации геометрии (0-10)
  "slat_guidance_strength": 4,

  // Количество шагов выборки для проработки деталей (1-50)
  "slat_sampling_steps": 50,

  // Фактор упрощения сетки (0-0.98)
  "mesh_simplify": 0.98,

  // Разрешение текстур в пикселях (512-2048)
  "texture_size": 2048
}
```

---

## 📱 Использование приложения

### 1. Создание 3D модели

1. **Загрузка изображения**
   - Перетащите файл в зону загрузки
   - Или нажмите для выбора из файловой системы
   - Поддерживаемые форматы: JPG, PNG, GIF, WebP
   - Максимальный размер: 10MB

2. **Настройка параметров**
   - Введите название модели
   - Укажите реальные размеры для AR (длина × ширина × высота)
   - Выберите единицы измерения (мм/см)

3. **Генерация**
   - Нажмите "Создать 3D модель"
   - Ожидайте 30-60 секунд
   - Следите за прогрессом в реальном времени

4. **Результат**
   - Автоматически масштабированная 3D модель
   - Интерактивное управление: поворот, масштабирование, перемещение
   - Предварительный просмотр перед сохранением

### 2. Управление коллекцией

- **Мои модели** - список всех созданных моделей
- **Превью** - миниатюры исходных изображений
- **Метаданные** - название, дата создания, размеры
- **Действия** - просмотр, скачивание, удаление

### 3. AR просмотр

1. **QR код** - отсканируйте для мобильного просмотра
2. **Автоматическое определение** - Scene Viewer (Android) или Quick Look (iOS)
3. **Правильный масштаб** - благодаря указанным размерам

---

## 🎮 Управление 3D сценой

### Базовые элементы управления
- **Левая кнопка мыши + перетаскивание** - Поворот модели
- **Правая кнопка мыши + перетаскивание** - Перемещение камеры
- **Колесо мыши** - Масштабирование (зумирование)

### Автоматические функции
- **Авто-масштабирование** - модель всегда помещается в окно
- **Центрирование** - модель автоматически центрируется
- **Адаптивная камера** - расстояние и FOV подстраиваются под размер
- **OrbitControls** - ограничение углов поворота и расстояний

---

## 🚀 Развертывание

### Railway (Рекомендуется)

1. **Установка CLI**
```bash
npm install -g @railway/cli
railway login
```

2. **Инициализация проекта**
```bash
railway init
```

3. **Настройка переменных окружения**
В Railway Dashboard добавьте:
```env
GENAPI_API_KEY=your_api_key
DATABASE_URL=postgresql://...
NODE_ENV=production
```

4. **Деплой**
```bash
railway up
```

### Docker

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY backend/package*.json ./backend/
RUN cd backend && npm install --production
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install --production
COPY . .
RUN cd frontend && npm run build
EXPOSE 3001
CMD ["node", "backend/server.js"]
```

---

## 📁 Структура проекта

```
Photo_to_3D/
├── 📁 backend/                    # Серверная часть
│   ├── 📁 config/
│   │   └── database.js           # Конфигурация PostgreSQL
│   ├── 📁 models/
│   │   └── Model3D.js            # Модель данных для 3D объектов
│   ├── 📁 routes/
│   │   ├── generation.js         # API генерации
│   │   ├── models.js             # API управления моделями
│   │   └── users.js              # API пользователей
│   ├── 📁 services/
│   │   ├── genapi.js             # Интеграция с GenAPI
│   │   └── glb-scaler.js         # Масштабирование GLB файлов
│   ├── 📁 uploads/               # Загруженные файлы
│   │   ├── input/                # Исходные изображения
│   │   ├── models/               # Сгенерированные 3D модели
│   │   └── temp/                 # Временные файлы
│   ├── server.js                 # Главный сервер
│   ├── package.json
│   └── .env.example
│
├── 📁 frontend/                  # Клиентская часть
│   ├── 📁 public/                # Статические файлы
│   ├── 📁 src/
│   │   ├── 📁 components/         # React компоненты
│   │   │   ├── ImageUpload.js    # Загрузка изображений
│   │   │   ├── ModelViewer.js    # 3D просмотрщик
│   │   │   ├── ModelSettings.js  # Настройки модели
│   │   │   ├── LoadingSpinner.js # Индикатор загрузки
│   │   │   ├── StatusCard.js     # Карточка статуса
│   │   │   ├── Sidebar.js        # Боковая панель
│   │   │   ├── Header.js         # Верхняя панель
│   │   │   └── Footer.js         # Подвал
│   │   ├── 📁 pages/             # Страницы приложения
│   │   │   ├── Home.js           # Главная страница
│   │   │   ├── MyModels.js       # Коллекция моделей
│   │   │   ├── ModelView.js      # Просмотр модели
│   │   │   └── ARView.js         # AR просмотр
│   │   ├── 📁 services/
│   │   │   └── api.js            # API клиент
│   │   ├── App.js                # Главный компонент
│   │   ├── App.css               # Глобальные стили
│   │   └── index.js
│   ├── package.json
│   └── build/                    # Сборка для production
│
├── 📄 railway.toml               # Конфигурация деплоя
├── 📄 Dockerfile                 # Docker образ
├── 📄 package.json               # Корневые зависимости
└── 📄 README.md                  # Документация
```

---

## 🔧 Конфигурация

### Backend переменные окружения

| Переменная | Описание | Значение по умолчанию |
|------------|----------|----------------------|
| `GENAPI_API_KEY` | API ключ GenAPI | **ОБЯЗАТЕЛЬНО** |
| `GENAPI_BASE_URL` | Базовый URL GenAPI | `https://gen-api.ru/api/v1` |
| `DATABASE_URL` | URL подключения к PostgreSQL | `postgresql://localhost:5432/photo_to_3d` |
| `PORT` | Порт сервера | `3001` |
| `NODE_ENV` | Окружение | `development` |
| `MAX_FILE_SIZE` | Макс. размер файла | `10485760` (10MB) |
| `UPLOAD_DIR` | Директория загрузок | `uploads` |

### Frontend переменные окружения

| Переменная | Описание | Значение |
|------------|----------|-----------|
| `REACT_APP_BACKEND_URL` | URL backend API | Автоматически |

---

## 📊 База данных

### Основные таблицы

#### models_3d
- `id` - UUID первичный ключ
- `name` - Название модели
- `modelUrl` - URL для скачивания
- `glbFile` - BLOB с GLB файлом
- `previewImageUrl` - URL превью
- `originalImageUrl` - URL исходного изображения
- `dimensions` - JSON с размерами
- `taskId` - ID задачи генерации
- `status` - Статус (active/archived/deleted)
- `metadata` - JSON с метаданными
- `userId` - ID пользователя (для будущего)
- `createdAt`, `updatedAt` - Временные метки

---

## 🚨 Возможные проблемы и решения

### Ошибка "Model not found"
**Проблема:** 500 ошибка при загрузке модели
**Решение:** Проверьте что модель сохранена в БД с правильным `taskId`

### Ошибка подключения к БД
**Проблема:** "Не удалось подключиться к базе данных"
**Решение:**
```bash
# Проверьте подключение
psql -h localhost -U username -d photo_to_3d

# В Railway Dashboard проверьте DATABASE_URL
```

### Ошибка GenAPI
**Проблема:** "API ключ не установлен"
**Решение:**
1. Зарегистрируйтесь на gen-api.ru
2. Получите API ключ
3. Добавьте в .env: `GENAPI_API_KEY=your_key`

### Проблемы с загрузкой файлов
**Проблема:** "Файл слишком большой"
**Решение:** Увеличьте `MAX_FILE_SIZE` в .env

---

## 🔮 Планы развития (Roadmap)

### Короткосрочные (v3.1-3.2)
- [ ] Система пользователей и авторизация
- [ ] История генераций с фильтрацией
- [ ] Пакетная обработка изображений
- [ ] Экспорт в дополнительные форматы (OBJ, STL)

### Среднесрочные (v4.0)
- [ ] REST API для внешних интеграций
- [ ] Мобильное приложение (React Native)
- [ ] Интеграция с другими AI сервисами
- [ ] Система шаблонов и пресетов

### Долгосрочные (v5.0+)
- [ ] WebXR поддержка (VR/AR очки)
- [ ] Коллаборативное редактирование
- [ ] Маркетплейс 3D моделей
- [ ] Интеграция с CAD системами

---

## 📄 Лицензия

**MIT License** - свободное использование с указанием автора

## 🤝 Поддержка и вклад

### Сообщить об ошибке
Создайте [Issue](https://github.com/kikanbig/Photo_2_3d/issues) с:
- Шаги для воспроизведения
- Ожидаемый результат
- Фактический результат
- Логи ошибок

### Предложить улучшение
1. Создайте Feature Request
2. Опишите проблему и решение
3. Прикрепите скриншоты/видео

### Внести вклад
1. Сделайте Fork проекта
2. Создайте Feature Branch
3. Отправьте Pull Request

---

## 📞 Контакты

- **GitHub:** [kikanbig/Photo_2_3d](https://github.com/kikanbig/Photo_2_3d)
- **Railway:** Автоматический деплой из GitHub
- **Версия:** 3.0 (Стабильная)
- **Последнее обновление:** 25 октября 2025

---

**Создано с ❤️ для превращения фотографий в 3D модели**

*Это полнофункциональное веб-приложение готовое к production использованию с современной архитектурой и продуманным UX/UI.*
