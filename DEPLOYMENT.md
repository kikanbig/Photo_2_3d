# 🚀 Деплой и развертывание - Photo to 3D v3.0

## 📋 Содержание

1. [Быстрый деплой на Railway](#railway-быстрый-деплой)
2. [Docker развертывание](#docker-развертывание)
3. [Manual развертывание](#manual-развертывание)
4. [Конфигурация переменных окружения](#конфигурация-переменных-окружения)
5. [База данных в production](#база-данных-в-production)
6. [Мониторинг и логи](#мониторинг-и-логи)
7. [SSL и домен](#ssl-и-домен)
8. [Резервное копирование](#резервное-копирование)

---

## 🎯 Railway - Быстрый деплой

**Railway** - рекомендуемая платформа для развертывания Photo to 3D.

### Предварительные требования
- GitHub аккаунт
- Railway аккаунт (бесплатно)
- GenAPI аккаунт с API ключом

### 1. Подготовка проекта

```bash
# Убедитесь что все файлы закоммичены
git status
git add .
git commit -m "Ready for deployment"

# Создайте .env.example для документации
cp backend/.env.example backend/.env.example

# Удалите .env из репозитория (если есть)
echo "backend/.env" >> .gitignore
```

### 2. Настройка Railway

```bash
# Установка Railway CLI
npm install -g @railway/cli

# Авторизация
railway login

# Создание проекта
railway init

# Подключение к GitHub (опционально)
railway link
```

### 3. Конфигурация проекта

Railway автоматически создаст `railway.toml` конфигурацию:

```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "node backend/server.js"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[phases.setup]
nixPkgs = ["nodejs", "npm"]

[phases.install]
cmds = [
  "cd backend && npm install --production",
  "cd frontend && npm install --production"
]

[phases.build]
cmds = [
  'cd frontend && mkdir -p public',
  # ... сборка frontend ...
  'cd frontend && npm run build'
]
```

### 4. Переменные окружения

В **Railway Dashboard** добавьте переменные:

```env
# === ОБЯЗАТЕЛЬНЫЕ ===
GENAPI_API_KEY=your_production_api_key
GENAPI_BASE_URL=https://gen-api.ru/api/v1

# === БАЗА ДАННЫХ ===
DATABASE_URL=postgresql://[user]:[pass]@[host]:5432/railway

# === СЕРВЕР ===
NODE_ENV=production
PORT=3001

# === ФАЙЛЫ ===
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads
```

### 5. Деплой

```bash
# Первый деплой
railway up

# Последующие обновления
git push origin main
# Railway автоматически пересоберет
```

### 6. Проверка деплоя

```bash
# Логи деплоя
railway logs

# Статус сервисов
railway status

# Открыть приложение
railway open
```

**Результат:** Приложение доступно по адресу `https://your-app.railway.app`

---

## 🐳 Docker развертывание

### Dockerfile

```dockerfile
# Multi-stage build для оптимизации
FROM node:18-alpine AS builder

# Backend зависимости
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install --production

# Frontend зависимости и сборка
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install --production
COPY frontend/ ./
RUN npm run build

# Production образ
FROM node:18-alpine
WORKDIR /app

# Копирование backend
COPY --from=builder /app/backend ./backend/

# Копирование собранного frontend
COPY --from=builder /app/frontend/build ./frontend/build

# Создание директорий для файлов
RUN mkdir -p uploads/input uploads/models uploads/temp

# Порты
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Запуск
WORKDIR /app/backend
CMD ["npm", "start"]
```

### Docker Compose (с PostgreSQL)

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3001:3001"
    environment:
      - GENAPI_API_KEY=${GENAPI_API_KEY}
      - DATABASE_URL=postgresql://postgres:password@db:5432/photo_to_3d
      - NODE_ENV=production
    depends_on:
      - db
    volumes:
      - uploads:/app/uploads

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=photo_to_3d
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
  uploads:
```

### Сборка и запуск

```bash
# Сборка образа
docker build -t photo-to-3d .

# Запуск с Docker Compose
docker-compose up -d

# Проверка логов
docker-compose logs -f app

# Остановка
docker-compose down
```

---

## 🔧 Manual развертывание

### На VPS (Ubuntu/Debian)

#### 1. Подготовка сервера

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Установка PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Установка Nginx (опционально)
sudo apt install nginx -y
```

#### 2. PostgreSQL настройка

```bash
# Запуск PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Создание пользователя и базы данных
sudo -u postgres psql
```

```sql
-- В psql
CREATE DATABASE photo_to_3d;
CREATE USER photouser WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE photo_to_3d TO photouser;
ALTER USER photouser CREATEDB;
\q
```

#### 3. Развертывание приложения

```bash
# Клонирование проекта
git clone <your-repo-url>
cd Photo_to_3D

# Установка зависимостей
cd backend && npm install --production
cd ../frontend && npm install --production && npm run build

# Настройка .env
cp backend/.env.example backend/.env
nano backend/.env  # Редактируйте переменные
```

#### 4. Запуск как сервис

**Создайте systemd сервис:**

```bash
# /etc/systemd/system/photo-to-3d.service
sudo nano /etc/systemd/system/photo-to-3d.service
```

```ini
[Unit]
Description=Photo to 3D Application
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/Photo_to_3D/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Запуск сервиса:**

```bash
sudo systemctl daemon-reload
sudo systemctl enable photo-to-3d
sudo systemctl start photo-to-3d

# Проверка
sudo systemctl status photo-to-3d
sudo journalctl -u photo-to-3d -f
```

### Nginx конфигурация (опционально)

```nginx
# /etc/nginx/sites-available/photo-to-3d
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/photo-to-3d /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔑 Конфигурация переменных окружения

### Production переменные

```env
# === AI ИНТЕГРАЦИЯ ===
GENAPI_API_KEY=sk_prod_your_production_key_here
GENAPI_BASE_URL=https://gen-api.ru/api/v1

# === БАЗА ДАННЫХ ===
DATABASE_URL=postgresql://username:password@host:port/database_name
# Альтернатива:
# PGHOST=host
# PGPORT=5432
# PGDATABASE=database_name
# PGUSER=username
# PGPASSWORD=password

# === СЕРВЕР ===
NODE_ENV=production
PORT=3001

# === ФАЙЛЫ ===
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_DIR=uploads

# === БЕЗОПАСНОСТЬ ===
JWT_SECRET=your_jwt_secret_for_future_auth
SESSION_SECRET=your_session_secret

# === ЛОГИРОВАНИЕ ===
LOG_LEVEL=info  # error, warn, info, debug
```

### Различия Development vs Production

| Параметр | Development | Production |
|----------|-------------|------------|
| NODE_ENV | development | production |
| DATABASE_URL | localhost | Railway/PostgreSQL |
| LOG_LEVEL | debug | info |
| CORS_ORIGIN | * | your-domain.com |
| TRUST_PROXY | false | true |

---

## 🗄️ База данных в Production

### Railway PostgreSQL

Railway автоматически предоставляет PostgreSQL базу данных.

```bash
# Проверка подключения
railway run psql $DATABASE_URL -c "SELECT version();"

# Создание резервной копии
railway run pg_dump $DATABASE_URL > backup.sql
```

### Внешняя база данных

**Рекомендуемые провайдеры:**
- **Railway PostgreSQL** (бесплатно до 1GB)
- **Supabase** (бесплатно до 2GB)
- **ElephantSQL** (бесплатно до 20MB)
- **AWS RDS** (от $15/месяц)
- **Google Cloud SQL** (от $10/месяц)

**Настройка подключения:**

```env
# Supabase
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres

# AWS RDS
DATABASE_URL=postgresql://[username]:[password]@[endpoint]:5432/[database]

# Google Cloud SQL
DATABASE_URL=postgresql://[username]:[password]@[public-ip]:5432/[database]
```

### Миграции в Production

```bash
# Через Railway CLI
railway run npx sequelize-cli db:migrate

# Через Docker
docker exec -it photo-to-3d-app npx sequelize-cli db:migrate

# Manual
psql $DATABASE_URL -c "ALTER TABLE models_3d ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';"
```

---

## 📊 Мониторинг и логи

### Railway мониторинг

**Доступ к логам:**
```bash
# Все логи
railway logs

# Логи конкретного сервиса
railway logs --service backend

# Фильтр по ключевым словам
railway logs | grep -i error
railway logs | grep -i "генерация"
```

**Мониторинг в Dashboard:**
- CPU и память использование
- Network трафик
- Database подключения
- Error rates

### Логирование в приложении

**Структурированные логи:**

```javascript
// backend/services/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'photo-to-3d' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

**Использование в коде:**
```javascript
const logger = require('../services/logger');

// Вместо console.log
logger.info('Генерация модели запущена', { taskId, imagePath });
logger.error('Ошибка загрузки файла', { error: error.message, stack: error.stack });
```

### Health checks

**Эндпоинты мониторинга:**

```javascript
// server.js - добавьте эти роуты

// Общий health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Health check базы данных
app.get('/api/health/database', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({
      status: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Метрики приложения
app.get('/api/health/metrics', async (req, res) => {
  try {
    const totalModels = await Model3D.count();
    const activeModels = await Model3D.count({ where: { status: 'active' } });

    res.json({
      models: {
        total: totalModels,
        active: activeModels
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        database: sequelize.connectionManager.pool.size
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
```

### Настройка мониторинга

**Railway мониторинг:**
1. В Dashboard перейдите в раздел Monitoring
2. Настройте alerts для:
   - CPU > 80%
   - Memory > 80%
   - Error rate > 5%
   - Response time > 2s

**Внешние сервисы мониторинга:**
- **UptimeRobot** - мониторинг доступности
- **Sentry** - отслеживание ошибок
- **DataDog** - полная observability

---

## 🔒 SSL и домен

### Настройка домена в Railway

1. **Купите домен** (Namecheap, GoDaddy, etc.)

2. **Настройте DNS:**
```dns
# A записи
@  300  IN  A  [railway-ip]
*  300  IN  A  [railway-ip]

# CNAME для www
www  300  IN  CNAME  [your-app].railway.app
```

3. **Добавьте домен в Railway:**
```bash
railway domain add your-domain.com
```

4. **SSL сертификат** генерируется автоматически (Let's Encrypt)

### Nginx с SSL (Manual деплой)

```nginx
# /etc/nginx/sites-available/photo-to-3d
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Certbot для SSL:**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

---

## 💾 Резервное копирование

### Автоматическое резервное копирование

**Railway PostgreSQL:**

```bash
# Создание резервной копии
railway run pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Восстановление
railway run psql $DATABASE_URL < backup_20250101.sql
```

**Автоматизация с cron:**

```bash
# Создайте скрипт backup.sh
#!/bin/bash
DATE=$(date +%Y%m%d)
railway run pg_dump $DATABASE_URL > /backups/backup_$DATE.sql
find /backups -name "backup_*.sql" -mtime +30 -delete  # Удаление старых
```

**Настройка cron:**
```bash
# Редактирование crontab
crontab -e

# Добавьте строку для ежедневного бэкапа
0 2 * * * /path/to/backup.sh
```

### Резервное копирование файлов

**Загруженные файлы:**
```bash
# Создание архива файлов
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/

# Восстановление
tar -xzf uploads_backup_20250101.tar.gz
```

### Восстановление из резервной копии

```sql
-- Остановка приложения
sudo systemctl stop photo-to-3d

-- Восстановление базы данных
psql $DATABASE_URL < backup.sql

-- Восстановление файлов
tar -xzf uploads_backup.tar.gz -C /

-- Запуск приложения
sudo systemctl start photo-to-3d
```

---

## 🔧 Обновление Production

### Zero-downtime деплой

#### Railway
```bash
# 1. Создайте новую ветку
git checkout -b release/v3.1
# Внесите изменения
git commit -m "Release v3.1 features"
git push origin release/v3.1

# 2. Railway автоматически пересоберет
railway logs --follow

# 3. Тестирование
curl https://your-app.railway.app/api/health
```

#### Docker
```bash
# Сборка нового образа
docker build -t photo-to-3d:v3.1 .

# Обновление без простоя
docker-compose up -d --no-deps app
```

### Rollback

**Railway:**
```bash
# Откат к предыдущему коммиту
git reset --hard HEAD~1
git push --force

# Или откат к конкретному коммиту
git reset --hard abc123
git push --force
```

**Docker:**
```bash
# Откат к предыдущему образу
docker tag photo-to-3d:v3.0 photo-to-3d:rollback
docker-compose up -d app
```

---

## 🚨 Troubleshooting

### Проблемы с деплойем

**"Build failed"**
```bash
# Проверка логов сборки
railway logs --service build

# Проверка зависимостей
cd backend && npm install --dry-run

# Проверка синтаксиса
node -c server.js
```

**"Database connection failed"**
```bash
# Проверка DATABASE_URL
echo $DATABASE_URL

# Тестирование подключения
railway run psql $DATABASE_URL -c "SELECT 1;"

# Проверка переменных окружения
railway variables
```

**"GenAPI not working"**
```bash
# Проверка API ключа
railway run curl -H "Authorization: Bearer $GENAPI_API_KEY" https://gen-api.ru/api/v1/user

# Тестирование интеграции
railway run node -e "
const api = require('./backend/services/genapi.js');
console.log('API Key:', process.env.GENAPI_API_KEY ? 'Set' : 'Missing');
"
```

### Проблемы с производительностью

**Высокая нагрузка на CPU:**
- Проверьте логи генерации
- Увеличьте PostgreSQL план
- Оптимизируйте запросы к БД

**Медленная загрузка:**
- Проверьте размер GLB файлов
- Настройте кэширование
- Оптимизируйте изображения

**Память заполнена:**
- Перезапустите приложение
- Проверьте утечки памяти
- Увеличьте RAM в Railway

### Мониторинг ошибок

```bash
# Реал-тайм логи ошибок
railway logs | grep -i error

# Статистика использования
railway run ps aux | grep node

# Проверка дискового пространства
railway run df -h
```

---

## 📈 Масштабирование

### Horizontal scaling (Railway)

**Добавление реплик:**
```bash
# В Railway Dashboard
# Services -> [Your Service] -> Scale -> Replicas: 2
```

**Load balancing:**
Railway автоматически балансирует нагрузку между репликами.

### Database scaling

**Read replicas:**
```sql
-- Создание read replica
CREATE PUBLICATION photot3d_publication FOR TABLE models_3d;

-- На replica
CREATE SUBSCRIPTION photot3d_subscription
CONNECTION 'host=primary_host port=5432 user=postgres dbname=photo_to_3d'
PUBLICATION photot3d_publication;
```

**Connection pooling:**
```javascript
// В database.js
const sequelize = new Sequelize(connectionString, {
  dialect: 'postgres',
  pool: {
    max: 20,      // Максимум соединений
    min: 5,       // Минимум соединений
    acquire: 30000,
    idle: 10000
  }
});
```

### CDN для статических файлов

**Настройка CloudFlare:**
1. Добавьте домен в CloudFlare
2. Настройте правила кэширования:
   - `/uploads/*` - Cache Everything (1 год)
   - `/api/*` - Bypass cache
3. Включите compression

---

## 💰 Стоимость

### Railway (бесплатно для старта)

| Ресурс | Free | Pro ($5/месяц) | Enterprise |
|--------|------|----------------|------------|
| CPU | 1 vCPU | 8 vCPU | Custom |
| RAM | 512MB | 8GB | Custom |
| Storage | 1GB | 100GB | Custom |
| Bandwidth | 100GB | 1TB | Custom |
| Databases | 1GB PostgreSQL | 10GB PostgreSQL | Custom |

### Дополнительные сервисы

**Email/SMS уведомления:**
- SendGrid (бесплатно 100 emails/день)
- Twilio (бесплатно $15 при регистрации)

**Мониторинг:**
- Sentry (бесплатно 5K errors/месяц)
- DataDog (14 дней бесплатно)

**CDN:**
- CloudFlare (бесплатно)
- AWS CloudFront (от $0.085/GB)

---

*📝 Последнее обновление: 25 октября 2025 | Версия деплоя: 3.0*