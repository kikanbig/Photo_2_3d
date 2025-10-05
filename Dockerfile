# Используем совместимую версию PyTorch для xformers
FROM pytorch/pytorch:2.4.0-cuda12.1-cudnn8-devel

# Переключаемся на root для установки зависимостей
USER root

# Обновляем систему и устанавливаем системные зависимости
RUN apt-get update && apt-get install -y \
    git \
    wget \
    curl \
    build-essential \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libavcodec-dev \
    libavformat-dev \
    libswscale-dev \
    libv4l-dev \
    libxvidcore-dev \
    libx264-dev \
    libjpeg-dev \
    libpng-dev \
    libtiff-dev \
    libatlas-base-dev \
    gfortran \
    && rm -rf /var/lib/apt/lists/*

# Создаем рабочую директорию
WORKDIR /app

# Копируем файлы проекта
COPY . /app/

# Устанавливаем Python зависимости из requirements.txt
RUN pip install --no-cache-dir --upgrade pip

# Устанавливаем зависимости из requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Устанавливаем дополнительные зависимости, которых нет в requirements.txt
RUN pip install --no-cache-dir \
    utils3d \
    git+https://github.com/NVlabs/nvdiffrast.git

# Устанавливаем EmbodiedGen в development mode
RUN pip install -e .

# Создаем пользователя для безопасности
RUN useradd -m -u 1000 e_user && \
    chown -R e_user:e_user /app

# Устанавливаем переменные окружения
ENV PYTHONPATH=/app
ENV CUDA_VISIBLE_DEVICES=0
ENV PYTHONUNBUFFERED=1

# Переключаемся на пользователя
USER e_user

# Запуск
CMD ["python", "api.py"]