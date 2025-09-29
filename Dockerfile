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

# Устанавливаем кастомный растеризатор (как в Hugging Face Space)
RUN pip install https://huggingface.co/spaces/imagine-io-webinar/image-to-3d/resolve/main/custom_rasterizer-0.1-cp310-cp310-linux_x86_64.whl

# Проверяем установку
RUN python -c "import custom_rasterizer; print('Custom rasterizer installed successfully')"

# Копируем API файл и torchvision fix
COPY api.py /app/api.py
COPY torchvision_fix.py /app/torchvision_fix.py

# Делаем исполняемыми
RUN chmod +x /app/api.py
RUN chmod +x /app/torchvision_fix.py

# Устанавливаем переменные окружения
ENV PYTHONPATH=/app:/EmbodiedGen
ENV CUDA_VISIBLE_DEVICES=0
ENV PYTHONUNBUFFERED=1

# Переключаемся обратно
USER e_user

# Запуск
CMD ["python", "/app/api.py"]