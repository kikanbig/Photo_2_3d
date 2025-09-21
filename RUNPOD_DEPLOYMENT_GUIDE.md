# Полная инструкция по развертыванию Image-to-3D на RunPod

## 🎯 Цель
Развернуть сервис Image-to-3D на RunPod, который преобразует фотографии в 3D модели (GLB формат).

## 📋 Что у нас есть

### ✅ Локальное тестирование
- ✅ Упрощенная версия работает локально
- ✅ Создает OBJ, GLB, PLY файлы
- ✅ Протестировано с изображением дивана `4879854.jpg`

### 📁 Файлы для развертывания
- `simple_image_to_3d.py` - упрощенная генерация 3D
- `runpod_simple_api.py` - API сервер для RunPod
- `Dockerfile.runpod.simple` - оптимизированный Dockerfile
- `4879854.jpg` - тестовое изображение дивана

## 🚀 Пошаговая инструкция развертывания

### Шаг 1: Создание GitHub репозитория

1. **Создай новый репозиторий на GitHub:**
   - Название: `photo-to-3d-runpod`
   - Описание: `Image-to-3D service for RunPod`
   - Публичный или приватный (на твой выбор)

2. **Загрузи файлы в репозиторий:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Image-to-3D service for RunPod"
   git branch -M main
   git remote add origin https://github.com/ТВОЙ_USERNAME/photo-to-3d-runpod.git
   git push -u origin main
   ```

### Шаг 2: Настройка RunPod

1. **Зайди на [RunPod.io](https://runpod.io)**
2. **Войди в аккаунт** (создай, если нет)
3. **Перейди в раздел "Serverless"**
4. **Нажми "Create New Endpoint"**

### Шаг 3: Конфигурация Endpoint

1. **Выбери "Custom Docker Image"**
2. **Вставь URL твоего GitHub репозитория:**
   ```
   https://github.com/ТВОЙ_USERNAME/photo-to-3d-runpod.git
   ```

3. **Настрой Dockerfile:**
   - Выбери `Dockerfile.runpod.simple` как основной Dockerfile

4. **Выбери GPU:**
   - **Рекомендуется:** RTX 3080/3090 (для экономии средств)
   - **Альтернатива:** RTX 4090 (лучшая производительность)
   - **Избегай:** A100 (дорого для тестирования)

5. **Установи переменные окружения:**
   ```
   PYTHONPATH=/app
   ```

6. **Настрой ресурсы:**
   - **RAM:** 8-16 GB
   - **Storage:** 20-50 GB
   - **Timeout:** 300 секунд (5 минут)

### Шаг 4: Тестирование

1. **Дождись завершения сборки** (5-10 минут)
2. **Открой endpoint URL**
3. **Протестируй с изображением дивана:**

```json
{
  "input": {
    "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
  }
}
```

### Шаг 5: Использование API

#### Пример запроса:
```bash
curl -X POST "https://ТВОЙ_ENDPOINT_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
    }
  }'
```

#### Пример ответа:
```json
{
  "success": true,
  "message": "3D модель успешно сгенерирована (упрощенная версия)",
  "output_files": {
    "obj": "/app/outputs/runpod_output/mesh.obj",
    "glb": "/app/outputs/runpod_output/mesh.glb",
    "ply": "/app/outputs/runpod_output/mesh.ply"
  },
  "logs": "...",
  "output_directory": "/app/outputs/runpod_output",
  "note": "Это упрощенная версия для демонстрации. Для полной функциональности требуется GPU и дополнительные зависимости."
}
```

## 💰 Экономия средств

### С твоими $7 рекомендую:

1. **Используй RTX 3080/3090** вместо A100
2. **Настрой auto-scaling:**
   - Min instances: 0
   - Max instances: 1
   - Scale to zero: включено

3. **Используй spot instances** (если доступно)
4. **Настрой таймауты:**
   - Request timeout: 60 секунд
   - Container timeout: 300 секунд

## 🔧 Локальное тестирование

### Тест упрощенной версии:
```bash
# Активируй виртуальное окружение
source venv/bin/activate

# Запусти тест
python simple_image_to_3d.py 4879854.jpg test_outputs

# Проверь результаты
ls -la test_outputs/
```

### Тест API сервера:
```bash
# Запусти API сервер
python runpod_simple_api.py

# В другом терминале протестируй
python runpod_simple_api.py test
```

## 📊 Ожидаемые результаты

### ✅ Что работает:
- ✅ Преобразование изображения в 3D модель
- ✅ Создание OBJ, GLB, PLY файлов
- ✅ API для RunPod
- ✅ Обработка base64 изображений

### ⚠️ Ограничения упрощенной версии:
- Создает простую геометрию (куб)
- Не использует AI для анализа изображения
- Не требует GPU (работает на CPU)

### 🚀 Для полной функциональности:
- Нужен GPU с CUDA
- Установка всех зависимостей EmbodiedGen
- Больше времени на генерацию (5-10 минут)

## 🆘 Решение проблем

### Проблема: Ошибка сборки Docker
**Решение:** Проверь, что все файлы загружены в GitHub

### Проблема: Timeout при запросе
**Решение:** Увеличь timeout в настройках RunPod

### Проблема: Недостаточно памяти
**Решение:** Увеличь RAM в настройках GPU

### Проблема: Высокие расходы
**Решение:** Используй более дешевые GPU и настрой auto-scaling

## 📈 Следующие шаги

1. **Протестируй развертывание** с упрощенной версией
2. **Проверь работу API** с твоим изображением дивана
3. **Оптимизируй настройки** для экономии средств
4. **Рассмотри полную версию** после успешного тестирования

## 🎉 Готово!

Теперь у тебя есть полная система для развертывания Image-to-3D на RunPod. Начни с упрощенной версии, протестируй, а затем переходи к полной функциональности!
