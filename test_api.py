#!/usr/bin/env python3
"""
Тест API для EmbodiedGen Image-to-3D
"""

import requests
import base64
import sys
import json
from pathlib import Path

def encode_image_to_base64(image_path):
    """Кодирует изображение в base64"""
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def test_api(endpoint_url, image_path, api_key=None):
    """Тестирует API"""
    
    print(f"🖼️ Загружаем изображение: {image_path}")
    
    # Кодируем изображение в base64
    image_base64 = encode_image_to_base64(image_path)
    print(f"✅ Изображение закодировано в base64 ({len(image_base64)} символов)")
    
    # Подготавливаем запрос
    payload = {
        "input": {
            "image": f"data:image/jpeg;base64,{image_base64}"
        }
    }
    
    # Подготавливаем заголовки
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    
    print(f"🚀 Отправляем запрос на: {endpoint_url}")
    
    try:
        # Отправляем POST запрос
        response = requests.post(
            endpoint_url,
            json=payload,
            headers=headers,
            timeout=300  # 5 минут таймаут
        )
        
        print(f"📡 Статус ответа: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Успешный ответ!")
            print(json.dumps(result, indent=2, ensure_ascii=False))
            
            if result.get("success") and result.get("output_files", {}).get("glb"):
                print(f"🎉 GLB файл успешно сгенерирован: {result['output_files']['glb']}")
                return True
            else:
                print("⚠️ GLB файл не найден в ответе")
                return False
        else:
            print(f"❌ Ошибка: {response.status_code}")
            print(f"Ответ: {response.text}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Ошибка запроса: {str(e)}")
        return False

def main():
    """Основная функция"""
    
    if len(sys.argv) < 2:
        print("Использование: python test_api.py <ENDPOINT_URL> [IMAGE_PATH] [API_KEY]")
        print("Пример: python test_api.py https://api.runpod.ai/v2/abc123/run")
        print("С API ключом: python test_api.py https://api.runpod.ai/v2/abc123/run 4879854.jpg YOUR_API_KEY")
        sys.exit(1)
    
    endpoint_url = sys.argv[1]
    image_path = sys.argv[2] if len(sys.argv) > 2 else "4879854.jpg"
    api_key = sys.argv[3] if len(sys.argv) > 3 else None
    
    if not Path(image_path).exists():
        print(f"❌ Изображение не найдено: {image_path}")
        sys.exit(1)
    
    print("🧪 Тестирование EmbodiedGen API")
    print("=" * 50)
    
    success = test_api(endpoint_url, image_path, api_key)
    
    if success:
        print("\n🎉 Тест прошел успешно! GLB файл получен!")
    else:
        print("\n💥 Тест не прошел. Проверь настройки endpoint.")

if __name__ == "__main__":
    main()
