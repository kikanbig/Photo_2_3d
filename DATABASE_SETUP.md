# 🗄️ Настройка PostgreSQL - Photo to 3D v3.0

## 🎯 Обзор

Photo to 3D использует **PostgreSQL** для хранения:
- ✅ 3D моделей (GLB файлы как BLOB)
- ✅ Метаданных и настроек
- ✅ Истории генераций
- ✅ Пользовательских данных (для будущего)

**Автоматическое создание таблиц** при первом запуске через Sequelize ORM.

---

## 🖥️ Локальная настройка

### 1. Установка PostgreSQL

#### macOS
```bash
# Через Homebrew
brew install postgresql
brew services start postgresql

# Проверка
brew services list | grep postgres
```

#### Ubuntu/Debian
```bash
# Обновление пакетов
sudo apt update

# Установка PostgreSQL
sudo apt install postgresql postgresql-contrib

# Запуск сервиса
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Проверка статуса
sudo systemctl status postgresql
```

#### Windows
1. Скачайте с [postgresql.org](https://www.postgresql.org/download/windows/)
2. Запустите установщик
3. Установите пароль для пользователя `postgres`
4. Убедитесь что сервис запущен

### 2. Создание базы данных

```bash
# Подключение к PostgreSQL
psql -U postgres

# В psql консоли:
CREATE DATABASE photo_to_3d;
GRANT ALL PRIVILEGES ON DATABASE photo_to_3d TO postgres;
\q
```

**Проверка:**
```bash
psql -U postgres -d photo_to_3d -c "SELECT version();"
```

### 3. Конфигурация подключения

В файле `backend/.env`:

```env
# Локальная разработка
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/photo_to_3d

# Альтернативно (с указанием пользователя)
DATABASE_URL=postgresql://username:password@localhost:5432/photo_to_3d
```

### 4. Тестирование подключения

```bash
# Запуск backend
cd backend
npm start

# Должны увидеть в логах:
# ✅ Подключение к базе данных установлено успешно
# ✅ Модели синхронизированы с базой данных
```

---

## 🚀 Railway PostgreSQL (Рекомендуется)

### Автоматическая настройка

1. **Railway автоматически** создаст PostgreSQL при деплое
2. **DATABASE_URL** автоматически добавится в переменные
3. **SSL включен** по умолчанию для безопасности

### Manual настройка

1. **Создайте базу данных:**
   - Railway Dashboard → **"+ New"** → **"Database"**
   - Выберите **"PostgreSQL"**
   - Дождитесь создания

2. **Подключите к приложению:**
   - В настройках сервиса → **"Variables"**
   - Railway добавит `DATABASE_URL` автоматически
   - Добавьте `NODE_ENV=production`

3. **Проверка:**
```bash
# Тестирование подключения
railway run psql $DATABASE_URL -c "SELECT 1;"

# Проверка таблиц
railway run psql $DATABASE_URL -c "\dt"
```

---

## 📊 Структура базы данных

### Основная таблица: `models_3d`

| Поле | Тип | Описание | Пример |
|------|-----|----------|---------|
| `id` | UUID | Уникальный ID модели | `550e8400-e29b-41d4-a716-446655440000` |
| `name` | STRING | Название модели | `"Моя 3D модель"` |
| `description` | TEXT | Описание | `"Сгенерировано из фото котика"` |
| `modelUrl` | STRING | URL для скачивания | `/api/models/uuid/download` |
| `glbFile` | BLOB | GLB файл (бинарные данные) | `4MB GLB файл` |
| `previewImageUrl` | TEXT | Превью изображения | `/uploads/input/photo.jpg` |
| `originalImageUrl` | TEXT | Исходное изображение | `/uploads/input/original.jpg` |
| `dimensions` | JSONB | Размеры для AR | `{"length":200,"width":100,"height":90,"unit":"cm"}` |
| `taskId` | STRING | ID задачи GenAPI | `"uuid-task-id"` |
| `status` | ENUM | Статус | `active` / `archived` / `deleted` |
| `metadata` | JSONB | Дополнительные данные | `{"generationParams": {...}}` |
| `userId` | UUID | ID пользователя | `null` (для будущего) |
| `createdAt` | TIMESTAMP | Дата создания | `2025-01-01T12:00:00Z` |
| `updatedAt` | TIMESTAMP | Дата обновления | `2025-01-01T12:30:00Z` |

### Вспомогательная таблица: `generation_tasks`

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID | ID задачи |
| `taskId` | STRING | ID в GenAPI |
| `status` | ENUM | processing/completed/failed/timeout |
| `imagePath` | TEXT | Путь к загруженному изображению |
| `options` | JSONB | Параметры генерации |
| `result` | JSONB | Результат от GenAPI |
| `errorMessage` | TEXT | Сообщение об ошибке |

### Индексы для производительности

```sql
-- Быстрый поиск по пользователям
CREATE INDEX CONCURRENTLY idx_models_3d_user_id ON models_3d(user_id);

-- Фильтрация по статусу
CREATE INDEX CONCURRENTLY idx_models_3d_status ON models_3d(status);

-- Сортировка по дате
CREATE INDEX CONCURRENTLY idx_models_3d_created_at ON models_3d(created_at DESC);

-- Поиск по taskId
CREATE INDEX CONCURRENTLY idx_models_3d_task_id ON models_3d(taskId);

-- Полнотекстовый поиск
CREATE INDEX CONCURRENTLY idx_models_3d_name_search ON models_3d USING gin(to_tsvector('russian', name));
```

---

## 🔧 API для работы с моделями

### Получение всех моделей

```bash
GET /api/models
```

**Query параметры:**
- `status` - фильтр (active/archived/deleted)
- `limit` - количество (1-100)
- `offset` - смещение для пагинации
- `userId` - фильтр по пользователю

**Пример запроса:**
```bash
curl "http://localhost:3001/api/models?status=active&limit=10"
```

### Получение конкретной модели

```bash
GET /api/models/:id
```

**Пример ответа:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Котик 3D",
    "modelUrl": "/api/models/uuid-task-id/download",
    "previewImageUrl": "/uploads/input/photo.jpg",
    "dimensions": {
      "length": 200,
      "width": 100,
      "height": 90,
      "unit": "cm"
    },
    "createdAt": "2025-01-01T12:00:00Z"
  }
}
```

### Создание модели

```bash
POST /api/models
```

**Body:**
```json
{
  "name": "Моя модель",
  "description": "Описание",
  "modelUrl": "/api/models/uuid/download",
  "previewImageUrl": "/uploads/input/preview.jpg",
  "originalImageUrl": "/uploads/input/original.jpg",
  "dimensions": {
    "length": 200,
    "width": 100,
    "height": 90,
    "unit": "cm"
  },
  "taskId": "uuid-task-id",
  "metadata": {
    "generationParams": {
      "ss_guidance_strength": 8.5,
      "texture_size": 2048
    }
  }
}
```

### Удаление модели

```bash
DELETE /api/models/:id
```

**Мягкое удаление** - модель помечается как `deleted`, но остается в БД.

**Жесткое удаление:**
```bash
DELETE /api/models/:id?hard=true
```

---

## 🔄 Миграции и обновления

### Автоматические миграции

Sequelize автоматически создает и обновляет таблицы:

```javascript
// config/database.js
const syncDatabase = async () => {
  try {
    // alter: true - безопасное изменение существующих таблиц
    await sequelize.sync({ alter: true });
    console.log('✅ Модели синхронизированы с базой данных');
  } catch (error) {
    console.error('❌ Ошибка синхронизации:', error.message);
  }
};
```

### Manual миграции

**Добавление нового поля:**
```bash
# Через psql
psql $DATABASE_URL -c "ALTER TABLE models_3d ADD COLUMN IF NOT EXISTS rating INTEGER DEFAULT 0;"

# Через Sequelize CLI (если настроен)
npx sequelize-cli migration:generate --name add-rating-to-models
```

**Изменение типа поля:**
```bash
# В production лучше использовать миграции
psql $DATABASE_URL -c "ALTER TABLE models_3d ALTER COLUMN name TYPE VARCHAR(255);"
```

---

## 💾 Резервное копирование

### Railway автоматическое бэкап

Railway создает ежедневные резервные копии:

```bash
# Создание резервной копии
railway run pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Список автоматических бэкапов
railway volumes
```

### Local бэкап

```bash
# Экспорт всей базы
pg_dump -U postgres -h localhost photo_to_3d > photo_to_3d_backup.sql

# Экспорт только данных
pg_dump -U postgres -h localhost --data-only photo_to_3d > data_backup.sql

# Экспорт только структуры
pg_dump -U postgres -h localhost --schema-only photo_to_3d > schema_backup.sql
```

### Восстановление

```bash
# Восстановление в локальную БД
psql -U postgres photo_to_3d < photo_to_3d_backup.sql

# Восстановление в Railway
railway run psql $DATABASE_URL < backup.sql
```

### Планы бэкапа

**Рекомендуемый план:**
- **Ежедневно** - автоматические бэкапы Railway
- **Еженедельно** - полный бэкап с файлами
- **Ежемесячно** - проверка восстановления

---

## 📈 Мониторинг и оптимизация

### Метрики производительности

```sql
-- Размер базы данных
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Статистика по моделям
SELECT
    status,
    COUNT(*) as count,
    AVG(LENGTH(glb_file)) as avg_size_bytes,
    pg_size_pretty(AVG(LENGTH(glb_file))) as avg_size
FROM models_3d
GROUP BY status;

-- Самые большие модели
SELECT
    name,
    pg_size_pretty(LENGTH(glb_file)) as file_size,
    created_at
FROM models_3d
ORDER BY LENGTH(glb_file) DESC
LIMIT 10;
```

### Оптимизация

**VACUUM для очистки:**
```sql
-- Обычная очистка
VACUUM models_3d;

-- Полная очистка с пересозданием индексов
VACUUM FULL models_3d;
```

**REINDEX для производительности:**
```sql
REINDEX INDEX CONCURRENTLY idx_models_3d_created_at;
REINDEX INDEX CONCURRENTLY idx_models_3d_status;
```

### Railway мониторинг

Railway Dashboard → Database → **Metrics:**
- **Connections** - активные подключения
- **CPU Usage** - загрузка процессора
- **Memory Usage** - использование памяти
- **Storage** - использование диска
- **Query Performance** - время выполнения запросов

---

## 🚨 Troubleshooting

### Ошибка подключения

**Симптом:** "Не удалось подключиться к базе данных"

**Проверка:**
```bash
# Локально
psql -h localhost -U postgres -d photo_to_3d -c "SELECT 1;"

# Railway
railway run psql $DATABASE_URL -c "SELECT 1;"

# Переменные окружения
railway variables | grep DATABASE_URL
```

**Решения:**
1. Проверьте `DATABASE_URL` в .env
2. Убедитесь что PostgreSQL запущен
3. Проверьте firewall и порты
4. Для Railway проверьте статус БД в Dashboard

### Таблицы не создаются

**Симптом:** Sequelize не создает таблицы

**Проверка логов:**
```bash
cd backend && npm start
# Должны увидеть:
# ✅ Подключение к базе данных установлено успешно
# ✅ Модели синхронизированы с базой данных
```

**Решения:**
1. Проверьте права пользователя в PostgreSQL
2. Убедитесь что БД не только для чтения
3. Проверьте синтаксис в `config/database.js`

### SSL проблемы на Railway

**Симптом:** SSL connection errors

**Конфигурация в Railway:**
```javascript
// config/database.js
dialectOptions: {
  ssl: process.env.NODE_ENV === 'production' ? {
    require: true,
    rejectUnauthorized: false  // Railway сертификаты
  } : false
}
```

### Проблемы с производительностью

**Симптом:** Медленные запросы

**Оптимизации:**
```sql
-- Проверка медленных запросов
SELECT * FROM pg_stat_statements WHERE query LIKE '%models_3d%' ORDER BY mean_time DESC;

-- Добавление индекса
CREATE INDEX CONCURRENTLY idx_models_3d_user_status ON models_3d(user_id, status);

-- Анализ таблицы
ANALYZE models_3d;
```

### Проблемы с размером

**Симптом:** База данных слишком большая

**Очистка:**
```sql
-- Удаление старых моделей
DELETE FROM models_3d WHERE status = 'deleted' AND created_at < NOW() - INTERVAL '30 days';

-- Удаление старых задач
DELETE FROM generation_tasks WHERE created_at < NOW() - INTERVAL '7 days';

-- Очистка неиспользуемого пространства
VACUUM FULL;
```

---

## 🔮 Будущие улучшения

### Планируемые функции
- **Пользователи** - таблицы для аутентификации
- **Комментарии** - отзывы к моделям
- **Теги** - категоризация моделей
- **Аналитика** - статистика использования

### Масштабирование
- **Read replicas** - для распределения нагрузки
- **Partitioning** - по дате для больших объемов
- **External storage** - для очень больших GLB файлов

---

## 📞 Поддержка

### Полезные команды

```bash
# Проверка подключения
railway run psql $DATABASE_URL -c "SELECT version();"

# Список всех таблиц
railway run psql $DATABASE_URL -c "\dt"

# Размер базы данных
railway run psql $DATABASE_URL -c "SELECT pg_size_pretty(pg_database_size('photo_to_3d'));"

# Проверка индексов
railway run psql $DATABASE_URL -c "SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public';"
```

### Контакты
- **Railway Docs:** [docs.railway.app](https://docs.railway.app/)
- **PostgreSQL Docs:** [postgresql.org/docs](https://postgresql.org/docs/)
- **Sequelize Docs:** [sequelize.org](https://sequelize.org/)

---

*📝 Последнее обновление: 25 октября 2025 | PostgreSQL версия: 13+*

