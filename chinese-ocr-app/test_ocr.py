import cv2
import numpy as np
from paddleocr import PaddleOCR

ocr = PaddleOCR(use_angle_cls=False, lang='ch', use_gpu=False, show_log=False)

# Test on the actual image
img = cv2.imread("debug/00_original.jpg")
if img is None:
    print("No debug image found, using test")
else:
    # Try multiple crops
    h, w = img.shape[:2]

    # Test 1: Full image
    result = ocr.ocr(img, cls=False)
    print("Full image:", result)

    # Test 2: Center crop (where characters are)
    center = img[int(h * 0.2):int(h * 0.8), int(w * 0.2):int(w * 0.8)]
    result2 = ocr.ocr(center, cls=False)
    print("Center crop:", result2)

    # Test 3: Upscale x4 then OCR
    big = cv2.resize(
        center,
        (center.shape[1] * 4, center.shape[0] * 4),
        interpolation=cv2.INTER_LANCZOS4,
    )
    result3 = ocr.ocr(big, cls=False)
    print("Upscaled x4:", result3)
