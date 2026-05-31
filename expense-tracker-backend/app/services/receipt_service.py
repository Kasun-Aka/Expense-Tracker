from pathlib import Path
from app.services.ocr import extract_text_from_image


def process_receipt(image_path: Path) -> str:
    ocr_text = extract_text_from_image(image_path)
    return ocr_text
