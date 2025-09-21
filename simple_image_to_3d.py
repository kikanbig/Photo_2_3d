#!/usr/bin/env python3
"""
Упрощенная версия Image-to-3D для тестирования
"""

import os
import sys
import logging
from pathlib import Path

# Настройка логирования
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def create_simple_3d_model(image_path, output_dir):
    """
    Создает простую 3D модель из изображения
    """
    logger.info(f"Создание 3D модели из изображения: {image_path}")
    
    # Создаем выходную директорию
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Создаем простой OBJ файл (куб)
    obj_content = """# Simple 3D Model generated from image
# Vertices
v -1.0 -1.0 -1.0
v  1.0 -1.0 -1.0
v  1.0  1.0 -1.0
v -1.0  1.0 -1.0
v -1.0 -1.0  1.0
v  1.0 -1.0  1.0
v  1.0  1.0  1.0
v -1.0  1.0  1.0

# Faces
f 1 2 3 4
f 5 8 7 6
f 1 5 6 2
f 2 6 7 3
f 3 7 8 4
f 5 1 4 8
"""
    
    # Сохраняем OBJ файл
    obj_file = output_path / "mesh.obj"
    with open(obj_file, 'w') as f:
        f.write(obj_content)
    
    logger.info(f"OBJ файл создан: {obj_file}")
    
    # Создаем простой GLB файл (текстовый формат для демонстрации)
    glb_content = """# GLB file content (simplified)
# This is a placeholder GLB file
# In a real implementation, this would be a binary GLB file
"""
    
    glb_file = output_path / "mesh.glb"
    with open(glb_file, 'w') as f:
        f.write(glb_content)
    
    logger.info(f"GLB файл создан: {glb_file}")
    
    # Создаем PLY файл
    ply_content = """ply
format ascii 1.0
element vertex 8
property float x
property float y
property float z
element face 6
property list uchar int vertex_indices
end_header
-1.0 -1.0 -1.0
 1.0 -1.0 -1.0
 1.0  1.0 -1.0
-1.0  1.0 -1.0
-1.0 -1.0  1.0
 1.0 -1.0  1.0
 1.0  1.0  1.0
-1.0  1.0  1.0
4 0 1 2 3
4 4 7 6 5
4 0 4 5 1
4 1 5 6 2
4 2 6 7 3
4 4 0 3 7
"""
    
    ply_file = output_path / "mesh.ply"
    with open(ply_file, 'w') as f:
        f.write(ply_content)
    
    logger.info(f"PLY файл создан: {ply_file}")
    
    return {
        "obj": str(obj_file),
        "glb": str(glb_file),
        "ply": str(ply_file)
    }

def main():
    """
    Основная функция
    """
    if len(sys.argv) < 2:
        print("Использование: python simple_image_to_3d.py <image_path> [output_dir]")
        sys.exit(1)
    
    image_path = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else "simple_outputs"
    
    if not os.path.exists(image_path):
        logger.error(f"Изображение не найдено: {image_path}")
        sys.exit(1)
    
    logger.info("🚀 Запуск упрощенной генерации 3D модели")
    logger.info("=" * 50)
    
    try:
        result = create_simple_3d_model(image_path, output_dir)
        
        logger.info("✅ Генерация завершена успешно!")
        logger.info("📁 Созданные файлы:")
        for format_name, file_path in result.items():
            logger.info(f"   - {format_name.upper()}: {file_path}")
        
        # Особое внимание к GLB файлу
        if "glb" in result:
            glb_file = result["glb"]
            size = os.path.getsize(glb_file)
            logger.info(f"🎯 GLB файл готов: {glb_file} ({size} байт)")
        
    except Exception as e:
        logger.error(f"❌ Ошибка: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
