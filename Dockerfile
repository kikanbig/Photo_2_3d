# Используем доступную версию PyTorch
FROM pytorch/pytorch:2.1.0-cuda11.8-cudnn8-devel

# Переключаемся на root для установки зависимостей
USER root

# Устанавливаем переменные окружения для избежания интерактивных запросов
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=UTC

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

# Устанавливаем необходимые зависимости для сборки kaolin ПЕРЕД установкой Python пакетов
RUN apt-get update && apt-get install -y \
    ninja-build \
    && rm -rf /var/lib/apt/lists/*

# Устанавливаем зависимости из requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Устанавливаем дополнительные зависимости, которых нет в requirements.txt
RUN pip install --no-cache-dir utils3d

# Устанавливаем nvdiffrast из GitHub
RUN pip install --no-cache-dir git+https://github.com/NVlabs/nvdiffrast.git

# ВАЖНО: Удаляем placeholder kaolin если он был установлен как зависимость
RUN pip uninstall -y kaolin 2>/dev/null || true

# Устанавливаем git (нужен для kaolin)
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

# Клонируем и устанавливаем kaolin из GitHub (используем git:// протокол без авторизации)
RUN cd /tmp && \
    echo "Cloning kaolin repository using git protocol..." && \
    git clone --depth 1 --branch v0.15.0 https://github.com/NVlabs/kaolin && \
    cd kaolin && \
    echo "Building kaolin with CUDA support (this will take 5-10 minutes)..." && \
    FORCE_CUDA=1 python setup.py develop && \
    echo "✅ Kaolin installed successfully!" && \
    cd /tmp && rm -rf kaolin

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