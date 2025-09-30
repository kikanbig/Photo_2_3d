# Используем готовый образ EmbodiedGen
FROM wangxinjie/embodiedgen:v0.1.x

# Переключаемся на root
USER root

# Устанавливаем runpod
RUN pip install runpod

# Копируем API файл
COPY api.py /app/api.py

# Делаем исполняемым
RUN chmod +x /app/api.py

# Устанавливаем переменные окружения
ENV PYTHONPATH=/app
ENV CUDA_VISIBLE_DEVICES=0
ENV PYTHONUNBUFFERED=1

# Переключаемся обратно
USER e_user

# Запуск
CMD ["python", "/app/api.py"]