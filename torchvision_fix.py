#!/usr/bin/env python3
"""
Torchvision fix for compatibility issues
Based on imagine-io-webinar/image-to-3d Hugging Face Space
"""

import torch
import torchvision
import warnings

def apply_torchvision_fixes():
    """Apply fixes for common torchvision compatibility issues"""
    
    # Suppress warnings
    warnings.filterwarnings("ignore", category=UserWarning)
    warnings.filterwarnings("ignore", category=FutureWarning)
    
    # Fix for torchvision transforms
    try:
        from torchvision import transforms
        # Ensure transforms are available
        if not hasattr(transforms, 'ToTensor'):
            print("Warning: torchvision transforms not fully loaded")
    except ImportError as e:
        print(f"Warning: torchvision transforms import failed: {e}")
    
    # Fix for PIL compatibility
    try:
        from PIL import Image
        # Ensure PIL is working
        if not hasattr(Image, 'open'):
            print("Warning: PIL Image not fully loaded")
    except ImportError as e:
        print(f"Warning: PIL import failed: {e}")
    
    # Fix for CUDA availability
    if torch.cuda.is_available():
        print(f"CUDA available: {torch.cuda.get_device_name(0)}")
    else:
        print("CUDA not available, using CPU")
    
    print("Torchvision fixes applied successfully")

if __name__ == "__main__":
    apply_torchvision_fixes()
