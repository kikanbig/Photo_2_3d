#!/usr/bin/env python3
import json
import os
import base64
import tempfile
import subprocess
import time
from pathlib import Path
import logging

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
        
        # Попробуем разные варианты команды - исправленные пути
        possible_commands = [
            # Прямые пути к скриптам (основные)
            ["python", "/EmbodiedGen/embodied_gen/scripts/imageto3d.py", "--image_path", temp_image_path, "--output_root", str(output_dir)],
            ["python", "/EmbodiedGen/scripts/imageto3d.py", "--image_path", temp_image_path, "--output_root", str(output_dir)],
            
            # С PYTHONPATH и правильным вызовом
            ["python", "-c", "import sys; sys.path.append('/EmbodiedGen'); import os; os.chdir('/EmbodiedGen'); from embodied_gen.scripts.imageto3d import entrypoint; entrypoint(image_path='" + temp_image_path + "', output_root='" + str(output_dir) + "')"],
            
            # Старые варианты (для совместимости)
            ["img3d-cli", "--image_path", temp_image_path, "--output_root", str(output_dir)],
            ["python", "-m", "embodied_gen.img3d_cli", "--image_path", temp_image_path, "--output_root", str(output_dir)],
            ["python", "-m", "embodied_gen", "--image_path", temp_image_path, "--output_root", str(output_dir)],
            ["python", "-m", "embodied_gen.cli", "--image_path", temp_image_path, "--output_root", str(output_dir)],
            ["python", "-m", "embodied_gen.tools", "--image_path", temp_image_path, "--output_root", str(output_dir)],
            ["python", "img3d_cli.py", "--image_path", temp_image_path, "--output_root", str(output_dir)],
            ["python", "/app/img3d_cli.py", "--image_path", temp_image_path, "--output_root", str(output_dir)],
            
            # Диагностические команды
            ["find", "/EmbodiedGen", "-name", "*imageto3d*", "-o", "-name", "*img3d*"],
            ["ls", "-la", "/EmbodiedGen/scripts/"],
            ["ls", "-la", "/EmbodiedGen/embodied_gen/scripts/"]
        ]
        
        # Сначала попробуем найти EmbodiedGen в системе
        logger.info("Searching for EmbodiedGen installation...")
        try:
            # Проверим, что доступно в Python
            result = subprocess.run(["python", "-c", "import sys; print('\\n'.join(sys.path))"], capture_output=True, text=True, timeout=10)
            logger.info(f"Python paths: {result.stdout}")
            
            # Проверим, что установлено
            result = subprocess.run(["python", "-c", "import pkg_resources; print([d.project_name for d in pkg_resources.working_set if 'embodied' in d.project_name.lower()])"], capture_output=True, text=True, timeout=10)
            logger.info(f"Installed packages with 'embodied': {result.stdout}")
            
            # Попробуем найти embodied_gen
            result = subprocess.run(["python", "-c", "import embodied_gen; print(embodied_gen.__file__)"], capture_output=True, text=True, timeout=10)
            if result.returncode == 0:
                logger.info(f"Found embodied_gen at: {result.stdout}")
            else:
                logger.info(f"embodied_gen not found: {result.stderr}")
                
            # Проверим, есть ли файлы в /app
            result = subprocess.run(["ls", "-la", "/app"], capture_output=True, text=True, timeout=10)
            logger.info(f"Files in /app: {result.stdout}")
            
        except Exception as e:
            logger.info(f"Error checking Python paths: {e}")
        
        # Сначала выполним диагностические команды
        diagnostic_commands = [
            # Проверяем структуру /EmbodiedGen
            ["ls", "-la", "/EmbodiedGen/"],
            ["find", "/EmbodiedGen", "-name", "*.py", "2>/dev/null"],
            ["find", "/EmbodiedGen", "-name", "*imageto3d*", "-o", "-name", "*img3d*", "2>/dev/null"],
            ["ls", "-la", "/EmbodiedGen/scripts/", "2>/dev/null"],
            ["ls", "-la", "/EmbodiedGen/embodied_gen/scripts/", "2>/dev/null"],
            
            # Проверяем Python модули
            ["python", "-c", "import sys; sys.path.append('/EmbodiedGen'); import embodied_gen; print('embodied_gen location:', embodied_gen.__file__); import os; print('Contents:', os.listdir(os.path.dirname(embodied_gen.__file__)))"],
            ["python", "-c", "import pkg_resources; print('Package locations:', [d.location for d in pkg_resources.working_set if 'embodied' in d.project_name.lower()])"],
            ["python", "-c", "import pkg_resources; print('Entry points:'); [print(f'{ep.name}: {ep.module_name}') for ep in pkg_resources.get_entry_map('embodied-gen').values()]"],
            
            # Ищем CLI команды
            ["find", "/opt/conda/bin", "-name", "*img3d*", "-o", "-name", "*embodied*"],
            ["ls", "-la", "/opt/conda/bin/"],
            ["find", "/opt/conda/lib/python3.11/site-packages/embodied_gen", "-name", "*.py", "2>/dev/null"]
        ]
        
        for i, diag_cmd in enumerate(diagnostic_commands):
            logger.info(f"Running diagnostic {i+1}: {' '.join(diag_cmd)}")
            try:
                result = subprocess.run(diag_cmd, capture_output=True, text=True, timeout=10)
                logger.info(f"Diagnostic {i+1} stdout: {result.stdout}")
                if result.stderr:
                    logger.info(f"Diagnostic {i+1} stderr: {result.stderr}")
            except Exception as e:
                logger.info(f"Diagnostic {i+1} error: {e}")
        
        cmd = None
        for i, test_cmd in enumerate(possible_commands):
            logger.info(f"Trying command {i+1}: {' '.join(test_cmd)}")
            # Пропустим только диагностические команды (find, ls без python)
            if test_cmd[0] in ["find", "ls"] and test_cmd[0] != "python":
                continue
                
            # Проверим, существует ли команда
            try:
                if test_cmd[0] == "python":
                    # Для Python команд проверим, что Python доступен
                    result = subprocess.run(["which", "python"], capture_output=True, text=True, timeout=5)
                    if result.returncode == 0:
                        cmd = test_cmd
                        logger.info(f"Found Python command: {test_cmd[0]}")
                        break
                else:
                    result = subprocess.run(["which", test_cmd[0]], capture_output=True, text=True, timeout=5)
                    if result.returncode == 0:
                        cmd = test_cmd
                        logger.info(f"Found command: {test_cmd[0]}")
                        break
            except:
                pass
        
        if cmd is None:
            logger.error("No valid EmbodiedGen command found")
            # Попробуем простой тест - что доступно в системе
            try:
                result = subprocess.run(["python", "-c", "import sys; print('Python version:', sys.version); print('Python paths:'); [print(p) for p in sys.path]"], capture_output=True, text=True, timeout=10)
                logger.info(f"Python info: {result.stdout}")
                
                result = subprocess.run(["ls", "-la", "/"], capture_output=True, text=True, timeout=10)
                logger.info(f"Root directory: {result.stdout}")
                
                result = subprocess.run(["find", "/", "-name", "*embodied*", "-type", "d", "2>/dev/null"], capture_output=True, text=True, timeout=30)
                logger.info(f"Found embodied directories: {result.stdout}")
                
                # Попробуем найти файлы с img3d
                result = subprocess.run(["find", "/", "-name", "*img3d*", "2>/dev/null"], capture_output=True, text=True, timeout=30)
                logger.info(f"Found img3d files: {result.stdout}")
                
                # Попробуем найти Python пакеты
                result = subprocess.run(["python", "-c", "import pkg_resources; print([d.project_name for d in pkg_resources.working_set])"], capture_output=True, text=True, timeout=10)
                logger.info(f"Installed packages: {result.stdout}")
                
            except Exception as e:
                logger.info(f"Error in diagnostic: {e}")
            
            return {"error": "EmbodiedGen command not found in container", "diagnostic": "Check logs for system information"}
        
        logger.info(f"Using command: {' '.join(cmd)}")
        
        start_time = time.time()
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        execution_time = time.time() - start_time
        
        logger.info(f"Subprocess completed with return code: {result.returncode}")
        logger.info(f"Execution time: {execution_time:.2f} seconds")
        logger.info(f"STDOUT: {result.stdout}")
        logger.info(f"STDERR: {result.stderr}")
        
        # Очистка временного файла
        logger.info("Cleaning up temporary file...")
        os.unlink(temp_image_path)
        
        if result.returncode != 0:
            logger.error(f"EmbodiedGen failed with return code: {result.returncode}")
            logger.error(f"Error output: {result.stderr}")
            return {
                "error": f"EmbodiedGen generation failed: {result.stderr}",
                "stdout": result.stdout,
                "execution_time": execution_time
            }
        
        # Поиск сгенерированных файлов
        logger.info("Searching for generated files...")
        output_files = {}
        for ext in [".obj", ".glb", ".ply", ".urdf"]:
            files = list(output_dir.glob(f"**/*{ext}"))
            logger.info(f"Found {len(files)} {ext} files: {[str(f) for f in files]}")
            if files:
                output_files[ext[1:]] = str(files[0])
                logger.info(f"Added {ext[1:].upper()} file: {files[0]} (size: {files[0].stat().st_size} bytes)")
        
        logger.info(f"Generated files: {list(output_files.keys())}")
        logger.info("Request completed successfully")
        
        return {
            "success": True,
            "message": "3D model generated successfully with EmbodiedGen",
            "output_files": output_files,
            "logs": result.stdout,
            "output_directory": str(output_dir),
            "execution_time": execution_time,
            "model": "EmbodiedGen v0.1.x"
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