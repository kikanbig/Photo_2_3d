# Используем стабильный PyTorch образ вместо проблемного embodiedgen
FROM pytorch/pytorch:2.1.0-cuda11.8-cudnn8-devel

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

# Устанавливаем Python зависимости поэтапно для лучшей диагностики
RUN pip install --no-cache-dir --upgrade pip

# Основные зависимости
RUN pip install --no-cache-dir \
    runpod \
    trimesh \
    opencv-python \
    imageio \
    imageio-ffmpeg \
    rembg==2.0.61 \
    moviepy==1.0.3 \
    pymeshfix==0.17.0 \
    pyvista==0.36.1 \
    openai==1.58.1 \
    transformers==4.42.4 \
    gradio==5.12.0 \
    sentencepiece==0.2.0 \
    diffusers==0.34.0 \
    onnxruntime==1.20.1 \
    tenacity \
    accelerate==0.33.0 \
    basicsr==1.4.2 \
    realesrgan==0.3.0 \
    pydantic==2.9.2 \
    vtk==9.3.1 \
    spaces \
    colorlog \
    json-repair \
    scikit-learn \
    omegaconf \
    tyro \
    pyquaternion \
    shapely \
    typing_extensions==4.14.1

# Устанавливаем сложные зависимости отдельно
RUN pip install --no-cache-dir \
    xatlas \
    igraph==0.11.8

# Устанавливаем nvdiffrast из GitHub
RUN pip install --no-cache-dir git+https://github.com/NVlabs/nvdiffrast.git

# Устанавливаем EmbodiedGen зависимости
RUN pip install --no-cache-dir \
    sapien==3.0.0b1 \
    coacd \
    mani_skill==3.0.0b21

# Устанавливаем utils3d
RUN pip install --no-cache-dir utils3d

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