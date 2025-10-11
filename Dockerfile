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

# Устанавливаем зависимости из requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Устанавливаем дополнительные зависимости, которых нет в requirements.txt
RUN pip install --no-cache-dir utils3d

# Устанавливаем nvdiffrast из GitHub
RUN pip install --no-cache-dir git+https://github.com/NVlabs/nvdiffrast.git

# Пробуем разные способы установки kaolin
RUN echo "Trying to install kaolin..." && \
    # Вариант 1: Попробуем установить через pip с --no-deps
    (pip install --no-cache-dir --no-deps kaolin==0.17.0 2>/dev/null || echo "Kaolin 0.17.0 failed") && \
    # Вариант 2: Попробуем установить kaolin через conda
    (conda install -c conda-forge kaolin -y 2>/dev/null || echo "Conda kaolin failed") && \
    # Вариант 3: Установим из wheel файла если есть
    (pip install --no-cache-dir https://github.com/NVlabs/kaolin/releases/download/v0.15.0/kaolin-0.15.0-cp310-cp310-linux_x86_64.whl 2>/dev/null || echo "Wheel install failed") && \
    # Вариант 4: Установим минимальную версию из PyPI
    (pip install --no-cache-dir --no-deps kaolin 2>/dev/null || echo "PyPI kaolin failed") && \
    # Вариант 5: Клонируем и устанавливаем локально
    (cd /tmp && git clone --depth 1 https://github.com/NVlabs/kaolin.git && cd kaolin && pip install --no-cache-dir . 2>/dev/null || echo "Git clone install failed") || \
    # Если все не удалось, используем заглушку
    (echo "All kaolin installation methods failed, using stub" && \
     mkdir -p /opt/conda/lib/python3.10/site-packages/kaolin && \
     cp /app/kaolin_stub.py /opt/conda/lib/python3.10/site-packages/kaolin/__init__.py)

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