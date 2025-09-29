# Используем готовый образ EmbodiedGen
FROM wangxinjie/embodiedgen:v0.1.x

# Переключаемся на root
USER root

# Устанавливаем runpod
RUN pip install runpod

# Устанавливаем EmbodiedGen в development mode
WORKDIR /EmbodiedGen
RUN pip install -e .

# Устанавливаем зависимости из requirements.txt
RUN pip install -r requirements.txt

# Устанавливаем nvdiffrast из Git (как в оригинальном install_basic.sh)
RUN pip install nvdiffrast@git+https://github.com/NVlabs/nvdiffrast.git@729261d

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