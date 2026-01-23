from fastapi import APIRouter, UploadFile, File, HTTPException
from pathlib import Path
import shutil
import uuid

router = APIRouter(prefix="/receipts", tags=["Receipts"])

UPLOAD_DIR = Path("uploads/receipts")

@router.post("/upload")
def upload_receipt(file: UploadFile = File(...)):
    # 1. Validate content type
    if file.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(status_code=400, detail="Only JPG or PNG images are allowed")

    # 2. Ensure upload directory exists
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    # 3. Generate safe unique filename
    file_ext = Path(file.filename).suffix
    unique_name = f"{uuid.uuid4()}{file_ext}"
    file_path = UPLOAD_DIR / unique_name

    # 4. Save file
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 5. Respond
    return {
        "original_filename": file.filename,
        "stored_filename": unique_name,
        "content_type": file.content_type,
        "path": str(file_path)
    }
