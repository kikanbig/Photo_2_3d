# 📖 API Документация - Photo to 3D v3.0

## 🔐 Аутентификация

На данный момент аутентификация не требуется. Все эндпоинты доступны без токенов.

**Базовый URL:**
- Development: `http://localhost:3001/api`
- Production: Автоматически определяется Railway

---

## 🚀 Генерация 3D моделей

### Загрузка изображения и запуск генерации

**POST** `/api/generation/upload`

Загружает изображение и запускает асинхронную генерацию 3D модели через GenAPI Trellis.

**Параметры запроса:**
- `image` (File) - Изображение (JPG, PNG, GIF, WebP)
- `dimensions` (JSON, опционально) - Размеры объекта для AR

**Пример запроса:**
```javascript
const formData = new FormData();
formData.append('image', imageFile);
formData.append('dimensions', JSON.stringify({
  length: 200,
  width: 100,
  height: 90,
  unit: 'cm'
}));

fetch('/api/generation/upload', {
  method: 'POST',
  body: formData
});
```

**Ответ:**
```json
{
  "success": true,
  "taskId": "uuid-task-id",
  "message": "Генерация запущена"
}
```

### Проверка статуса задачи

**GET** `/api/generation/status/:taskId`

Получает текущий статус асинхронной задачи генерации.

**Параметры:**
- `taskId` (string) - ID задачи из предыдущего запроса

**Ответ:**
```json
{
  "success": true,
  "task": {
    "id": "uuid-task-id",
    "status": "processing", // processing | completed | failed | timeout
    "progress": 75,
    "message": "Генерация в процессе...",
    "result": {
      "url": "https://gen-api.storage.yandexcloud.net/model.glb",
      "externalUrl": "https://gen-api.storage.yandexcloud.net/model.glb"
    },
    "error": null,
    "createdAt": "2025-01-01T12:00:00Z"
  }
}
```

**Статусы задач:**
- `processing` - Идет генерация
- `completed` - Готово, модель можно скачать
- `failed` - Ошибка генерации
- `timeout` - Время ожидания истекло

### Скачивание готовой модели

**GET** `/api/generation/download/:taskId`

Скачивает сгенерированную 3D модель в формате GLB.

**Параметры:**
- `taskId` (string) - ID задачи

**Заголовки ответа:**
```
Content-Type: model/gltf-binary
Content-Disposition: inline; filename="3d_model_{taskId}.glb"
```

### Информация о пользователе GenAPI

**GET** `/api/generation/user-info`

Получает информацию об аккаунте GenAPI (баланс, статус и т.д.).

**Ответ:**
```json
{
  "balance": "Неизвестно",
  "status": "active",
  "message": "API ключ работает"
}
```

---

## 📚 Управление моделями

### Получить все модели

**GET** `/api/models`

Возвращает список всех 3D моделей пользователя.

**Параметры запроса:**
- `limit` (number, опционально) - Количество моделей (по умолчанию 20)
- `offset` (number, опционально) - Смещение для пагинации
- `status` (string, опционально) - Фильтр по статусу

**Ответ:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-model-id",
      "name": "Моя модель",
      "modelUrl": "/api/models/uuid-task-id/download",
      "previewImageUrl": "/uploads/input/image.jpg",
      "originalImageUrl": "/uploads/input/original.jpg",
      "dimensions": {
        "length": 200,
        "width": 100,
        "height": 90,
        "unit": "cm"
      },
      "taskId": "uuid-task-id",
      "status": "active",
      "metadata": {
        "generationParams": {
          "ss_guidance_strength": 8.5,
          "texture_size": 2048
        }
      },
      "createdAt": "2025-01-01T12:00:00Z",
      "updatedAt": "2025-01-01T12:30:00Z"
    }
  ],
  "total": 1
}
```

### Получить конкретную модель

**GET** `/api/models/:id`

Возвращает детальную информацию о конкретной модели.

**Параметры:**
- `id` (string) - UUID модели

**Ответ:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-model-id",
    "name": "Моя модель",
    "description": "Описание модели",
    "modelUrl": "/api/models/uuid-task-id/download",
    "previewImageUrl": "/uploads/input/image.jpg",
    "originalImageUrl": "/uploads/input/original.jpg",
    "dimensions": {
      "length": 200,
      "width": 100,
      "height": 90,
      "unit": "cm"
    },
    "taskId": "uuid-task-id",
    "status": "active",
    "metadata": {
      "generationParams": {...},
      "fileSize": "3.5 MB",
      "verticesCount": 3412
    },
    "createdAt": "2025-01-01T12:00:00Z",
    "updatedAt": "2025-01-01T12:30:00Z"
  }
}
```

### Скачать GLB файл модели

**GET** `/api/models/:id/download`

Скачивает GLB файл 3D модели из базы данных.

**Параметры:**
- `id` (string) - taskId модели (НЕ UUID, а taskId из генерации)

**Особенности:**
- Модели хранятся в PostgreSQL как BLOB
- Автоматически масштабируются в 2 раза при сохранении
- Кэшируются на сервере (Cache-Control: 1 год)

**Заголовки ответа:**
```
Content-Type: model/gltf-binary
Content-Disposition: inline; filename="model_name.glb"
Cache-Control: public, max-age=31536000
```

### Сохранить модель в коллекцию

**POST** `/api/models`

Сохраняет сгенерированную модель в пользовательскую коллекцию.

**Тело запроса:**
```json
{
  "name": "Название модели",
  "description": "Описание модели (опционально)",
  "modelUrl": "https://external-url/model.glb",
  "previewImageUrl": "/uploads/input/preview.jpg",
  "originalImageUrl": "/uploads/input/original.jpg",
  "dimensions": {
    "length": 200,
    "width": 100,
    "height": 90,
    "unit": "cm"
  },
  "taskId": "uuid-task-id",
  "metadata": {
    "generationParams": {...},
    "customData": "..."
  }
}
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-model-id",
    "name": "Название модели",
    "modelUrl": "/api/models/uuid-task-id/download",
    "createdAt": "2025-01-01T12:00:00Z"
  }
}
```

### Обновить модель

**PUT** `/api/models/:id`

Обновляет информацию о модели.

**Тело запроса:** Аналогично созданию, но без `taskId` и `modelUrl`.

### Удалить модель

**DELETE** `/api/models/:id`

Помечает модель как удаленную (мягкое удаление).

**Ответ:**
```json
{
  "success": true,
  "message": "Модель удалена"
}
```

---

## 📁 Файловая структура

### Загруженные файлы
- `/uploads/input/` - Исходные изображения пользователей
- `/uploads/models/` - Сгенерированные GLB модели (если не в БД)
- `/uploads/temp/` - Временные файлы обработки

### Статические файлы
- `/uploads/input/*.jpg` - Доступны по URL `/uploads/input/*.jpg`
- `/uploads/models/*.glb` - Доступны по URL `/uploads/models/*.glb`

**Content-Type заголовки:**
- JPG/PNG/GIF/WebP изображения - соответствующий `image/*`
- GLB файлы - `model/gltf-binary`

---

## ⚙️ Параметры генерации Trellis

При создании модели можно настроить следующие параметры:

### Основные параметры

| Параметр | Описание | Диапазон | По умолчанию |
|----------|----------|----------|-------------|
| `ss_guidance_strength` | Сила наведения для точности следования изображению | 0-10 | 8.5 |
| `ss_sampling_steps` | Количество шагов выборки для качества формы | 1-50 | 50 |
| `slat_guidance_strength` | Сила SLAT-наведения для детализации геометрии | 0-10 | 4 |
| `slat_sampling_steps` | Количество шагов выборки для проработки деталей | 1-50 | 50 |
| `mesh_simplify` | Фактор упрощения сетки (0.98 = минимальное упрощение) | 0-0.98 | 0.98 |
| `texture_size` | Разрешение текстур в пикселях | 512-2048 | 2048 |

### Пример оптимальных настроек

```javascript
{
  "ss_guidance_strength": 8.5,    // Баланс качества и следования изображению
  "ss_sampling_steps": 50,        // Максимальное качество формы
  "slat_guidance_strength": 4,    // Детализация геометрии
  "slat_sampling_steps": 50,      // Максимальная детализация
  "mesh_simplify": 0.98,          // Минимальное упрощение
  "texture_size": 2048            // 2K текстуры
}
```

---

## 🔄 Обработка ошибок

### HTTP коды ответа

| Код | Описание | Причина |
|-----|----------|---------|
| 200 | Успешный запрос | Операция выполнена |
| 201 | Создано | Ресурс создан успешно |
| 400 | Неверный запрос | Ошибка в параметрах |
| 404 | Не найдено | Ресурс не существует |
| 500 | Внутренняя ошибка | Ошибка сервера/БД |

### Стандартный формат ошибок

```json
{
  "success": false,
  "error": "Описание ошибки",
  "details": "Дополнительная информация (опционально)"
}
```

### Общие ошибки

**400 Bad Request:**
- "Файл слишком большой!" - Превышен MAX_FILE_SIZE
- "Только изображения разрешены!" - Неверный тип файла
- "modelUrl обязателен" - Отсутствует URL модели

**404 Not Found:**
- "Модель не найдена" - Модель отсутствует в БД
- "GLB файл не найден" - Файл модели пустой
- "Задача не найдена" - TaskId не существует

**500 Internal Server Error:**
- "Ошибка скачивания файла: ..." - Проблема с загрузкой GLB
- "Не удалось подключиться к базе данных" - Проблема с PostgreSQL
- "API ключ не установлен" - Отсутствует GENAPI_API_KEY

---

## 📊 Мониторинг и логи

### Логи сервера
Сервер записывает подробные логи в консоль:

- 📥 Входящие запросы с параметрами
- ✅ Успешные операции (создание, скачивание)
- ❌ Ошибки с полным stack trace
- 📦 Информация о размерах файлов
- 🗄️ Статус подключения к БД

### Метрики производительности
- Размер GLB файлов в MB
- Время генерации модели
- Количество активных задач
- Использование памяти

---

## 🔒 Безопасность

### Ограничения файлов
- Максимальный размер: 10MB (настраивается)
- Разрешенные типы: JPG, PNG, GIF, WebP
- Валидация на сервере через Multer

### CORS
- Разрешены запросы с любого домена (`*`)
- Поддержка credentials для авторизации

### SQL Injection защита
- Sequelize ORM автоматически экранирует запросы
- Параметризованные запросы к БД

---

## 🚀 Производительность

### Оптимизации
- **Кэширование GLB файлов** (1 год)
- **Масштабирование в фоне** при сохранении в БД
- **Сжатие ответов** JSON
- **Pool соединений** PostgreSQL (max: 5)

### Рекомендации
- Используйте PostgreSQL с SSD хранилищем
- Настройте индексы для часто запрашиваемых полей
- Мониторьте размер БД (GLB файлы могут быть большими)

---

*📝 Последнее обновление: 25 октября 2025 | Версия API: 3.0*
