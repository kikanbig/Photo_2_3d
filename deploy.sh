#!/bin/bash

echo "🚀 Развертывание Photo to 3D на Railway..."

# Проверяем, что мы в правильной директории
if [ ! -f "package.json" ] && [ ! -f "backend/package.json" ]; then
    echo "❌ Ошибка: Запустите скрипт из корневой директории проекта"
    exit 1
fi

# Проверяем Railway CLI
if ! command -v railway &> /dev/null; then
    echo "📦 Устанавливаем Railway CLI..."
    npm install -g @railway/cli
fi

# Входим в Railway (если не авторизованы)
echo "🔐 Проверяем авторизацию Railway..."
if ! railway whoami &> /dev/null; then
    echo "Войдите в Railway CLI:"
    railway login
fi

# Создаем проект Railway (если не существует)
echo "🏗️ Создаем проект Railway..."
if [ ! -f ".railway/project.json" ]; then
    railway init
fi

# Устанавливаем переменные окружения
echo "⚙️ Настраиваем переменные окружения..."
railway variables set NODE_ENV=production
railway variables set PORT=3001
railway variables set FRONTEND_URL=https://your-app.railway.app

echo "📝 Не забудьте установить GENAPI_API_KEY:"
echo "railway variables set GENAPI_API_KEY=your_api_key_here"

# Развертываем
echo "🚀 Развертываем приложение..."
railway up

echo "✅ Развертывание завершено!"
echo "🌐 Ваше приложение будет доступно по адресу, который покажет Railway"
