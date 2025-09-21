# Image-to-3D Service для RunPod

Этот репозиторий содержит оптимизированную версию EmbodiedGen для развертывания на RunPod с фокусом на Image-to-3D функциональность.

## Что это делает

- Преобразует обычные фотографии в 3D модели
- Поддерживает форматы вывода: .obj, .glb, .ply, .urdf
- Работает через API на RunPod

## Быстрый старт

### 1. Создание репозитория на GitHub

1. Создай новый репозиторий на GitHub
2. Загрузи все файлы из этого проекта
3. Скопируй URL репозитория

### 2. Настройка RunPod

1. Зайди на [RunPod.io](https://runpod.io)
2. Перейди в раздел "Serverless"
3. Нажми "Create New Endpoint"
4. Выбери "Custom Docker Image"
5. Вставь URL твоего GitHub репозитория
6. Выбери GPU (рекомендуется RTX 3080/3090 для экономии)
7. Установи переменные окружения:
   - `CUDA_VISIBLE_DEVICES=0`
   - `PYTHONPATH=/app`

### 3. Использование API

После развертывания отправляй POST запросы на твой endpoint:

```json
{
  "input": {
    "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
  }
}
```

Ответ:
```json
{
  "success": true,
  "message": "3D модель успешно сгенерирована",
  "output_files": {
    "obj": "/app/outputs/runpod_output/result/mesh.obj",
    "glb": "/app/outputs/runpod_output/result/mesh.glb"
  },
  "logs": "...",
  "output_directory": "/app/outputs/runpod_output"
}
```

## Локальное тестирование

```bash
# Тест API
python runpod_api.py test

# Запуск сервера
python runpod_api.py
```

## Экономия средств

- Используй RTX 3080/3090 вместо A100
- Настрой auto-scaling
- Используй spot instances
- Кэшируй модели в persistent storage

## Структура файлов

- `Dockerfile.runpod` - оптимизированный Dockerfile для RunPod
- `runpod_api.py` - API сервер для обработки запросов
- `requirements.txt` - зависимости Python
- `apps/image_to_3d.py` - основной скрипт генерации 3D
