# 🚀 Настройка аутентификации на Railway

## 📋 Текущий статус
- ✅ **Backend API**: Работает на Railway
- ✅ **Frontend**: Развернут на Railway
- ✅ **База данных**: Синхронизирована
- ✅ **Регистрация**: Работает
- ❌ **Email отправка**: Требует настройки
- ❌ **JWT токены**: Требует настройки секрета

## 🔧 Настройка переменных окружения

### 1. Откройте Railway Dashboard
Перейдите в ваш проект на [Railway](https://railway.app)

### 2. Перейдите в раздел Variables
В левом меню выберите **Variables**

### 3. Добавьте переменные окружения:

```bash
# JWT для аутентификации (ОБЯЗАТЕЛЬНО)
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random

# Email настройки (ОБЯЗАТЕЛЬНО для отправки писем подтверждения)
EMAIL_USER=your-gmail@gmail.com
EMAIL_APP_PASSWORD=your-16-digit-gmail-app-password

# Другие настройки (уже настроены)
NODE_ENV=production
PORT=3001
UPLOAD_DIR=uploads
DATABASE_URL=postgresql://...
GENAPI_API_KEY=...
GENAPI_BASE_URL=https://gen-api.ru/api/v1
```

### 4. Настройка Gmail App Password

#### Шаг 1: Включите двухфакторную аутентификацию
1. Перейдите в [Google Account Settings](https://myaccount.google.com/security)
2. В разделе "Security" → "Signing in to Google"
3. Включите **2-Step Verification**

#### Шаг 2: Создайте App Password
1. В разделе "Security" → "Signing in to Google" → **App passwords**
2. Выберите **Mail** и **Other (custom name)**
3. Введите название (например, "Photo to 3D")
4. Скопируйте **16-значный пароль**
5. Используйте его как `EMAIL_APP_PASSWORD`

⚠️ **Важно**: Используйте App Password, а не обычный пароль Gmail!

### 5. Перезапустите сервис
После добавления переменных нажмите **Deploy** для перезапуска сервиса.

## 🧪 Тестирование системы

### Тест 1: Проверка API
```bash
# Проверка статуса API
curl https://photo23d-production.up.railway.app/api

# Регистрация тестового пользователя
curl -X POST https://photo23d-production.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

### Тест 2: Проверка email
После настройки email переменных:
```bash
# Регистрация
curl -X POST https://photo23d-production.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "your-real-email@gmail.com", "password": "password123"}'

# Должно прийти письмо с ссылкой подтверждения
```

### Тест 3: Полный цикл в браузере
1. Откройте: `https://photo23d-production.up.railway.app/register`
2. Зарегистрируйтесь с реальным email
3. Проверьте почту и перейдите по ссылке подтверждения
4. Войдите в систему
5. Попробуйте сгенерировать 3D модель (спишется 1 кредит)

## 🔍 Возможные проблемы

### Email не приходит
- Проверьте папку **Спам**
- Убедитесь, что App Password правильный
- Проверьте логи Railway (Deployments → View Logs)

### Ошибка "JWT secret not defined"
- Добавьте `JWT_SECRET` в переменные окружения
- Перезапустите сервис

### Ошибка базы данных
- Проверьте `DATABASE_URL` в Railway
- Убедитесь, что база данных PostgreSQL подключена

## 📊 Мониторинг

### Логи приложения
В Railway Dashboard → Deployments → View Logs

### Переменные окружения
Railway Dashboard → Variables (убедитесь, что они скрыты)

### Использование
Railway Dashboard → Usage (мониторьте потребление ресурсов)

## 🎯 Следующие шаги

После настройки:
1. ✅ **Тестируйте регистрацию** с реальным email
2. ✅ **Проверьте подтверждение** email
3. ✅ **Тестируйте генерацию** 3D с кредитами
4. ✅ **Проверьте личные модели** пользователя
5. ✅ **Настройте домен** (опционально)

## 📞 Поддержка

Если возникнут проблемы:
1. Проверьте логи Railway
2. Убедитесь, что все переменные настроены
3. Проверьте синтаксис email и паролей
4. Попробуйте перезапустить сервис

---

**Готово к настройке! 🚀**
