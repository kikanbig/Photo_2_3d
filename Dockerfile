# Используем готовый образ EmbodiedGen
FROM wangxinjie/embodiedgen:v0.1.x

# Устанавливаем runpod библиотеку
RUN pip install runpod

# Создаем директории
RUN mkdir -p /app/outputs /app/logs

# Настраиваем переменные окружения
ENV PYTHONPATH=/app
ENV CUDA_VISIBLE_DEVICES=0
ENV PYTHONUNBUFFERED=1

# Открываем порт
EXPOSE 8000

# Создаем простой API сервер
COPY <<EOF /app/api.py
#!/usr/bin/env python3
import os, json, base64, tempfile, subprocess, time
from pathlib import Path
import logging

# Настройка логирования
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("embodiedgen_api")

def handler(event):
    logger.info("=== NEW REQUEST ===")
    logger.info(f"Event keys: {list(event.keys())}")
    
    try:
        input_data = event.get("input", {})
        logger.info(f"Input keys: {list(input_data.keys())}")
        
        if "image" not in input_data:
            logger.error("No image provided")
            return {"error": "No image provided. Use field \"image\" with base64 data."}
        
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
        output_dir = Path("/app/outputs")
        logger.info(f"Output directory: {output_dir}")
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Запуск EmbodiedGen
        logger.info("Starting EmbodiedGen Image-to-3D process...")
        cmd = ["img3d-cli", "--image_path", temp_image_path, "--output_root", str(output_dir)]
        logger.info(f"Command: {' '.join(cmd)}")
        
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
EOF

# Делаем файл исполняемым
RUN chmod +x /app/api.py

# Команда запуска
CMD ["python", "/app/api.py"]