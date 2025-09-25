# Используем готовый образ EmbodiedGen
FROM wangxinjie/embodiedgen:v0.1.x

# Переключаемся на root для установки
USER root

# Устанавливаем runpod библиотеку
RUN pip install runpod

# Создаем директории
RUN mkdir -p /app/outputs /app/logs && \
    chmod 755 /app/outputs /app/logs

# Настраиваем переменные окружения
ENV PYTHONPATH=/app
ENV CUDA_VISIBLE_DEVICES=0
ENV PYTHONUNBUFFERED=1

# Открываем порт
EXPOSE 8000

# Создаем простой тестовый API сервер
RUN echo '#!/usr/bin/env python3' > /app/api.py && \
    echo 'import os, json, base64, tempfile, subprocess, time' >> /app/api.py && \
    echo 'from pathlib import Path' >> /app/api.py && \
    echo 'import logging' >> /app/api.py && \
    echo '' >> /app/api.py && \
    echo '# Настройка логирования' >> /app/api.py && \
    echo 'logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")' >> /app/api.py && \
    echo 'logger = logging.getLogger("embodiedgen_api")' >> /app/api.py && \
    echo '' >> /app/api.py && \
    echo 'def handler(event):' >> /app/api.py && \
    echo '    logger.info("=== NEW REQUEST ===")' >> /app/api.py && \
    echo '    logger.info(f"Event: {event}")' >> /app/api.py && \
    echo '    ' >> /app/api.py && \
    echo '    try:' >> /app/api.py && \
    echo '        input_data = event.get("input", {})' >> /app/api.py && \
    echo '        ' >> /app/api.py && \
    echo '        if "image" not in input_data:' >> /app/api.py && \
    echo '            return {"error": "No image provided"}' >> /app/api.py && \
    echo '        ' >> /app/api.py && \
    echo '        # Простая заглушка для тестирования' >> /app/api.py && \
    echo '        logger.info("Processing image...")' >> /app/api.py && \
    echo '        ' >> /app/api.py && \
    echo '        # Создаем заглушку GLB файла' >> /app/api.py && \
    echo '        output_dir = Path("/app/outputs")' >> /app/api.py && \
    echo '        output_dir.mkdir(parents=True, exist_ok=True)' >> /app/api.py && \
    echo '        ' >> /app/api.py && \
    echo '        glb_path = output_dir / "test_model.glb"' >> /app/api.py && \
    echo '        with open(glb_path, "w") as f:' >> /app/api.py && \
    echo '            f.write("# Test GLB file\\n")' >> /app/api.py && \
    echo '            f.write("# Generated from image\\n")' >> /app/api.py && \
    echo '        ' >> /app/api.py && \
    echo '        logger.info(f"Created test file: {glb_path}")' >> /app/api.py && \
    echo '        ' >> /app/api.py && \
    echo '        return {' >> /app/api.py && \
    echo '            "success": True,' >> /app/api.py && \
    echo '            "message": "Test 3D model generated",' >> /app/api.py && \
    echo '            "output_files": {"glb": str(glb_path)},' >> /app/api.py && \
    echo '            "note": "This is a test placeholder"' >> /app/api.py && \
    echo '        }' >> /app/api.py && \
    echo '    ' >> /app/api.py && \
    echo '    except Exception as e:' >> /app/api.py && \
    echo '        logger.error(f"Error: {str(e)}")' >> /app/api.py && \
    echo '        return {"error": f"Server error: {str(e)}"}' >> /app/api.py && \
    echo '' >> /app/api.py && \
    echo 'def main():' >> /app/api.py && \
    echo '    logger.info("Starting EmbodiedGen RunPod API Server")' >> /app/api.py && \
    echo '    logger.info(f"Python version: {os.sys.version}")' >> /app/api.py && \
    echo '    logger.info(f"Working directory: {os.getcwd()}")' >> /app/api.py && \
    echo '    ' >> /app/api.py && \
    echo '    try:' >> /app/api.py && \
    echo '        from runpod import serverless' >> /app/api.py && \
    echo '        logger.info("RunPod library imported successfully")' >> /app/api.py && \
    echo '        logger.info("Starting RunPod serverless handler...")' >> /app/api.py && \
    echo '        print("🚀 EmbodiedGen RunPod Server Starting...")' >> /app/api.py && \
    echo '        print("✅ Server ready to process requests")' >> /app/api.py && \
    echo '        serverless.start({"handler": handler})' >> /app/api.py && \
    echo '    ' >> /app/api.py && \
    echo '    except ImportError as e:' >> /app/api.py && \
    echo '        logger.error(f"Failed to import runpod library: {e}")' >> /app/api.py && \
    echo '        print("❌ Error: RunPod library not installed")' >> /app/api.py && \
    echo '        print("Installing runpod...")' >> /app/api.py && \
    echo '        subprocess.run(["pip", "install", "runpod"], check=True)' >> /app/api.py && \
    echo '        print("Retrying...")' >> /app/api.py && \
    echo '        from runpod import serverless' >> /app/api.py && \
    echo '        serverless.start({"handler": handler})' >> /app/api.py && \
    echo '    ' >> /app/api.py && \
    echo '    except Exception as e:' >> /app/api.py && \
    echo '        logger.error(f"Failed to start RunPod handler: {e}")' >> /app/api.py && \
    echo '        print(f"❌ Error starting server: {e}")' >> /app/api.py && \
    echo '        import traceback' >> /app/api.py && \
    echo '        print(f"Traceback: {traceback.format_exc()}")' >> /app/api.py && \
    echo '        os.sys.exit(1)' >> /app/api.py && \
    echo '' >> /app/api.py && \
    echo 'if __name__ == "__main__":' >> /app/api.py && \
    echo '    main()' >> /app/api.py

# Устанавливаем права на файл
RUN chmod +x /app/api.py

# Переключаемся обратно на пользователя
USER e_user

# Команда запуска
CMD ["python", "/app/api.py"]