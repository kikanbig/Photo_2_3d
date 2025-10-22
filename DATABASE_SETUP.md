# Настройка базы данных PostgreSQL

## Локальная разработка

### 1. Установка PostgreSQL

**MacOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Linux:**
```bash
sudo apt-get install postgresql
sudo service postgresql start
```

**Windows:**
Скачайте установщик с официального сайта: https://www.postgresql.org/download/windows/

### 2. Создание базы данных

```bash
# Войти в PostgreSQL
psql postgres

# Создать базу данных
CREATE DATABASE photo_to_3d;

# Создать пользователя (опционально)
CREATE USER photo_to_3d_user WITH PASSWORD 'your_password';

# Выдать права
GRANT ALL PRIVILEGES ON DATABASE photo_to_3d TO photo_to_3d_user;

# Выход
\q
```

### 3. Настройка переменных окружения

Добавьте в `.env` файл:

```env
DATABASE_URL=postgresql://localhost:5432/photo_to_3d
# или с пользователем и паролем:
# DATABASE_URL=postgresql://photo_to_3d_user:your_password@localhost:5432/photo_to_3d
```

### 4. Запуск приложения

При первом запуске Sequelize автоматически создаст все таблицы:

```bash
cd backend
npm start
```

## Развёртывание на Railway

### 1. Создание PostgreSQL базы данных

1. Откройте ваш проект на Railway
2. Нажмите **"+ New"** → **"Database"** → **"PostgreSQL"**
3. Railway автоматически создаст базу данных и сгенерирует `DATABASE_URL`

### 2. Подключение к сервису

1. В настройках вашего сервиса (не БД) перейдите в **"Variables"**
2. Railway автоматически добавит `DATABASE_URL` из подключенной БД
3. Убедитесь, что переменная `NODE_ENV=production` установлена

### 3. Автоматическая миграция

При деплое на Railway, база данных автоматически синхронизируется при запуске сервера.

## Структура базы данных

### Таблица: `models_3d`

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID | Уникальный ID модели (PK) |
| name | STRING | Название модели |
| description | TEXT | Описание модели |
| modelUrl | STRING | URL GLB файла модели |
| previewImageUrl | TEXT | URL превью изображения |
| originalImageUrl | TEXT | URL исходного изображения |
| dimensions | JSONB | Размеры для AR (length, width, height, unit) |
| taskId | STRING | ID задачи генерации |
| status | ENUM | Статус: active, archived, deleted |
| metadata | JSONB | Дополнительные данные |
| userId | UUID | ID пользователя (для будущего) |
| createdAt | TIMESTAMP | Дата создания |
| updatedAt | TIMESTAMP | Дата обновления |

### Индексы

- `userId` - для быстрого поиска моделей пользователя
- `status` - для фильтрации по статусу
- `createdAt` - для сортировки по дате

## API эндпоинты

### GET `/api/models`
Получить все модели

**Query параметры:**
- `status` - фильтр по статусу (по умолчанию: `active`)
- `limit` - количество записей (по умолчанию: `100`)
- `offset` - смещение для пагинации (по умолчанию: `0`)

### GET `/api/models/:id`
Получить одну модель по ID

### POST `/api/models`
Создать новую модель

**Body:**
```json
{
  "name": "My Model",
  "description": "Model description",
  "modelUrl": "https://...",
  "previewImageUrl": "https://...",
  "dimensions": {
    "length": 100,
    "width": 100,
    "height": 100,
    "unit": "mm"
  }
}
```

### PUT `/api/models/:id`
Обновить модель

### DELETE `/api/models/:id`
Удалить модель (soft delete)

**Query параметры:**
- `hard=true` - жёсткое удаление из БД

### GET `/api/models/search?q=query`
Поиск моделей по названию и описанию

## Миграция с localStorage на PostgreSQL

Если у вас есть модели в localStorage, они автоматически останутся в браузере. Новые модели будут сохраняться в PostgreSQL.

Чтобы перенести старые модели:

1. Откройте консоль браузера
2. Выполните:
```javascript
const oldModels = JSON.parse(localStorage.getItem('savedModels') || '[]');
console.log(oldModels); // Скопируйте данные
```
3. Используйте POST `/api/models` для каждой модели

## Резервное копирование

### Экспорт базы данных

```bash
pg_dump -U postgres photo_to_3d > backup.sql
```

### Импорт базы данных

```bash
psql -U postgres photo_to_3d < backup.sql
```

## Мониторинг

Railway предоставляет встроенный мониторинг базы данных:
- CPU usage
- Memory usage
- Disk usage
- Active connections

Доступ через вкладку **"Metrics"** в панели БД.

## Troubleshooting

### Ошибка подключения к БД

1. Проверьте `DATABASE_URL` в переменных окружения
2. Убедитесь, что PostgreSQL запущен
3. Проверьте права доступа пользователя

### Таблицы не создаются

1. Проверьте логи сервера при запуске
2. Убедитесь, что Sequelize синхронизация включена
3. Попробуйте очистить БД и перезапустить сервер

### SSL ошибки на Railway

Railway требует SSL подключение. Убедитесь, что в `config/database.js`:
```javascript
dialectOptions: {
  ssl: process.env.NODE_ENV === 'production' ? {
    require: true,
    rejectUnauthorized: false
  } : false
}
```

