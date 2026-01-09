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
    Конвертирует GLB в USDZ используя trimesh
    USDZ = ZIP архив с USDC файлом внутри
    """
    import trimesh
    import zipfile
    
    with tempfile.NamedTemporaryFile(suffix='.glb', delete=False) as glb_file:
        glb_file.write(glb_data)
        glb_path = glb_file.name
    
    usdc_path = None
    try:
        # Загружаем GLB
        logger.info(f"📦 Загрузка GLB: {len(glb_data)} байт")
        scene = trimesh.load(glb_path)
        
        # Если это Scene, берём все meshes
        if isinstance(scene, trimesh.Scene):
            logger.info(f"📊 Загружена сцена с {len(scene.geometry)} объектами")
        else:
            logger.info(f"📊 Загружен mesh: {type(scene)}")
        
        # Экспортируем в USDC (бинарный USD)
        with tempfile.NamedTemporaryFile(suffix='.usdc', delete=False) as usdc_file:
            usdc_path = usdc_file.name
        
        scene.export(usdc_path, file_type='usdc')
        logger.info(f"✅ USDC создан: {usdc_path}")
        
        # Читаем USDC файл
        with open(usdc_path, 'rb') as f:
            usdc_data = f.read()
        
        logger.info(f"📦 USDC размер: {len(usdc_data)} байт")
        
        # Создаём USDZ (ZIP архив с USDC внутри)
        # USDZ должен быть без сжатия (ZIP_STORED) для iOS
        usdz_buffer = io.BytesIO()
        with zipfile.ZipFile(usdz_buffer, 'w', zipfile.ZIP_STORED) as zf:
            # Главный файл должен называться model.usdc
            zf.writestr('model.usdc', usdc_data)
        
        usdz_data = usdz_buffer.getvalue()
        logger.info(f"✅ USDZ создан: {len(usdz_data)} байт")
        
        return usdz_data
        
    finally:
        if os.path.exists(glb_path):
            os.unlink(glb_path)
        if usdc_path and os.path.exists(usdc_path):
            os.unlink(usdc_path)


def convert_glb_to_usdz_pxr(glb_data: bytes) -> bytes:
    """
    Конвертирует GLB в USDZ используя trimesh для загрузки и pxr для экспорта
    С материалами и правильной упаковкой для iOS AR Quick Look
    """
    import trimesh
    import numpy as np
    
    try:
        from pxr import Usd, UsdGeom, UsdShade, Vt, Gf, Sdf, UsdUtils
    except ImportError as e:
        logger.error(f"❌ pxr не доступен: {e}")
        raise
    
    # Загружаем GLB через trimesh
    with tempfile.NamedTemporaryFile(suffix='.glb', delete=False) as glb_file:
        glb_file.write(glb_data)
        glb_path = glb_file.name
    
    usdc_path = None
    usdz_path = None
    try:
        logger.info(f"📦 Загрузка GLB через trimesh: {len(glb_data)} байт")
        scene = trimesh.load(glb_path)
        
        # Получаем все меши из сцены
        if isinstance(scene, trimesh.Scene):
            meshes = list(scene.geometry.values())
            logger.info(f"📊 Сцена содержит {len(meshes)} мешей")
        else:
            meshes = [scene]
            logger.info(f"📊 Загружен один меш")
        
        # Создаём временные файлы
        with tempfile.NamedTemporaryFile(suffix='.usdc', delete=False) as f:
            usdc_path = f.name
        with tempfile.NamedTemporaryFile(suffix='.usdz', delete=False) as f:
            usdz_path = f.name
        
        # Создаём USD stage
        stage = Usd.Stage.CreateNew(usdc_path)
        UsdGeom.SetStageUpAxis(stage, UsdGeom.Tokens.y)
        UsdGeom.SetStageMetersPerUnit(stage, 1.0)
        
        # Создаём корневой xform и устанавливаем как default prim
        root_xform = UsdGeom.Xform.Define(stage, '/Root')
        stage.SetDefaultPrim(root_xform.GetPrim())
        
        # Создаём базовый PBR материал для всех мешей
        material_path = '/Root/Material'
        material = UsdShade.Material.Define(stage, material_path)
        
        # PBR Surface shader
        shader = UsdShade.Shader.Define(stage, f'{material_path}/PBRShader')
        shader.CreateIdAttr('UsdPreviewSurface')
        
        # Базовый серый цвет (нейтральный)
        shader.CreateInput('diffuseColor', Sdf.ValueTypeNames.Color3f).Set(Gf.Vec3f(0.7, 0.7, 0.7))
        shader.CreateInput('roughness', Sdf.ValueTypeNames.Float).Set(0.5)
        shader.CreateInput('metallic', Sdf.ValueTypeNames.Float).Set(0.0)
        
        # Связываем shader с материалом
        material.CreateSurfaceOutput().ConnectToSource(shader.ConnectableAPI(), 'surface')
        
        total_vertices = 0
        total_faces = 0
        
        # Добавляем каждый меш
        for i, mesh in enumerate(meshes):
            if not hasattr(mesh, 'vertices') or not hasattr(mesh, 'faces'):
                logger.warning(f"⚠️ Меш {i} не имеет vertices/faces, пропускаем")
                continue
            
            mesh_path = f'/Root/Mesh_{i}'
            usd_mesh = UsdGeom.Mesh.Define(stage, mesh_path)
            
            # Вершины
            vertices = mesh.vertices.tolist()
            points = Vt.Vec3fArray([Gf.Vec3f(float(v[0]), float(v[1]), float(v[2])) for v in vertices])
            usd_mesh.GetPointsAttr().Set(points)
            
            # Грани
            faces = mesh.faces
            face_vertex_counts = Vt.IntArray([3] * len(faces))
            face_vertex_indices = Vt.IntArray(faces.flatten().tolist())
            
            usd_mesh.GetFaceVertexCountsAttr().Set(face_vertex_counts)
            usd_mesh.GetFaceVertexIndicesAttr().Set(face_vertex_indices)
            
            # Нормали
            if hasattr(mesh, 'vertex_normals') and mesh.vertex_normals is not None:
                normals = mesh.vertex_normals.tolist()
                normal_array = Vt.Vec3fArray([Gf.Vec3f(float(n[0]), float(n[1]), float(n[2])) for n in normals])
                usd_mesh.GetNormalsAttr().Set(normal_array)
                usd_mesh.SetNormalsInterpolation(UsdGeom.Tokens.vertex)
            
            # Привязываем материал к мешу
            UsdShade.MaterialBindingAPI(usd_mesh).Bind(material)
            
            # Цвет вершин (если есть) - для визуализации
            if hasattr(mesh, 'visual') and hasattr(mesh.visual, 'vertex_colors'):
                try:
                    colors = mesh.visual.vertex_colors[:, :3] / 255.0  # RGB, нормализуем
                    color_array = Vt.Vec3fArray([Gf.Vec3f(float(c[0]), float(c[1]), float(c[2])) for c in colors])
                    usd_mesh.GetDisplayColorAttr().Set(color_array)
                    logger.info(f"  Меш {i}: добавлены vertex colors")
                except Exception as e:
                    logger.warning(f"  Меш {i}: не удалось добавить vertex colors: {e}")
            
            total_vertices += len(vertices)
            total_faces += len(faces)
            
            logger.info(f"  Меш {i}: {len(vertices)} вершин, {len(faces)} граней")
        
        stage.Save()
        logger.info(f"✅ USDC создан: {total_vertices} вершин, {total_faces} граней")
        
        # Используем официальную функцию для создания USDZ
        # Это гарантирует правильный формат для iOS AR Quick Look
        success = UsdUtils.CreateNewUsdzPackage(
            Sdf.AssetPath(usdc_path),
            usdz_path
        )
        
        if not success:
            raise Exception("UsdUtils.CreateNewUsdzPackage вернул False")
        
        # Читаем готовый USDZ
        with open(usdz_path, 'rb') as f:
            usdz_data = f.read()
        
        logger.info(f"✅ USDZ создан (UsdUtils): {len(usdz_data)} байт ({len(usdz_data)/1024/1024:.2f} MB)")
        
        return usdz_data
        
    finally:
        if os.path.exists(glb_path):
            os.unlink(glb_path)
        if usdc_path and os.path.exists(usdc_path):
            os.unlink(usdc_path)
        if usdz_path and os.path.exists(usdz_path):
            os.unlink(usdz_path)


def convert_glb_to_usdz(glb_data: bytes) -> bytes:
    """
    Главная функция конвертации GLB → USDZ
    Пробует разные методы
    """
    errors = []
    
    # Метод 1: trimesh
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

