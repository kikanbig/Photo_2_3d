#!/usr/bin/env python3
import json
import os
import base64
import tempfile
import subprocess
import time
from pathlib import Path
import logging

# Применяем torchvision fixes (опционально)
try:
    from torchvision_fix import apply_torchvision_fixes
    apply_torchvision_fixes()
except ImportError:
    print("Info: torchvision_fix not available, continuing without it")

# EmbodiedGen API для RunPod

# Настройка логирования
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("embodiedgen_api")

def handler(event):
    logger.info("=== NEW REQUEST ===")
    logger.info(f"Event: {event}")
    
    try:
        input_data = event.get("input", {})
        logger.info(f"Input keys: {list(input_data.keys())}")
        
        if "image" not in input_data:
            logger.error("No image provided")
            return {"error": "No image provided. Use field 'image' with base64 data."}
        
        # Декодирование изображения
        image_data = input_data["image"]
        logger.info(f"Image data length: {len(image_data)} characters")
        
        if image_data.startswith("data:image"):
            image_data = image_data.split(",")[1]
            logger.info("Removed data URL prefix")
        
        logger.info("Decoding base64 image data...")
        image_bytes = base64.b64decode(image_data)
        logger.info(f"Decoded image size: {len(image_bytes)} bytes")
        
        # Создание временного файла
        logger.info("Creating temporary image file...")
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as temp_file:
            temp_file.write(image_bytes)
            temp_image_path = temp_file.name
        logger.info(f"Temporary image file: {temp_image_path}")
        logger.info(f"File size: {os.path.getsize(temp_image_path)} bytes")
        
        # Создание выходной директории
        output_dir = Path("/tmp/outputs")
        logger.info(f"Output directory: {output_dir}")
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Запуск EmbodiedGen
        logger.info("Starting EmbodiedGen Image-to-3D process...")
        
        # Команды для EmbodiedGen
        possible_commands = [
            # Прямые пути к скриптам
            ["python", "/EmbodiedGen/embodied_gen/scripts/imageto3d.py", "--image_path", temp_image_path, "--output_root", str(output_dir)],
            ["python", "/EmbodiedGen/scripts/imageto3d.py", "--image_path", temp_image_path, "--output_root", str(output_dir)],
            
            # CLI команды
            ["img3d-cli", "--image_path", temp_image_path, "--output_root", str(output_dir)],
            ["python", "-m", "embodied_gen.img3d_cli", "--image_path", temp_image_path, "--output_root", str(output_dir)],
        ]
        
        # Попробуем выполнить команды по порядку
        success = False
        for i, cmd in enumerate(possible_commands):
            logger.info(f"Trying command {i+1}: {' '.join(cmd)}")
            try:
                result = subprocess.run(
                    cmd,
                    capture_output=True,
                    text=True,
                    timeout=300,  # 5 минут таймаут
                    cwd="/EmbodiedGen"
                )
                
                if result.returncode == 0:
                    logger.info(f"Command {i+1} succeeded!")
                    logger.info(f"STDOUT: {result.stdout}")
                    success = True
                    break
                else:
                    logger.warning(f"Command {i+1} failed with return code {result.returncode}")
                    logger.warning(f"STDERR: {result.stderr}")
                    
            except subprocess.TimeoutExpired:
                logger.error(f"Command {i+1} timed out")
            except Exception as e:
                logger.error(f"Command {i+1} failed with exception: {e}")
        
        # Если все команды не сработали, запустим диагностику
        if not success:
            logger.info("All main commands failed, running diagnostics...")
            diagnostic_commands = [
                ["python", "-c", "import sys; print('Python paths:', sys.path)"],
                ["python", "-c", "import torch; print('PyTorch version:', torch.__version__)"],
                ["find", "/EmbodiedGen", "-name", "*imageto3d*", "-o", "-name", "*img3d*"],
                ["ls", "-la", "/EmbodiedGen/scripts/"],
                ["ls", "-la", "/EmbodiedGen/embodied_gen/scripts/"],
            ]
            
            for cmd in diagnostic_commands:
                try:
                    result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
                    logger.info(f"Diagnostic {' '.join(cmd)}: {result.stdout}")
                except Exception as e:
                    logger.error(f"Diagnostic failed: {e}")
        
        # Проверим, что сгенерировалось
        if success:
            logger.info("Checking generated files...")
            try:
                # Ищем сгенерированные файлы
                output_files = {}
                for ext in ['.glb', '.obj', '.ply', '.urdf']:
                    files = list(output_dir.glob(f"*{ext}"))
                    if files:
                        output_files[ext[1:]] = str(files[0])
                        logger.info(f"Found {ext} file: {files[0]}")
                
                if output_files:
                    return {
                        "success": True,
                        "message": "3D model generated successfully",
                        "output_files": output_files
                    }
                else:
                    return {
                        "success": False,
                        "message": "No 3D files generated",
                        "output_files": {}
                    }
            except Exception as e:
                logger.error(f"Error checking output files: {e}")
                return {
                    "success": False,
                    "message": f"Error checking output files: {e}",
                    "output_files": {}
                }
        else:
            return {
                "success": False,
                "message": "EmbodiedGen generation failed",
                "output_files": {}
            }
    
    except subprocess.TimeoutExpired:
        logger.error("Subprocess timeout after 5 minutes")
        return {"error": "Generation timeout (5 minutes)", "execution_time": 300}
    
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return {"error": f"Server error: {str(e)}"}

def main():
    logger.info("Starting EmbodiedGen RunPod API Server")
    logger.info(f"Python version: {os.sys.version}")
    logger.info(f"Working directory: {os.getcwd()}")
    
    try:
        from runpod import serverless
        logger.info("RunPod library imported successfully")
        logger.info("Starting RunPod serverless handler...")
        print("🚀 EmbodiedGen RunPod Server Starting...")
        print("✅ Server ready to process requests")
        serverless.start({"handler": handler})
    
    except ImportError as e:
        logger.error(f"Failed to import runpod library: {e}")
        print("❌ Error: RunPod library not installed")
        print("Installing runpod...")
        import subprocess
        subprocess.run(["pip", "install", "runpod"], check=True)
        print("Retrying...")
        from runpod import serverless
        serverless.start({"handler": handler})
    
    except Exception as e:
        logger.error(f"Failed to start RunPod handler: {e}")
        print(f"❌ Error starting server: {e}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        os.sys.exit(1)

if __name__ == "__main__":
    main()