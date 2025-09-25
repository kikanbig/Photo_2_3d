#!/usr/bin/env python3
import json
import os

def handler(event):
    print(f"Received event: {event}")
    
    try:
        input_data = event.get("input", {})
        
        if "image" not in input_data:
            return {"error": "No image provided"}
        
        # Простой ответ
        return {
            "success": True,
            "message": "Image received successfully",
            "output_files": {"glb": "/tmp/test.glb"},
            "note": "Simple test response"
        }
    
    except Exception as e:
        return {"error": f"Error: {str(e)}"}

def main():
    print("Starting simple API server...")
    
    try:
        from runpod import serverless
        print("RunPod library found")
        serverless.start({"handler": handler})
    
    except ImportError:
        print("RunPod not found, installing...")
        import subprocess
        subprocess.run(["pip", "install", "runpod"])
        from runpod import serverless
        serverless.start({"handler": handler})
    
    except Exception as e:
        print(f"Error: {e}")
        os.sys.exit(1)

if __name__ == "__main__":
    main()
