#!/usr/bin/env python3
"""
RunPod API сервер для упрощенной Image-to-3D генерации
"""

import os
import json
import base64
import tempfile
import subprocess
from pathlib import Path
from typing import Dict, Any
import logging

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def handler(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Основной обработчик запросов RunPod
    """
    try:
        # Получение данных из запроса
        input_data = event.get("input", {})
        
        # Проверка наличия изображения
        if "image" not in input_data:
            return {
                "error": "Не предоставлено изображение. Используйте поле 'image' с base64 данными."
            }
        
        # Декодирование изображения
        image_data = input_data["image"]
        if image_data.startswith("data:image"):
            # Удаление data URL префикса
            image_data = image_data.split(",")[1]
        
        image_bytes = base64.b64decode(image_data)
        
        # Создание временного файла для изображения
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as temp_file:
            temp_file.write(image_bytes)
            temp_image_path = temp_file.name
        
        # Создание директории для выходных файлов
        if os.path.exists("/app"):
            output_dir = Path("/app/outputs") / "runpod_output"
        else:
            output_dir = Path("outputs") / "runpod_output"
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Запуск упрощенной генерации 3D
        logger.info(f"Запуск упрощенной генерации 3D для изображения: {temp_image_path}")
        
        cmd = [
            "python", "simple_image_to_3d.py",
            temp_image_path,
            str(output_dir)
        ]
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=60  # 1 минута таймаут
        )
        
        # Очистка временного файла
        os.unlink(temp_image_path)
        
        if result.returncode != 0:
            logger.error(f"Ошибка генерации: {result.stderr}")
            return {
                "error": f"Ошибка генерации 3D: {result.stderr}",
                "stdout": result.stdout
            }
        
        # Поиск сгенерированных файлов
        output_files = {}
        for ext in [".obj", ".glb", ".ply"]:
            files = list(output_dir.glob(f"**/*{ext}"))
            if files:
                output_files[ext[1:]] = str(files[0])
        
        # Чтение логов
        logs = result.stdout
        
        return {
            "success": True,
            "message": "3D модель успешно сгенерирована (упрощенная версия)",
            "output_files": output_files,
            "logs": logs,
            "output_directory": str(output_dir),
            "note": "Это упрощенная версия для демонстрации. Для полной функциональности требуется GPU и дополнительные зависимости."
        }
        
    except subprocess.TimeoutExpired:
        return {
            "error": "Превышено время ожидания генерации (1 минута)"
        }
    except Exception as e:
        logger.error(f"Неожиданная ошибка: {str(e)}")
        return {
            "error": f"Внутренняя ошибка сервера: {str(e)}"
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
        # Режим RunPod
        print("Запуск RunPod сервера...")
        print("Сервер готов к обработке запросов")
        
        # В реальном RunPod окружении здесь будет код для обработки HTTP запросов
        # Для локального тестирования просто ждем
        import time
        while True:
            time.sleep(1)

if __name__ == "__main__":
    main()
