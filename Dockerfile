# Используем готовый образ EmbodiedGen
FROM wangxinjie/embodiedgen:v0.1.x

# Переключаемся на root
USER root

# Устанавливаем runpod
RUN pip install runpod

# Создаем простой API сервер
RUN echo '#!/usr/bin/env python3' > /app/api.py && \
    echo 'import json' >> /app/api.py && \
    echo 'import os' >> /app/api.py && \
    echo '' >> /app/api.py && \
    echo 'def handler(event):' >> /app/api.py && \
    echo '    print(f"Received event: {event}")' >> /app/api.py && \
    echo '    ' >> /app/api.py && \
    echo '    try:' >> /app/api.py && \
    echo '        input_data = event.get("input", {})' >> /app/api.py && \
    echo '        ' >> /app/api.py && \
    echo '        if "image" not in input_data:' >> /app/api.py && \
    echo '            return {"error": "No image provided"}' >> /app/api.py && \
    echo '        ' >> /app/api.py && \
    echo '        # Простой ответ' >> /app/api.py && \
    echo '        return {' >> /app/api.py && \
    echo '            "success": True,' >> /app/api.py && \
    echo '            "message": "Image received successfully",' >> /app/api.py && \
    echo '            "output_files": {"glb": "/tmp/test.glb"},' >> /app/api.py && \
    echo '            "note": "Simple test response"' >> /app/api.py && \
    echo '        }' >> /app/api.py && \
    echo '    ' >> /app/api.py && \
    echo '    except Exception as e:' >> /app/api.py && \
    echo '        return {"error": f"Error: {str(e)}"}' >> /app/api.py && \
    echo '' >> /app/api.py && \
    echo 'def main():' >> /app/api.py && \
    echo '    print("Starting simple API server...")' >> /app/api.py && \
    echo '    ' >> /app/api.py && \
    echo '    try:' >> /app/api.py && \
    echo '        from runpod import serverless' >> /app/api.py && \
    echo '        print("RunPod library found")' >> /app/api.py && \
    echo '        serverless.start({"handler": handler})' >> /app/api.py && \
    echo '    ' >> /app/api.py && \
    echo '    except ImportError:' >> /app/api.py && \
    echo '        print("RunPod not found, installing...")' >> /app/api.py && \
    echo '        import subprocess' >> /app/api.py && \
    echo '        subprocess.run(["pip", "install", "runpod"])' >> /app/api.py && \
    echo '        from runpod import serverless' >> /app/api.py && \
    echo '        serverless.start({"handler": handler})' >> /app/api.py && \
    echo '    ' >> /app/api.py && \
    echo '    except Exception as e:' >> /app/api.py && \
    echo '        print(f"Error: {e}")' >> /app/api.py && \
    echo '        os.sys.exit(1)' >> /app/api.py && \
    echo '' >> /app/api.py && \
    echo 'if __name__ == "__main__":' >> /app/api.py && \
    echo '    main()' >> /app/api.py

# Делаем исполняемым
RUN chmod +x /app/api.py

# Переключаемся обратно
USER e_user

# Запуск
CMD ["python", "/app/api.py"]