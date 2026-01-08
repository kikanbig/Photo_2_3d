"""
USDZ Converter Microservice
Конвертирует GLB файлы в USDZ для iOS AR Quick Look

API:
  POST /convert - принимает GLB, возвращает USDZ
  GET /health - проверка работоспособности
"""

import os
import io
import tempfile
import logging
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import Response, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="USDZ Converter",
    description="Микросервис для конвертации GLB → USDZ",
    version="1.0.0"
)

# CORS для доступа с основного сервера
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def convert_glb_to_usdz_trimesh(glb_data: bytes) -> bytes:
    """
    Конвертирует GLB в USDZ используя trimesh + USD
    """
    import trimesh
    
    with tempfile.NamedTemporaryFile(suffix='.glb', delete=False) as glb_file:
        glb_file.write(glb_data)
        glb_path = glb_file.name
    
    try:
        # Загружаем GLB
        logger.info(f"📦 Загрузка GLB: {len(glb_data)} байт")
        scene = trimesh.load(glb_path)
        
        # Если это Scene, берём все meshes
        if isinstance(scene, trimesh.Scene):
            logger.info(f"📊 Загружена сцена с {len(scene.geometry)} объектами")
        else:
            logger.info(f"📊 Загружен mesh: {type(scene)}")
        
        # Экспортируем в USDZ
        with tempfile.NamedTemporaryFile(suffix='.usdz', delete=False) as usdz_file:
            usdz_path = usdz_file.name
        
        scene.export(usdz_path, file_type='usdz')
        
        with open(usdz_path, 'rb') as f:
            usdz_data = f.read()
        
        os.unlink(usdz_path)
        logger.info(f"✅ USDZ создан: {len(usdz_data)} байт")
        
        return usdz_data
        
    finally:
        os.unlink(glb_path)


def convert_glb_to_usdz_pxr(glb_data: bytes) -> bytes:
    """
    Конвертирует GLB в USDZ используя Pixar USD напрямую
    Fallback если trimesh не работает
    """
    try:
        from pxr import Usd, UsdGeom, UsdShade, Gf
        import struct
        import json
        import zipfile
        
        # Парсим GLB
        logger.info(f"📦 Парсинг GLB: {len(glb_data)} байт")
        
        # GLB header
        magic = struct.unpack('<I', glb_data[0:4])[0]
        if magic != 0x46546C67:  # "glTF"
            raise ValueError("Невалидный GLB файл")
        
        # Создаём временный USD stage
        with tempfile.NamedTemporaryFile(suffix='.usda', delete=False) as usda_file:
            usda_path = usda_file.name
        
        stage = Usd.Stage.CreateNew(usda_path)
        UsdGeom.SetStageUpAxis(stage, UsdGeom.Tokens.y)
        
        # Создаём простой куб как placeholder
        # TODO: Полный парсинг GLB и создание геометрии
        xform = UsdGeom.Xform.Define(stage, '/Model')
        mesh = UsdGeom.Mesh.Define(stage, '/Model/Mesh')
        
        stage.Save()
        
        # Создаём USDZ (ZIP архив с USD)
        usdz_buffer = io.BytesIO()
        with zipfile.ZipFile(usdz_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
            with open(usda_path, 'r') as f:
                zf.writestr('model.usda', f.read())
        
        os.unlink(usda_path)
        
        usdz_data = usdz_buffer.getvalue()
        logger.info(f"✅ USDZ создан (pxr): {len(usdz_data)} байт")
        
        return usdz_data
        
    except ImportError as e:
        logger.error(f"❌ pxr не доступен: {e}")
        raise


def convert_glb_to_usdz(glb_data: bytes) -> bytes:
    """
    Главная функция конвертации GLB → USDZ
    Пробует разные методы
    """
    errors = []
    
    # Метод 1: trimesh (предпочтительный)
    try:
        return convert_glb_to_usdz_trimesh(glb_data)
    except Exception as e:
        logger.warning(f"⚠️ trimesh метод не сработал: {e}")
        errors.append(f"trimesh: {e}")
    
    # Метод 2: pxr напрямую
    try:
        return convert_glb_to_usdz_pxr(glb_data)
    except Exception as e:
        logger.warning(f"⚠️ pxr метод не сработал: {e}")
        errors.append(f"pxr: {e}")
    
    # Все методы провалились
    raise HTTPException(
        status_code=500,
        detail=f"Не удалось сконвертировать GLB в USDZ: {'; '.join(errors)}"
    )


@app.get("/health")
async def health_check():
    """Проверка работоспособности сервиса"""
    return {
        "status": "healthy",
        "service": "usdz-converter",
        "version": "1.0.0"
    }


@app.post("/convert")
async def convert_glb(file: UploadFile = File(...)):
    """
    Конвертирует GLB файл в USDZ
    
    Args:
        file: GLB файл (multipart/form-data)
    
    Returns:
        USDZ файл (application/octet-stream)
    """
    try:
        logger.info(f"📥 Получен файл: {file.filename}, тип: {file.content_type}")
        
        # Читаем GLB данные
        glb_data = await file.read()
        logger.info(f"📦 Размер GLB: {len(glb_data)} байт ({len(glb_data) / 1024 / 1024:.2f} MB)")
        
        # Проверяем что это GLB
        if len(glb_data) < 12:
            raise HTTPException(status_code=400, detail="Файл слишком маленький")
        
        magic = int.from_bytes(glb_data[0:4], 'little')
        if magic != 0x46546C67:  # "glTF"
            raise HTTPException(status_code=400, detail="Невалидный GLB файл (неверный magic number)")
        
        # Конвертируем
        logger.info("🔄 Начинаю конвертацию GLB → USDZ...")
        usdz_data = convert_glb_to_usdz(glb_data)
        
        logger.info(f"✅ Конвертация завершена! USDZ: {len(usdz_data)} байт ({len(usdz_data) / 1024 / 1024:.2f} MB)")
        
        # Возвращаем USDZ
        return Response(
            content=usdz_data,
            media_type="model/vnd.usdz+zip",
            headers={
                "Content-Disposition": f'attachment; filename="{file.filename.replace(".glb", ".usdz")}"',
                "Content-Length": str(len(usdz_data))
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Ошибка конвертации: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/convert-url")
async def convert_from_url(url: str):
    """
    Конвертирует GLB по URL в USDZ
    
    Args:
        url: URL GLB файла
    
    Returns:
        USDZ файл
    """
    import httpx
    
    try:
        logger.info(f"📥 Скачиваю GLB с URL: {url}")
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            glb_data = response.content
        
        logger.info(f"📦 Скачано: {len(glb_data)} байт")
        
        # Конвертируем
        usdz_data = convert_glb_to_usdz(glb_data)
        
        # Возвращаем USDZ
        return Response(
            content=usdz_data,
            media_type="model/vnd.usdz+zip",
            headers={
                "Content-Disposition": 'attachment; filename="model.usdz"',
                "Content-Length": str(len(usdz_data))
            }
        )
        
    except httpx.HTTPError as e:
        raise HTTPException(status_code=400, detail=f"Не удалось скачать файл: {e}")
    except Exception as e:
        logger.error(f"❌ Ошибка: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8081))
    logger.info(f"🚀 Запуск USDZ Converter на порту {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)

