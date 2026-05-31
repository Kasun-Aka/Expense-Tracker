from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session
from pathlib import Path
import shutil

from app.services.ocr import extract_text_from_image
from app.services.parser import parse_receipt_text
from app.db.database import get_db
from app.db.receipt import Receipt as DBReceipt

router = APIRouter(prefix="/receipts", tags=["Receipts"])

UPLOAD_DIR = Path("uploads/receipts")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/upload")
async def upload_receipt(file: UploadFile = File(...), db: Session = Depends(get_db)):
    file_path = UPLOAD_DIR / file.filename

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    extracted_text = extract_text_from_image(file_path)
    
    # Save receipt to DB
    new_receipt = DBReceipt(filename=file.filename, ocr_text=extracted_text)
    db.add(new_receipt)
    db.commit()
    db.refresh(new_receipt)
    
    parsed_data = parse_receipt_text(extracted_text)

    return {
        "receipt_id": new_receipt.id,
        "filename": new_receipt.filename,
        "extracted_text": extracted_text,
        "parsed_data": parsed_data
    }
