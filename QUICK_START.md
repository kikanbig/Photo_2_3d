# 🚀 Быстрый старт - Photo to 3D v3.0

## 🎯 Что это?

**Photo to 3D** - полнофункциональное веб-приложение для генерации 3D моделей из фотографий с использованием ИИ. Версия 3.0 включает авто-масштабирование, AR поддержку, управление коллекцией моделей и современный UI.

---

## 🖥️ Локальный запуск

### Предварительные требования
- ✅ **Node.js** 18+ ([скачать](https://nodejs.org/))
- ✅ **PostgreSQL** 13+ (или используйте Railway БД)
- ✅ **GenAPI аккаунт** ([зарегистрироваться](https://gen-api.ru/))
- ✅ **Git** для клонирования репозитория

### 1. Клонирование проекта

```bash
git clone https://github.com/kikanbig/Photo_2_3d.git
cd Photo_to_3D
```

### 2. Backend настройка

```bash
# Установка зависимостей
cd backend
npm install

# Создание .env файла
cat > .env << EOL
# GenAPI настройки (ОБЯЗАТЕЛЬНО получите ключ на gen-api.ru)
GENAPI_API_KEY=your_api_key_here
GENAPI_BASE_URL=https://gen-api.ru/api/v1

# Сервер
PORT=3001
NODE_ENV=development

# Файлы
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_DIR=uploads

# Frontend
FRONTEND_URL=http://localhost:3000

# База данных (для development используйте Railway PostgreSQL)
DATABASE_URL=postgresql://username:password@localhost:5432/photo_to_3d
EOL

# Создание директорий
mkdir -p uploads/input uploads/models uploads/temp

# Запуск backend
npm start
```

### 3. Frontend настройка

```bash
# В новом терминале
cd frontend
npm install

# Создание .env файла
echo "REACT_APP_BACKEND_URL=http://localhost:3001" > .env

# Запуск frontend
npm start
```

### 4. Проверка работоспособности

```bash
# Проверка backend API
curl http://localhost:3001/api

# Проверка frontend
curl http://localhost:3000

# Доступ к приложению
open http://localhost:3000
```

**🎉 Готово!** Приложение доступно по адресу: **http://localhost:3000**

---

## 🌐 Production на Railway (Рекомендуется)

### Автоматический деплой

1. **Создайте аккаунт** на [Railway](https://railway.app/)

2. **Подключите GitHub репозиторий:**
```bash
# Установка Railway CLI
npm install -g @railway/cli
railway login

# Создание проекта
railway init

# Деплой
railway up
```

3. **Настройте переменные окружения** в Railway Dashboard:
```env
GENAPI_API_KEY=your_production_key
DATABASE_URL=postgresql://railway:password@host:5432/railway
NODE_ENV=production
```

4. **Готово!** Приложение доступно по адресу: **https://your-app.railway.app**

---

## 📱 Использование приложения

### 1. Создание 3D модели

1. **📸 Загрузка фото**
   - Перетащите изображение в зону загрузки
   - Или нажмите для выбора файла
   - Поддержка: JPG, PNG, GIF, WebP до 10MB

2. **🏷️ Настройка**
   - Введите название модели
   - Укажите реальные размеры (длина × ширина × высота)
   - Выберите единицы (мм/см)

3. **⚡ Генерация**
   - Нажмите "Создать 3D модель"
   - Ожидайте 30-60 секунд
   - Следите за прогрессом в реальном времени

4. **🎮 Результат**
   - Автоматически масштабированная 3D модель
   - Интерактивное управление: поворот, зум, перемещение
   - Предварительный просмотр перед сохранением

### 2. Управление моделями

- **📚 Мои модели** - список всех созданных моделей
- **🖼️ Превью** - миниатюры исходных изображений
- **📊 Метаданные** - название, дата, размеры
- **⚙️ Действия** - просмотр, скачивание, удаление

### 3. AR просмотр

1. **📱 QR код** - отсканируйте для мобильного просмотра
2. **🏠 Автоматическое определение** - Scene Viewer (Android) или Quick Look (iOS)
3. **📐 Правильный масштаб** - благодаря указанным размерам

---

## 🎮 Управление 3D сценой

### Базовые элементы управления
- **🖱️ Левая кнопка + перетаскивание** - Поворот модели
- **🖱️ Правая кнопка + перетаскивание** - Перемещение камеры
- **🔄 Колесо мыши** - Масштабирование (зумирование)

### Автоматические функции
- **🎯 Авто-масштабирование** - модель всегда помещается в окно
- **🎯 Центрирование** - модель автоматически центрируется
- **📷 Адаптивная камера** - расстояние и FOV подстраиваются под размер
- **🎮 OrbitControls** - ограничение углов поворота и расстояний

---

## 🔧 Параметры генерации

Приложение использует **максимальные настройки качества**:

| Параметр | Значение | Описание |
|----------|----------|----------|
| `ss_guidance_strength` | 8.5 | Точность следования изображению |
| `ss_sampling_steps` | 50 | Качество формы (максимум) |
| `slat_guidance_strength` | 4 | Детализация геометрии |
| `slat_sampling_steps` | 50 | Проработка деталей (максимум) |
| `mesh_simplify` | 0.98 | Минимальное упрощение |
| `texture_size` | 2048 | 2K текстуры |

**Результат:** Максимальное качество при разумном времени генерации (3-5 минут)

---

## 🚨 Troubleshooting

### Ошибка "Model not found" (500)
**Проблема:** Модель не загружается
**Решение:**
```bash
# Проверьте логи Railway
railway logs

# Убедитесь что модель сохранена в БД
railway run psql $DATABASE_URL -c "SELECT id, name FROM models_3d LIMIT 5;"
```

### Ошибка подключения к БД
**Проблема:** "Не удалось подключиться к базе данных"
**Решение:**
```bash
# Локально
psql -h localhost -U username -d photo_to_3d

# Railway
railway run psql $DATABASE_URL -c "SELECT 1;"
```

### Ошибка GenAPI
**Проблема:** "API ключ не установлен"
**Решение:**
1. Зарегистрируйтесь на [gen-api.ru](https://gen-api.ru/)
2. Получите API ключ в личном кабинете
3. Добавьте в переменные окружения: `GENAPI_API_KEY=your_key`

### Проблемы с 3D отображением
**Проблема:** Модель не отображается или мерцает
**Решение:**
- Проверьте поддержку WebGL: [get.webgl.org](https://get.webgl.org/)
- Используйте Chrome, Firefox или Edge
- Убедитесь что включен JavaScript и аппаратное ускорение

---

## 📊 Технический стек

| Компонент | Технология | Версия |
|-----------|------------|---------|
| **Frontend** | React | 18+ |
| **3D графика** | Three.js + React Three Fiber | Latest |
| **Backend** | Node.js + Express | 18+ |
| **База данных** | PostgreSQL | 13+ |
| **ORM** | Sequelize | 6+ |
| **AI интеграция** | GenAPI + Trellis | Latest |
| **Деплой** | Railway | Latest |
| **Формат 3D** | GLB | Standard |

---

## 📁 Структура проекта

```
Photo_to_3D/
├── 📁 backend/                    # Серверная часть
│   ├── 📁 config/database.js     # PostgreSQL настройка
│   ├── 📁 models/Model3D.js      # Модель 3D объектов
│   ├── 📁 routes/                # API эндпоинты
│   │   ├── generation.js         # Генерация моделей
│   │   ├── models.js             # Управление моделями
│   │   └── users.js              # Пользователи
│   ├── 📁 services/              # Бизнес-логика
│   │   ├── genapi.js             # GenAPI интеграция
│   │   └── glb-scaler.js         # Масштабирование GLB
│   ├── 📁 uploads/               # Загруженные файлы
│   ├── server.js                 # Главный сервер
│   └── package.json
│
├── 📁 frontend/                  # Клиентская часть
│   ├── 📁 public/                # Статические файлы
│   ├── 📁 src/
│   │   ├── 📁 components/         # React компоненты
│   │   │   ├── ModelViewer.js    # 3D просмотрщик
│   │   │   ├── ImageUpload.js    # Загрузка изображений
│   │   │   ├── ModelSettings.js  # Настройки модели
│   │   │   └── StatusCard.js     # Статус генерации
│   │   ├── 📁 pages/             # Страницы
│   │   │   ├── Home.js           # Главная страница
│   │   │   ├── MyModels.js       # Коллекция моделей
│   │   │   └── ARView.js         # AR просмотр
│   │   ├── 📁 services/api.js    # HTTP клиент
│   │   ├── App.js                # Главный компонент
│   │   └── index.js
│   ├── package.json
│   └── build/                    # Production сборка
│
├── 📄 railway.toml               # Railway конфигурация
├── 📄 README.md                  # Полная документация
├── 📄 API.md                     # API документация
├── 📄 ARCHITECTURE.md           # Архитектура системы
├── 📄 DEPLOYMENT.md             # Инструкции по деплою
├── 📄 CHANGELOG.md              # История изменений
└── 📄 QUALITY_SETTINGS.md       # Настройки качества
```

---

## 🤝 Поддержка

### Создание Issue
Если нашли ошибку или хотите предложить улучшение:
1. Перейдите в [GitHub Issues](https://github.com/kikanbig/Photo_2_3d/issues)
2. Нажмите "New Issue"
3. Опишите проблему с шагами воспроизведения
4. Прикрепите скриншоты при необходимости

### Контакты
- **GitHub:** [kikanbig/Photo_2_3d](https://github.com/kikanbig/Photo_2_3d)
- **Railway:** [photo23d-production.up.railway.app](https://photo23d-production.up.railway.app/)
- **Версия:** 3.0 (Стабильная)
- **Обновлено:** 25 октября 2025

---

**🎉 Добро пожаловать в Photo to 3D!**

*Это полнофункциональное веб-приложение готовое к production использованию. Наслаждайтесь генерацией 3D моделей из ваших фотографий!*