# 🚄 Railway настройка для Photo to 3D v3.0

## 📋 Что нужно для начала

- ✅ **GitHub аккаунт** (бесплатно)
- ✅ **Railway аккаунт** (бесплатно до $5/месяц)
- ✅ **GenAPI аккаунт** ([gen-api.ru](https://gen-api.ru/))
- ✅ **PostgreSQL база данных** (Railway предоставляет бесплатно)

---

## 🎯 Шаг 1: Подготовка проекта

### 1.1 Клонирование репозитория

```bash
git clone https://github.com/kikanbig/Photo_2_3d.git
cd Photo_to_3d
```

### 1.2 Проверка структуры

Убедитесь что все файлы на месте:
```bash
ls -la
# Должны быть: backend/, frontend/, README.md, railway.toml

ls -la backend/
# Должны быть: server.js, routes/, models/, services/, package.json

ls -la frontend/
# Должны быть: src/, package.json, build/ (после сборки)
```

### 1.3 Проверка конфигурации

Railway использует `railway.toml` для настройки:

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
  'cd frontend && npm run build'
]
```

---

## 🚀 Шаг 2: Настройка Railway

### 2.1 Установка CLI

```bash
# Установка Railway CLI
npm install -g @railway/cli

# Проверка версии
railway --version
```

### 2.2 Авторизация

```bash
# Вход в аккаунт Railway
railway login

# Проверка авторизации
railway status
```

### 2.3 Создание проекта

```bash
# Инициализация проекта
railway init

# Выберите "Create new project"
# Выберите "Connect to GitHub" (рекомендуется)
```

### 2.4 Подключение к GitHub (Опционально)

```bash
# Если выбрали GitHub интеграцию
railway link

# Связать с существующим репозиторием
# Или создать новый на GitHub
```

---

## 🔑 Шаг 3: Переменные окружения

### 3.1 Обязательные переменные

В **Railway Dashboard** перейдите в **Variables** и добавьте:

```env
# === ОБЯЗАТЕЛЬНЫЕ (без них не запустится) ===
GENAPI_API_KEY=sk_prod_your_api_key_here
GENAPI_BASE_URL=https://gen-api.ru/api/v1

# === БАЗА ДАННЫХ (Railway создаст автоматически) ===
DATABASE_URL=postgresql://railway:password@host:5432/railway

# === СЕРВЕР ===
NODE_ENV=production
PORT=3001

# === ФАЙЛЫ ===
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_DIR=uploads
```

### 3.2 Получение GenAPI ключа

1. **Регистрация на GenAPI:**
   - Перейдите на [gen-api.ru](https://gen-api.ru/)
   - Создайте аккаунт
   - Пополните баланс (минимально)

2. **Получение API ключа:**
   - Войдите в личный кабинет
   - Перейдите в раздел "API ключи"
   - Скопируйте ключ формата `sk_prod_...`

3. **Добавление ключа в Railway:**
   ```bash
   # Через CLI
   railway variables set GENAPI_API_KEY=sk_prod_your_key_here

   # Или в Dashboard: Variables → Add Variable
   ```

### 3.3 Проверка переменных

```bash
# Проверка всех переменных
railway variables

# Проверка конкретной переменной
railway run echo $GENAPI_API_KEY
```

---

## 🚀 Шаг 4: Деплой

### 4.1 Первый деплой

```bash
# Деплой приложения
railway up

# Следить за логами
railway logs --follow

# Проверка статуса
railway status
```

### 4.2 Мониторинг деплоя

**В Railway Dashboard:**
- **Deploy Logs** - логи сборки и запуска
- **Runtime Logs** - логи работающего приложения
- **Metrics** - CPU, память, трафик

**Через CLI:**
```bash
# Логи в реальном времени
railway logs -f

# Логи конкретного сервиса
railway logs --service backend

# Статус сервисов
railway services
```

### 4.3 Проверка работоспособности

```bash
# Health check
railway run curl https://your-app.railway.app/api

# Проверка базы данных
railway run psql $DATABASE_URL -c "SELECT 1;"

# Проверка API ключа
railway run curl -H "Authorization: Bearer $GENAPI_API_KEY" https://gen-api.ru/api/v1/user
```

---

## 🗄️ Шаг 5: База данных

### 5.1 Автоматическое создание

Railway автоматически создаст PostgreSQL базу данных при первом запуске.

**Проверка подключения:**
```bash
# Тестирование подключения
railway run psql $DATABASE_URL -c "SELECT version();"

# Проверка таблиц
railway run psql $DATABASE_URL -c "\dt"
```

### 5.2 Миграции

Приложение автоматически создаст необходимые таблицы:

```bash
# Проверка миграций
railway run psql $DATABASE_URL -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"

# Ожидаемые таблицы:
# - models_3d (основная таблица моделей)
# - generation_tasks (задачи генерации)
```

### 5.3 Резервное копирование

```bash
# Создание резервной копии
railway run pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Восстановление
railway run psql $DATABASE_URL < backup.sql
```

---

## 🌐 Шаг 6: Домен и SSL

### 6.1 Настройка домена

1. **Купите домен** (Namecheap, GoDaddy, etc.)

2. **Настройте DNS:**
```dns
# A записи (замените railway-ip на реальный IP)
your-domain.com  300  IN  A  [railway-ip]
www.your-domain.com  300  IN  A  [railway-ip]
```

3. **Добавьте домен в Railway:**
```bash
railway domain add your-domain.com
```

### 6.2 SSL сертификат

Railway автоматически выдаст **бесплатный SSL сертификат** от Let's Encrypt.

**Проверка SSL:**
```bash
# Проверка HTTPS
curl -I https://your-domain.com

# Проверка сертификата
echo | openssl s_client -connect your-domain.com:443 2>/dev/null | openssl x509 -noout -dates
```

---

## 📊 Шаг 7: Мониторинг

### 7.1 Логи приложения

```bash
# Все логи
railway logs

# Логи с фильтром
railway logs | grep -i error
railway logs | grep -i "генерация"

# Логи за последние 10 минут
railway logs --since 10m
```

### 7.2 Метрики

В **Railway Dashboard:**
- **CPU Usage** - загрузка процессора
- **Memory Usage** - использование памяти
- **Network** - входящий/исходящий трафик
- **Database** - подключения и запросы

### 7.3 Health checks

```bash
# Проверка API
railway run curl https://your-app.railway.app/api

# Проверка health endpoint
railway run curl https://your-app.railway.app/health

# Проверка базы данных
railway run curl https://your-app.railway.app/api/health/database
```

---

## 🔧 Шаг 8: Обновления

### 8.1 Автоматический деплой из GitHub

1. **Подключите репозиторий** к Railway
2. **Настройте автодеплой** в Railway Dashboard
3. **При каждом push** в main ветку Railway пересоберет приложение

### 8.2 Manual обновление

```bash
# Обновление кода
git add .
git commit -m "Update: новые функции"
git push origin main

# Railway автоматически пересоберет
railway logs -f
```

### 8.3 Rollback

```bash
# Откат к предыдущему коммиту
git reset --hard HEAD~1
git push --force

# Или откат к конкретному коммиту
git reset --hard abc123
git push --force
```

---

## 💰 Шаг 9: Стоимость

### Railway тарифы (2025)

| План | Цена | Что входит |
|------|------|------------|
| **Hobby** | $0/месяц | 1GB RAM, 1 vCPU, 1GB storage |
| **Pro** | $5/месяц | 8GB RAM, 8 vCPU, 100GB storage |
| **Enterprise** | Custom | Выделенные ресурсы, приоритетная поддержка |

### Дополнительные расходы

- **GenAPI** - от $0.50 за генерацию (зависит от настроек)
- **Домен** - $10-15/год (Namecheap, GoDaddy)
- **PostgreSQL** - включено в Railway до 1GB

**Рекомендация:** Начните с бесплатного плана Railway + $10-20 на GenAPI для тестирования.

---

## 🚨 Troubleshooting

### Проблема: Build failed

```bash
# Проверка логов сборки
railway logs --service build

# Проверка зависимостей
cd backend && npm install --dry-run

# Проверка синтаксиса
node -c server.js
```

### Проблема: Database connection failed

```bash
# Проверка DATABASE_URL
railway run echo $DATABASE_URL

# Тестирование подключения
railway run psql $DATABASE_URL -c "SELECT 1;"

# Проверка переменных
railway variables
```

### Проблема: GenAPI не работает

```bash
# Проверка API ключа
railway run curl -H "Authorization: Bearer $GENAPI_API_KEY" https://gen-api.ru/api/v1/user

# Проверка баланса
railway run curl -H "Authorization: Bearer $GENAPI_API_KEY" https://gen-api.ru/api/v1/user/balance
```

### Проблема: Приложение не отвечает

```bash
# Проверка процессов
railway run ps aux

# Перезапуск сервиса
railway service restart

# Проверка памяти
railway run cat /proc/meminfo | head -5
```

---

## 📞 Поддержка

### Официальная поддержка
- **Railway Docs:** [docs.railway.app](https://docs.railway.app/)
- **Railway Discord:** [discord.gg/railway](https://discord.gg/railway)
- **GenAPI Support:** [gen-api.ru/support](https://gen-api.ru/support)

### Сообщество
- **GitHub Issues:** [github.com/kikanbig/Photo_2_3d/issues](https://github.com/kikanbig/Photo_2_3d/issues)
- **Railway Status:** [status.railway.app](https://status.railway.app/)

---

## 🎉 Готово!

После выполнения всех шагов у вас будет:

✅ **Работающее приложение** на Railway  
✅ **PostgreSQL база данных** с автоматическим резервным копированием  
✅ **SSL сертификат** для безопасного HTTPS  
✅ **Мониторинг** производительности и логов  
✅ **AR поддержка** для мобильных устройств  

**Ваше приложение доступно по адресу:** `https://your-app.railway.app`

**🚀 Удачи с Photo to 3D!**