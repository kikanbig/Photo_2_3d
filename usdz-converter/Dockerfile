# USDZ Converter Microservice
# Python сервис для конвертации GLB → USDZ
# Cache bust: v2

FROM python:3.11-slim

WORKDIR /app

# Установка системных зависимостей для USD
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglx-mesa0 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    && rm -rf /var/lib/apt/lists/*

# Cache invalidation - change this to force rebuild
ARG CACHEBUST=2

# Копируем requirements и устанавливаем зависимости
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем код
COPY main.py .

# Порт
ENV PORT=8081
EXPOSE 8081

# Запуск
CMD ["python", "main.py"]

