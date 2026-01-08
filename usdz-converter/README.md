# 🔄 USDZ Converter Microservice

Микросервис для конвертации GLB → USDZ для iOS AR Quick Look.

## 🚀 API

### `GET /health`
Проверка работоспособности.

**Response:**
```json
{
  "status": "healthy",
  "service": "usdz-converter",
  "version": "1.0.0"
}
```

### `POST /convert`
Конвертирует GLB файл в USDZ.

**Request:** `multipart/form-data`
- `file` - GLB файл

**Response:** USDZ файл (`model/vnd.usdz+zip`)

**Example:**
```bash
curl -X POST -F "file=@model.glb" http://localhost:8081/convert -o model.usdz
```

### `POST /convert-url?url=...`
Конвертирует GLB по URL в USDZ.

**Query params:**
- `url` - URL GLB файла

**Response:** USDZ файл

## 🐳 Локальный запуск

```bash
# Установка зависимостей
pip install -r requirements.txt

# Запуск
python main.py
```

## 🚂 Railway деплой

1. Создать новый сервис в Railway
2. Выбрать GitHub repo, папка `usdz-converter`
3. Railway автоматически найдёт Dockerfile
4. Получить URL сервиса: `https://your-service.railway.app`

## 🔧 Переменные окружения

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `PORT` | Порт сервера | `8081` |

## 📦 Зависимости

- **FastAPI** - Web framework
- **trimesh** - Загрузка 3D моделей
- **usd-core** - Pixar USD для создания USDZ
- **pygltflib** - Парсинг GLB

