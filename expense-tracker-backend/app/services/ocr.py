import pytesseract
from PIL import Image
from pathlib import Path

import os
from dotenv import load_dotenv

load_dotenv()

tesseract_cmd = os.getenv("TESSERACT_CMD_PATH")
if tesseract_cmd:
    pytesseract.pytesseract.tesseract_cmd = tesseract_cmd


def extract_text_from_image(image_path: Path) -> str:

    image = Image.open(image_path)

    text = pytesseract.image_to_string(image)

    return text.strip()
