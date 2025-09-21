# Photo to 3D - RunPod Service

Преобразование фотографий в 3D модели с помощью AI для развертывания на RunPod.

## 🎯 Что это

Сервис для преобразования обычных фотографий в 3D модели (GLB, OBJ, PLY форматы) с возможностью развертывания на RunPod.

## 🚀 Быстрый старт

### Локальное тестирование

```bash
# Клонируй репозиторий
git clone https://github.com/kikanbig/Photo_2_3d.git
cd Photo_2_3d

# Создай виртуальное окружение
python3 -m venv venv
source venv/bin/activate

# Установи зависимости
pip install -r requirements.txt

# Протестируй с изображением дивана
python simple_image_to_3d.py 4879854.jpg test_outputs
```

### Развертывание на RunPod

1. Следуй инструкции в RUNPOD_DEPLOYMENT_GUIDE.md
2. Используй Dockerfile.runpod.simple для быстрого развертывания
3. Выбери RTX 3080/3090 для экономии средств

## 📁 Структура проекта

- simple_image_to_3d.py - Упрощенная генерация 3D
- runpod_simple_api.py - API сервер для RunPod
- Dockerfile.runpod.simple - Оптимизированный Dockerfile
- 4879854.jpg - Тестовое изображение дивана
- RUNPOD_DEPLOYMENT_GUIDE.md - Полная инструкция развертывания

## 🎨 Поддерживаемые форматы

- GLB - для веб-приложений и 3D просмотрщиков
- OBJ - универсальный формат 3D моделей
- PLY - формат для обработки облаков точек

## 💰 Экономия средств на RunPod

- Используй RTX 3080/3090 вместо A100
- Настрой auto-scaling (min: 0, max: 1)
- Используй spot instances
- Таймаут: 60 секунд

## 📚 Документация

- RUNPOD_DEPLOYMENT_GUIDE.md - Полная инструкция развертывания
- README_RUNPOD.md - README для RunPod

## 📄 Лицензия

Apache License 2.0