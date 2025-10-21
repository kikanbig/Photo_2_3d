# Используем официальный Node.js образ
FROM node:18-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json файлы
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Устанавливаем зависимости
RUN cd backend && npm ci --only=production
RUN cd frontend && npm ci --only=production

# Копируем исходный код
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Собираем фронтенд
RUN cd frontend && \
    # Создаем папку public
    mkdir -p public && \
    # Создаем index.html
    echo '<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#667eea" />
    <meta name="description" content="Photo to 3D - Превращайте фотографии в 3D модели с помощью ИИ" />
    <link rel="apple-touch-icon" href="%PUBLIC_URL%/logo192.png" />
    <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />
    <title>Photo to 3D - Генерация 3D моделей</title>
  </head>
  <body>
    <noscript>Для работы этого приложения необходимо включить JavaScript.</noscript>
    <div id="root"></div>
  </body>
</html>' > public/index.html && \
    # Создаем manifest.json
    echo '{
  "short_name": "Photo to 3D",
  "name": "Photo to 3D - Генерация 3D моделей из фотографий",
  "icons": [
    {
      "src": "favicon.ico",
      "sizes": "64x64 32x32 24x24 16x16",
      "type": "image/x-icon"
    },
    {
      "src": "logo192.png",
      "type": "image/png",
      "sizes": "192x192"
    },
    {
      "src": "logo512.png",
      "type": "image/png",
      "sizes": "512x512"
    }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#667eea",
  "background_color": "#764ba2"
}' > public/manifest.json && \
    # Создаем robots.txt
    echo '# https://www.robotstxt.org/robotstxt.html
User-agent: *
Disallow:' > public/robots.txt && \
    # Создаем пустые файлы для иконок
    touch public/favicon.ico public/logo192.png public/logo512.png && \
    # Запускаем сборку
    npm run build

# Создаем директории для загрузок
RUN mkdir -p backend/uploads/input backend/uploads/output

# Устанавливаем переменные окружения
ENV NODE_ENV=production
ENV PORT=3001

# Открываем порт
EXPOSE 3001

# Копируем скрипт запуска
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Запускаем приложение
CMD ["/app/start.sh"]
