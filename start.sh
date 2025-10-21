#!/bin/bash

# Проверяем наличие переменных окружения
if [ -z "$GENAPI_API_KEY" ]; then
  echo "⚠️ GENAPI_API_KEY не установлен! Используется тестовый ключ."
  export GENAPI_API_KEY="sk-nt14wDb0YEGeK0trh1rss8XIRc6ivSoxV0yKedgSeqeWPlSIIbqEVsRv2el1"
fi

# Устанавливаем FRONTEND_URL, если он не установлен
if [ -z "$FRONTEND_URL" ]; then
  echo "⚠️ FRONTEND_URL не установлен! Используется текущий хост."
  export FRONTEND_URL="https://$RAILWAY_PUBLIC_DOMAIN"
fi

# Создаем директории для загрузок, если их нет
mkdir -p backend/uploads/input backend/uploads/output

# Запускаем бэкенд
cd backend && node server.js
