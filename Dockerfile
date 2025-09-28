# Используем готовый образ EmbodiedGen
FROM wangxinjie/embodiedgen:v0.1.x

# Переключаемся на root
USER root

# Устанавливаем runpod
RUN pip install runpod trimesh

# Копируем API файл
COPY api.py /app/api.py

# Делаем исполняемым
RUN chmod +x /app/api.py

# Переключаемся обратно
USER e_user

# Запуск
CMD ["python", "/app/api.py"]