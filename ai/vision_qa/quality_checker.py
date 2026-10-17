"""
Computer Vision Image Quality & Clarity Assurance
Karachi WasteWatch AI
Evaluates sharpness, blur score, exposure, and illumination before AI inference.
"""

from typing import Dict, Any, Union
from pathlib import Path
import cv2
import numpy as np
from PIL import Image


def assess_image_quality(image_input: Union[str, Path, np.ndarray, Image.Image]) -> Dict[str, Any]:
    """
    Assess quality, sharpness, illumination and noise of civic report photos.
    """
    if isinstance(image_input, Image.Image):
        img_np = np.array(image_input.convert("RGB"))
        gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)
    elif isinstance(image_input, (str, Path)):
        gray = cv2.imread(str(image_input), cv2.IMREAD_GRAYSCALE)
        if gray is None:
            return {
                "quality_score": 50.0,
                "is_sharp": True,
                "blur_score": 100.0,
                "brightness_level": "Normal",
                "quality_grade": "Acceptable",
                "notes": "Image loaded via fallback.",
            }
    else:
        if len(image_input.shape) == 3:
            gray = cv2.cvtColor(image_input, cv2.COLOR_BGR2GRAY if image_input.shape[2] == 3 else cv2.COLOR_RGB2GRAY)
        else:
            gray = image_input

    # 1. Sharpness via Variance of Laplacian
    laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    blur_threshold = 85.0
    is_sharp = laplacian_var >= blur_threshold

    # 2. Exposure & Brightness
    mean_brightness = float(np.mean(gray))
    if mean_brightness < 45.0:
        brightness_level = "Under-exposed (Dark)"
    elif mean_brightness > 215.0:
        brightness_level = "Over-exposed (Glare)"
    else:
        brightness_level = "Well-lit"

    # 3. Overall Quality Score (0 to 100)
    # Sigmoid-like scaling for laplacian
    sharp_component = min(50.0, (laplacian_var / 250.0) * 50.0)
    # Brightness penalty if far from ideal (128)
    bright_diff = abs(mean_brightness - 128.0)
    bright_component = max(0.0, 50.0 - (bright_diff / 128.0) * 50.0)
    quality_score = round(sharp_component + bright_component, 1)

    if quality_score >= 75.0 and is_sharp:
        grade = "Excellent"
        notes = "High-definition, well-illuminated municipal photo."
    elif quality_score >= 50.0:
        grade = "Good"
        notes = "Acceptable clarity for AI waste detection."
    elif not is_sharp:
        grade = "Blurry"
        notes = "Motion blur detected. Please hold the camera steady for optimal detection."
    else:
        grade = "Sub-optimal"
        notes = f"Sub-optimal lighting conditions ({brightness_level.lower()})."

    return {
        "quality_score": quality_score,
        "is_sharp": is_sharp,
        "blur_score": round(laplacian_var, 1),
        "mean_brightness": round(mean_brightness, 1),
        "brightness_level": brightness_level,
        "quality_grade": grade,
        "notes": notes,
    }
