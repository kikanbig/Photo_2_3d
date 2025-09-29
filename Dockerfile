# Используем готовый образ EmbodiedGen
FROM wangxinjie/embodiedgen:v0.1.x

# Переключаемся на root
USER root

# Устанавливаем runpod
RUN pip install runpod

# Устанавливаем EmbodiedGen в development mode
WORKDIR /EmbodiedGen
RUN pip install -e .

# Устанавливаем только основные зависимости (без проблемных)
RUN pip install trimesh opencv-python

# Проверяем, что доступно в базовом образе
RUN python -c "import sys; print('Python version:', sys.version)"
RUN python -c "import torch; print('PyTorch version:', torch.__version__)"
RUN python -c "try: import nvdiffrast.torch as dr; print('nvdiffrast available'); except: print('nvdiffrast not available')"

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