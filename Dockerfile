# Используем готовый образ EmbodiedGen
FROM wangxinjie/embodiedgen:v0.1.x

# Переключаемся на root
USER root

# Устанавливаем runpod
RUN pip install runpod

# Устанавливаем недостающие зависимости
RUN pip install trimesh opencv-python spaces xatlas igraph pyvista utils3d

# Устанавливаем nvdiffrast из GitHub (недоступен через pip)
RUN pip install git+https://github.com/NVlabs/nvdiffrast.git

# Устанавливаем EmbodiedGen в development mode (без дополнительных зависимостей)
WORKDIR /EmbodiedGen
RUN pip install -e .

# Копируем API файл
COPY api.py /app/api.py

# Делаем исполняемым
RUN chmod +x /app/api.py

# Устанавливаем переменные окружения
ENV PYTHONPATH=/app:/EmbodiedGen
ENV CUDA_VISIBLE_DEVICES=0
ENV PYTHONUNBUFFERED=1

# Переключаемся обратно
USER e_user

# Запуск
CMD ["python", "/app/api.py"]