#!/bin/bash

# Проверяем наличие папки public
if [ ! -d "public" ]; then
  echo "Создаем папку public..."
  mkdir -p public
fi

# Проверяем наличие index.html
if [ ! -f "public/index.html" ]; then
  echo "Создаем index.html..."
  cat > public/index.html << 'EOL'
<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#667eea" />
    <meta
      name="description"
      content="Photo to 3D - Превращайте фотографии в 3D модели с помощью ИИ"
    />
    <link rel="apple-touch-icon" href="%PUBLIC_URL%/logo192.png" />
    <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />
    <title>Photo to 3D - Генерация 3D моделей</title>
  </head>
  <body>
    <noscript>Для работы этого приложения необходимо включить JavaScript.</noscript>
    <div id="root"></div>
  </body>
</html>
EOL
fi

# Проверяем наличие manifest.json
if [ ! -f "public/manifest.json" ]; then
  echo "Создаем manifest.json..."
  cat > public/manifest.json << 'EOL'
{
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
}
EOL
fi

# Проверяем наличие robots.txt
if [ ! -f "public/robots.txt" ]; then
  echo "Создаем robots.txt..."
  cat > public/robots.txt << 'EOL'
# https://www.robotstxt.org/robotstxt.html
User-agent: *
Disallow:
EOL
fi

# Создаем пустые файлы для иконок, если их нет
touch public/favicon.ico
touch public/logo192.png
touch public/logo512.png

# Запускаем сборку
echo "Запускаем сборку React приложения..."
npm run build
