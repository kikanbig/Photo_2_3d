# 🔧 Настройка переменных окружения Railway для Photo to 3D

## Проблема: AR и превью не работают на production

Если вы столкнулись с проблемами:
- ❌ AR не загружается на мобильном телефоне
- ❌ Нет превью фотографий в "Мои модели"
- ❌ Модели не отображаются

**Причина:** Frontend не знает URL backend сервера и использует относительные пути.

## ✅ Решение: Настройка переменных окружения

### Шаг 1: Откройте Railway Dashboard

1. Перейдите на [railway.app](https://railway.app)
2. Откройте ваш проект `Photo_to_3D`
3. Нажмите на ваш **service** (не на базу данных)

### Шаг 2: Добавьте переменные окружения

Перейдите на вкладку **"Variables"** и добавьте/проверьте следующие переменные:

#### Обязательные переменные:

```bash
# Backend API ключ
GENAPI_API_KEY=sk-nt14wDb0YEGeK0trh1rss8XIRc6ivSoxV0yKedgSeqeWPlSIIbqEVsRv2el1

# Node окружение
NODE_ENV=production

# Порт (Railway автоматически)
PORT=${{PORT}}

# Database URL (автоматически от PostgreSQL)
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

#### ⚠️ КРИТИЧНО: Переменные для AR и превью

Railway предоставляет автоматические переменные:
- `RAILWAY_PUBLIC_DOMAIN` - домен вашего приложения
- `RAILWAY_STATIC_URL` - статический URL

**НО** эти переменные доступны только **во время runtime**, а React встраивает переменные **во время сборки**!

### Шаг 3: Используйте автоматические переменные Railway

Railway **автоматически** предоставляет:
```bash
RAILWAY_PUBLIC_DOMAIN=your-app.up.railway.app
```

Dockerfile уже настроен для использования этой переменной:
```dockerfile
ARG RAILWAY_PUBLIC_DOMAIN
ENV REACT_APP_BACKEND_URL=https://${RAILWAY_PUBLIC_DOMAIN}
```

### Шаг 4: Проверьте Dockerfile

Убедитесь, что используется `Dockerfile.railway` (не обычный `Dockerfile`):

1. В Railway Dashboard → Settings → Build
2. Проверьте:
   - **Docker Build**: ✅ включено
   - **Dockerfile Path**: `Dockerfile.railway`

### Шаг 5: Redeploy

После настройки переменных:

1. Перейдите в **Deployments**
2. Нажмите на три точки (...) на последнем деплое
3. Выберите **"Redeploy"**

ИЛИ просто сделайте push в GitHub:
```bash
git add .
git commit -m "chore: update Railway config"
git push
```

## 🧪 Проверка после деплоя

### 1. Проверьте консоль браузера

Откройте ваше приложение на Railway и нажмите F12:

```javascript
// Должно вывести полный URL, не относительный
console.log(process.env.REACT_APP_BACKEND_URL)
// Правильно: "https://photo23d-production.up.railway.app"
// Неправильно: undefined или ""
```

### 2. Проверьте Network запросы

В консоли браузера → Network → найдите запросы к API:
- ✅ Правильно: `https://your-app.up.railway.app/api/models/...`
- ❌ Неправильно: `/api/models/...` (относительный путь)

### 3. Проверьте AR на мобильном

1. Создайте и сохраните модель
2. Откройте "Мои модели" → Просмотр
3. Отсканируйте QR код телефоном
4. Модель должна загрузиться в AR ✅

### 4. Проверьте превью изображений

1. Откройте "Мои модели"
2. Должны отображаться фото-превью моделей ✅

## 🐛 Устранение неполадок

### Проблема: REACT_APP_BACKEND_URL undefined

**Решение:**
1. Убедитесь, что используется `Dockerfile.railway`
2. Проверьте, что `ARG RAILWAY_PUBLIC_DOMAIN` есть в Dockerfile
3. Redeploy приложение

### Проблема: AR показывает 404

**Решение:**
1. Откройте консоль браузера на странице AR
2. Найдите ошибку загрузки модели
3. Проверьте, что URL абсолютный (начинается с `https://`)

### Проблема: Превью не загружаются

**Решение:**
1. Проверьте консоль браузера → Network
2. Найдите запросы к `/uploads/...`
3. Убедитесь, что они идут на правильный домен

## 📝 Альтернативный способ (если автоматический не работает)

Если `RAILWAY_PUBLIC_DOMAIN` не работает, можно **жестко задать** URL:

1. В Railway Dashboard → Variables:
```bash
REACT_APP_BACKEND_URL=https://your-actual-app-url.up.railway.app
```

2. Измените Dockerfile.railway:
```dockerfile
# Вместо ARG используем ENV напрямую
ENV REACT_APP_BACKEND_URL=${REACT_APP_BACKEND_URL}
```

3. Redeploy

## ✅ Итоговый чеклист

- [ ] `GENAPI_API_KEY` установлен
- [ ] `DATABASE_URL` подключен от PostgreSQL
- [ ] `Dockerfile.railway` используется для сборки
- [ ] `RAILWAY_PUBLIC_DOMAIN` доступен во время сборки
- [ ] Приложение redeploy-нуто
- [ ] AR работает на мобильном
- [ ] Превью отображаются в списке моделей

## 🎯 Текущий URL приложения

По вашей информации из QUICK_START.md:
```
https://photo-2-3d-production.up.railway.app/
```

Возможно, нужно использовать:
```
https://photo23d-production.up.railway.app
```

Проверьте реальный URL в Railway Dashboard → Settings → Domains.

---

**Автор:** AI Assistant  
**Дата:** 2025-10-24  
**Версия:** 1.0

