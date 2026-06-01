import json
import logging
from datetime import datetime
from pathlib import Path
from typing import List

from fastapi import APIRouter, UploadFile, File, Depends, Request, HTTPException
from sqlalchemy.orm import Session

from app.core.security import (
    upload_rate_limiter,
    validate_upload_file,
    sanitize_filename,
)
from app.services.gemini_service import analyze_receipt
from app.db.database import get_db
from app.db.receipt import Receipt as DBReceipt
from app.models.receipt import ReceiptOut, ReceiptUploadResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/receipts", tags=["Receipts"])

UPLOAD_DIR = Path("uploads/receipts")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/upload", response_model=ReceiptUploadResponse)
async def upload_receipt(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Upload a receipt image for AI-powered analysis.
    
    Security measures applied:
    1. Rate limiting per IP (10/min, 50/hr)
    2. File validation (MIME type via magic bytes, size limit, extension whitelist)
    3. Filename sanitization (UUID-based)
    4. AI output validation (strict Pydantic schema)
    """

    # --- Security: Rate Limiting ---
    client_ip = upload_rate_limiter.get_client_ip(request)
    upload_rate_limiter.check(client_ip)

    # --- Security: File Validation ---
    # Validates extension, size (<5MB), and MIME type via magic bytes
    file_content = await validate_upload_file(file)

    # --- Security: Filename Sanitization ---
    # Use UUID-based filename to prevent path traversal
    safe_filename = sanitize_filename(file.filename or "receipt.jpg")
    file_path = UPLOAD_DIR / safe_filename

    # Save file to disk
    with open(file_path, "wb") as buffer:
        buffer.write(file_content)

    # --- Determine MIME type for Gemini ---
    import magic as magic_lib
    detected_mime = magic_lib.from_buffer(file_content, mime=True)

    # --- AI Analysis ---
    try:
        gemini_result = await analyze_receipt(file_content, detected_mime)
    except RuntimeError as e:
        logger.error("Gemini analysis failed: %s", str(e))
        # Still save the receipt even if AI fails, user can fill in manually
        new_receipt = DBReceipt(
            filename=safe_filename,
            ocr_text="AI analysis failed: " + str(e),
            processed=False,
        )
        db.add(new_receipt)
        db.commit()
        db.refresh(new_receipt)
        
        return ReceiptUploadResponse(
            receipt_id=new_receipt.id,
            filename=safe_filename,
            merchant=None,
            amount=None,
            date=None,
            currency="LKR",
            category=None,
            confidence_score=None,
            line_items=None,
        )

    # --- Format line items as newline-separated text ---
    line_items_text = ""
    if gemini_result.line_items:
        lines = []
        for item in gemini_result.line_items:
            if item.name:
                qty_str = f" x{item.quantity}" if item.quantity and item.quantity != 1 else ""
                price_str = f" - {item.price:.2f}" if item.price else ""
                lines.append(f"{item.name}{qty_str}{price_str}")
        line_items_text = "\n".join(lines)

    # --- Parse date ---
    receipt_date = None
    if gemini_result.date:
        try:
            receipt_date = datetime.strptime(gemini_result.date, "%Y-%m-%d").date()
        except ValueError:
            logger.warning("Could not parse date: %s", gemini_result.date)

    # --- Store raw AI response for audit ---
    raw_response_json = gemini_result.model_dump_json()

    # --- Save receipt to DB with structured data ---
    new_receipt = DBReceipt(
        filename=safe_filename,
        merchant=gemini_result.merchant,
        amount=gemini_result.total_amount,
        receipt_date=receipt_date,
        currency=gemini_result.currency,
        category=gemini_result.category,
        confidence_score=gemini_result.confidence_score,
        line_items=line_items_text,
        ai_raw_response=raw_response_json,
        ocr_text=None,  # No longer using raw OCR text
        processed=False,  # Not yet confirmed by user
    )
    db.add(new_receipt)
    db.commit()
    db.refresh(new_receipt)

    return ReceiptUploadResponse(
        receipt_id=new_receipt.id,
        filename=safe_filename,
        merchant=gemini_result.merchant,
        amount=gemini_result.total_amount,
        date=gemini_result.date,
        currency=gemini_result.currency,
        category=gemini_result.category,
        confidence_score=gemini_result.confidence_score,
        line_items=line_items_text,
    )


@router.get("/", response_model=List[ReceiptOut])
def get_receipts(db: Session = Depends(get_db)):
    """Get all receipts, ordered by most recent first."""
    receipts = db.query(DBReceipt).order_by(DBReceipt.created_at.desc()).all()
    return receipts


@router.get("/{receipt_id}", response_model=ReceiptOut)
def get_receipt(receipt_id: int, db: Session = Depends(get_db)):
    """Get a single receipt by ID."""
    receipt = db.query(DBReceipt).filter(DBReceipt.id == receipt_id).first()
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    return receipt
