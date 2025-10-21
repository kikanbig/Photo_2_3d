# Photo to 3D - Генерация 3D моделей из фотографий

Веб-приложение для создания 3D моделей из фотографий с использованием ИИ через GenAPI и Trellis.

## 🚀 Возможности

- 📸 Загрузка изображений (JPG, PNG, GIF, WebP)
- 🤖 Генерация 3D моделей с помощью Trellis AI
- 👀 3D просмотрщик с интерактивным управлением
- 💾 Скачивание готовых моделей в формате GLB
- 📱 Адаптивный дизайн для всех устройств
- ⚡ Асинхронная обработка с отслеживанием статуса

## 🛠 Технологии

### Backend
- Node.js + Express
- GenAPI интеграция
- Multer для загрузки файлов
- Long-polling для отслеживания задач

### Frontend
- React 18
- Three.js + React Three Fiber
- Lucide React для иконок
- CSS3 с градиентами и анимациями

## 📦 Установка и запуск

### 1. Клонирование репозитория
```bash
git clone <repository-url>
cd Photo_to_3D
```

### 2. Настройка Backend

```bash
cd backend
npm install
```

Создайте файл `.env` в папке `backend`:
```env
GENAPI_API_KEY=your_api_key_here
GENAPI_BASE_URL=https://gen-api.ru/api/v1
PORT=3001
NODE_ENV=development
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads
FRONTEND_URL=http://localhost:3000
```

Запуск backend:
```bash
npm start
# или для разработки
npm run dev
```

### 3. Настройка Frontend

```bash
cd frontend
npm install
```

Запуск frontend:
```bash
npm start
```

Приложение будет доступно по адресу: http://localhost:3000

## 🔧 API Endpoints

### Backend API

- `POST /api/generation/upload` - Загрузка изображения и запуск генерации
- `GET /api/generation/status/:taskId` - Проверка статуса задачи
- `GET /api/generation/download/:taskId` - Скачивание готовой 3D модели
- `GET /api/generation/user-info` - Информация о пользователе GenAPI

## 📱 Использование

1. **Загрузка изображения**: Перетащите файл в область загрузки или нажмите для выбора
2. **Генерация**: Нажмите "Создать 3D модель" для запуска процесса
3. **Ожидание**: Следите за прогрессом генерации (обычно 30-60 секунд)
4. **Просмотр**: Интерактивно изучайте 3D модель в браузере
5. **Скачивание**: Скачайте готовую модель в формате GLB

## 🎮 Управление 3D моделью

- **ЛКМ + перетаскивание** - Поворот модели
- **ПКМ + перетаскивание** - Перемещение камеры
- **Колесо мыши** - Масштабирование

## 🚀 Развертывание на Railway

1. Установите Railway CLI:
```bash
npm install -g @railway/cli
```

2. Войдите в аккаунт:
```bash
railway login
```

3. Создайте проект:
```bash
railway init
```

4. Настройте переменные окружения в Railway Dashboard

5. Разверните:
```bash
railway up
```

## 📁 Структура проекта

```
Photo_to_3D/
├── backend/
│   ├── routes/
│   │   ├── generation.js
│   │   └── users.js
│   ├── services/
│   │   └── genapi.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ImageUpload.js
│   │   │   ├── ModelViewer.js
│   │   │   ├── LoadingSpinner.js
│   │   │   └── StatusCard.js
│   │   ├── App.js
│   │   └── App.css
│   └── package.json
└── README.md
```

## 🔮 Планы развития

- [ ] Система пользователей и личные кабинеты
- [ ] Интеграция дополнительных 3D сервисов
- [ ] Система оплаты и подписок
- [ ] История генераций
- [ ] Пакетная обработка
- [ ] API для мобильных приложений

## 📄 Лицензия

MIT License

## 🤝 Поддержка

Если у вас возникли вопросы или проблемы, создайте issue в репозитории.

---

**Создано с ❤️ для превращения фотографий в 3D модели**
