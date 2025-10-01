#!/usr/bin/env python3
"""
RunPod API сервер для упрощенной Image-to-3D генерации
"""

import os
import sys
import json
import base64
import tempfile
import subprocess
import time
from pathlib import Path
from typing import Dict, Any
import logging
from datetime import datetime

# Настройка детального логирования
log_dir = Path("/app/logs") if os.path.exists("/app") else Path("logs")
log_dir.mkdir(exist_ok=True)

# Создаем логгер с детальным форматированием
logger = logging.getLogger("runpod_api")
logger.setLevel(logging.DEBUG)

# Создаем файловый handler
log_file = log_dir / f"runpod_api_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
file_handler = logging.FileHandler(log_file)
file_handler.setLevel(logging.DEBUG)

# Создаем консольный handler
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)

# Создаем форматтер
formatter = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s'
)
file_handler.setFormatter(formatter)
console_handler.setFormatter(formatter)

# Добавляем handlers
logger.addHandler(file_handler)
logger.addHandler(console_handler)

# Логируем запуск
logger.info("=" * 80)
logger.info("🚀 RunPod API Server Starting")
logger.info(f"📁 Log file: {log_file}")
logger.info(f"🐍 Python version: {os.sys.version}")
logger.info(f"📂 Working directory: {os.getcwd()}")
logger.info(f"📂 App directory exists: {os.path.exists('/app')}")
logger.info("=" * 80)

def handler(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Основной обработчик запросов RunPod
    """
    start_time = time.time()
    logger.info("=" * 60)
    logger.info("🔄 NEW REQUEST RECEIVED")
    logger.info(f"📥 Event keys: {list(event.keys())}")
    logger.info(f"📥 Event type: {type(event)}")
    logger.debug(f"📥 Full event: {json.dumps(event, indent=2)}")
    
    try:
        # Получение данных из запроса
        input_data = event.get("input", {})
        logger.info(f"📥 Input data keys: {list(input_data.keys())}")
        logger.debug(f"📥 Input data: {json.dumps(input_data, indent=2)}")
        
        # Проверка наличия изображения
        if "image" not in input_data:
            logger.error("❌ No image provided in input data")
            return {
                "error": "Не предоставлено изображение. Используйте поле 'image' с base64 данными."
            }
        
        # Декодирование изображения
        image_data = input_data["image"]
        logger.info(f"📷 Image data length: {len(image_data)} characters")
        logger.info(f"📷 Image data starts with: {image_data[:50]}...")
        
        if image_data.startswith("data:image"):
            # Удаление data URL префикса
            image_data = image_data.split(",")[1]
            logger.info("📷 Removed data URL prefix")
        
        logger.info(f"📷 Decoding base64 image data...")
        image_bytes = base64.b64decode(image_data)
        logger.info(f"📷 Decoded image size: {len(image_bytes)} bytes")
        
        # Создание временного файла для изображения
        logger.info("📁 Creating temporary image file...")
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as temp_file:
            temp_file.write(image_bytes)
            temp_image_path = temp_file.name
        logger.info(f"📁 Temporary image file: {temp_image_path}")
        logger.info(f"📁 File size: {os.path.getsize(temp_image_path)} bytes")
        
        # Создание директории для выходных файлов
        if os.path.exists("/app"):
            output_dir = Path("/app/outputs") / "runpod_output"
        else:
            output_dir = Path("outputs") / "runpod_output"
        
        logger.info(f"📁 Output directory: {output_dir}")
        logger.info(f"📁 Creating output directory...")
        output_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"📁 Output directory created: {output_dir.exists()}")
        
        # Запуск упрощенной генерации 3D
        logger.info("🚀 Starting 3D generation process...")
        logger.info(f"📷 Input image: {temp_image_path}")
        logger.info(f"📁 Output directory: {output_dir}")
        
        cmd = [
            "python3", "simple_image_to_3d.py",
            temp_image_path,
            str(output_dir)
        ]
        
        logger.info(f"🔧 Command: {' '.join(cmd)}")
        logger.info(f"🔧 Working directory: {os.getcwd()}")
        logger.info(f"🔧 Python executable: {sys.executable}")
        
        logger.info("⏳ Running subprocess...")
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=60  # 1 минута таймаут
        )
        
        logger.info(f"⏳ Subprocess completed with return code: {result.returncode}")
        logger.info(f"📤 STDOUT: {result.stdout}")
        logger.info(f"📤 STDERR: {result.stderr}")
        
        # Очистка временного файла
        logger.info("🧹 Cleaning up temporary file...")
        os.unlink(temp_image_path)
        logger.info("🧹 Temporary file cleaned up")
        
        if result.returncode != 0:
            logger.error(f"❌ 3D generation failed with return code: {result.returncode}")
            logger.error(f"❌ Error output: {result.stderr}")
            return {
                "error": f"Ошибка генерации 3D: {result.stderr}",
                "stdout": result.stdout
            }
        
        # Поиск сгенерированных файлов
        logger.info("🔍 Searching for generated files...")
        output_files = {}
        for ext in [".obj", ".glb", ".ply"]:
            files = list(output_dir.glob(f"**/*{ext}"))
            logger.info(f"🔍 Found {len(files)} {ext} files: {[str(f) for f in files]}")
            if files:
                output_files[ext[1:]] = str(files[0])
                logger.info(f"✅ {ext[1:].upper()} file: {files[0]} (size: {files[0].stat().st_size} bytes)")
        
        # Чтение логов
        logs = result.stdout
        
        execution_time = time.time() - start_time
        logger.info(f"⏱️ Total execution time: {execution_time:.2f} seconds")
        logger.info(f"📊 Generated files: {list(output_files.keys())}")
        logger.info("✅ Request completed successfully")
        
        response = {
            "success": True,
            "message": "3D модель успешно сгенерирована (упрощенная версия)",
            "output_files": output_files,
            "logs": logs,
            "output_directory": str(output_dir),
            "execution_time": execution_time,
            "note": "Это упрощенная версия для демонстрации. Для полной функциональности требуется GPU и дополнительные зависимости."
        }
        
        logger.info(f"📤 Response: {json.dumps(response, indent=2)}")
        return response
        
    except subprocess.TimeoutExpired:
        execution_time = time.time() - start_time
        logger.error(f"⏰ Subprocess timeout after {execution_time:.2f} seconds")
        return {
            "error": "Превышено время ожидания генерации (1 минута)",
            "execution_time": execution_time
        }
    except Exception as e:
        execution_time = time.time() - start_time
        logger.error(f"💥 Unexpected error after {execution_time:.2f} seconds: {str(e)}")
        logger.error(f"💥 Error type: {type(e).__name__}")
        logger.error(f"💥 Error details: {str(e)}")
        import traceback
        logger.error(f"💥 Traceback: {traceback.format_exc()}")
        return {
            "error": f"Внутренняя ошибка сервера: {str(e)}",
            "execution_time": execution_time,
            "error_type": type(e).__name__
        }

def main():
    """
    Запуск сервера для локального тестирования
    """
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        # Тестовый режим
        test_event = {
            "input": {
                "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
            }
        }
        
        result = handler(test_event)
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        # Режим RunPod - используем стандартный RunPod handler
        logger.info("🔧 Starting RunPod serverless mode...")
        
        try:
            from runpod import serverless
            logger.info("✅ RunPod library imported successfully")
            
            logger.info("🚀 Starting RunPod serverless handler...")
            print("Запуск RunPod сервера...")
            print("Сервер готов к обработке запросов")
            
            # Запускаем RunPod serverless handler
            serverless.start({"handler": handler})
            
        except ImportError as e:
            logger.error(f"❌ Failed to import runpod library: {e}")
            logger.error("❌ RunPod library not installed or not available")
            print("❌ Ошибка: RunPod библиотека не установлена")
            print("Установите: pip install runpod")
            sys.exit(1)
        except Exception as e:
            logger.error(f"💥 Failed to start RunPod handler: {e}")
            logger.error(f"💥 Error type: {type(e).__name__}")
            import traceback
            logger.error(f"💥 Traceback: {traceback.format_exc()}")
            print(f"❌ Ошибка запуска: {e}")
            sys.exit(1)

if __name__ == "__main__":
    main()
