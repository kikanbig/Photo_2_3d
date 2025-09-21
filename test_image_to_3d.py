#!/usr/bin/env python3
"""
Тестовый скрипт для генерации 3D модели из изображения дивана
"""

import os
import sys
import subprocess
import json
from pathlib import Path
import logging

# Настройка логирования
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_image_to_3d():
    """
    Тестирует генерацию 3D модели из изображения дивана
    """
    
    # Путь к изображению дивана
    image_path = "4879854.jpg"
    
    # Проверяем, что изображение существует
    if not os.path.exists(image_path):
        logger.error(f"Изображение {image_path} не найдено!")
        return False
    
    # Создаем директорию для выходных файлов
    output_dir = Path("test_outputs")
    output_dir.mkdir(exist_ok=True)
    
    logger.info(f"Начинаем генерацию 3D модели из изображения: {image_path}")
    logger.info(f"Выходная директория: {output_dir}")
    
    # Команда для генерации 3D
    cmd = [
        "python", "apps/image_to_3d.py",
        "--image_path", image_path,
        "--output_root", str(output_dir),
        "--n_retry", "2"  # 2 попытки для лучшего качества
    ]
    
    try:
        logger.info("Запуск команды генерации...")
        logger.info(f"Команда: {' '.join(cmd)}")
        
        # Запуск процесса
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=600  # 10 минут таймаут
        )
        
        # Вывод результатов
        if result.returncode == 0:
            logger.info("✅ Генерация завершена успешно!")
            logger.info("STDOUT:")
            print(result.stdout)
            
            # Поиск сгенерированных файлов
            find_output_files(output_dir)
            
        else:
            logger.error("❌ Ошибка генерации!")
            logger.error("STDERR:")
            print(result.stderr)
            logger.error("STDOUT:")
            print(result.stdout)
            return False
            
    except subprocess.TimeoutExpired:
        logger.error("❌ Превышено время ожидания (10 минут)")
        return False
    except Exception as e:
        logger.error(f"❌ Неожиданная ошибка: {str(e)}")
        return False
    
    return True

def find_output_files(output_dir):
    """
    Ищет и выводит информацию о сгенерированных файлах
    """
    logger.info("🔍 Поиск сгенерированных файлов...")
    
    # Ищем файлы по расширениям
    extensions = [".obj", ".glb", ".ply", ".urdf"]
    found_files = {}
    
    for ext in extensions:
        files = list(output_dir.glob(f"**/*{ext}"))
        if files:
            found_files[ext[1:]] = files
            logger.info(f"📁 Найдены {ext} файлы:")
            for file in files:
                size = file.stat().st_size / 1024 / 1024  # размер в MB
                logger.info(f"   - {file} ({size:.2f} MB)")
    
    # Особое внимание к GLB файлу
    if "glb" in found_files:
        glb_file = found_files["glb"][0]
        logger.info(f"🎯 GLB файл готов: {glb_file}")
        logger.info(f"📏 Размер GLB файла: {glb_file.stat().st_size / 1024 / 1024:.2f} MB")
    else:
        logger.warning("⚠️ GLB файл не найден!")
    
    return found_files

def check_dependencies():
    """
    Проверяет наличие необходимых зависимостей
    """
    logger.info("🔧 Проверка зависимостей...")
    
    # Проверяем наличие основных файлов
    required_files = [
        "apps/image_to_3d.py",
        "requirements.txt",
        "4879854.jpg"
    ]
    
    for file in required_files:
        if os.path.exists(file):
            logger.info(f"✅ {file} найден")
        else:
            logger.error(f"❌ {file} не найден!")
            return False
    
    # Проверяем Python модули
    try:
        import torch
        logger.info(f"✅ PyTorch {torch.__version__} установлен")
    except ImportError:
        logger.error("❌ PyTorch не установлен!")
        return False
    
    return True

def main():
    """
    Основная функция
    """
    logger.info("🚀 Запуск тестирования Image-to-3D")
    logger.info("=" * 50)
    
    # Проверяем зависимости
    if not check_dependencies():
        logger.error("❌ Не все зависимости установлены!")
        sys.exit(1)
    
    # Запускаем тест
    success = test_image_to_3d()
    
    if success:
        logger.info("🎉 Тест завершен успешно!")
        logger.info("📁 Проверьте папку test_outputs для результатов")
    else:
        logger.error("💥 Тест завершился с ошибкой!")
        sys.exit(1)

if __name__ == "__main__":
    main()
