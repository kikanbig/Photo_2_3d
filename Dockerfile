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
RUN cd frontend && chmod +x build.sh && ./build.sh

# Создаем директории для загрузок
RUN mkdir -p backend/uploads/input backend/uploads/output

# Устанавливаем переменные окружения
ENV NODE_ENV=production
ENV PORT=3001

# Открываем порт
EXPOSE 3001

# Запускаем приложение
CMD ["node", "backend/server.js"]
