import json
import logging
import urllib.request
from datetime import datetime, date
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
from app.db.exchange_rate import ExchangeRate
from app.models.receipt import ReceiptOut, ReceiptUploadResponse, ReceiptConfirm

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
            ai_raw_response="AI analysis failed: " + str(e),
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

@router.put("/{receipt_id}/confirm", response_model=ReceiptOut)
def confirm_receipt(receipt_id: int, confirm_data: ReceiptConfirm, db: Session = Depends(get_db)):
    """Confirm a receipt, fetch exchange rate if needed, and mark as processed."""
    receipt = db.query(DBReceipt).filter(DBReceipt.id == receipt_id).first()
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")

    receipt.merchant = confirm_data.merchant
    receipt.amount = confirm_data.amount
    receipt.receipt_date = confirm_data.receipt_date
    receipt.category = confirm_data.category
    receipt.line_items = confirm_data.line_items
    receipt.currency = confirm_data.currency

    # Calculate LKR amount
    if confirm_data.currency == "LKR":
        receipt.amount_LKR = confirm_data.amount
    else:
        today = date.today()
        # Check if rate exists for today
        rate_record = db.query(ExchangeRate).filter(
            ExchangeRate.date == today,
            ExchangeRate.currency == confirm_data.currency
        ).first()

        if rate_record:
            rate = float(rate_record.rate_to_lkr)
        else:
            # Fetch from API
            try:
                url = f"https://open.er-api.com/v6/latest/{confirm_data.currency}"
                with urllib.request.urlopen(url) as response:
                    data = json.loads(response.read().decode())
                    rate = data["rates"]["LKR"]
                    
                # Save to db
                new_rate = ExchangeRate(
                    date=today,
                    currency=confirm_data.currency,
                    rate_to_lkr=rate
                )
                db.add(new_rate)
            except Exception as e:
                logger.error("Failed to fetch exchange rate: %s", str(e))
                raise HTTPException(status_code=500, detail="Failed to fetch exchange rate")

        receipt.amount_LKR = confirm_data.amount * rate

    receipt.processed = True
    db.commit()
    db.refresh(receipt)
    return receipt

@router.put("/{receipt_id}", response_model=ReceiptOut)
def update_receipt(receipt_id: int, update_data: ReceiptConfirm, db: Session = Depends(get_db)):
    """Update an existing confirmed receipt."""
    # This logic is identical to confirm_receipt since it updates all user-facing fields
    return confirm_receipt(receipt_id, update_data, db)

@router.delete("/{receipt_id}")
def delete_receipt(receipt_id: int, db: Session = Depends(get_db)):
    """Hard delete a receipt."""
    receipt = db.query(DBReceipt).filter(DBReceipt.id == receipt_id).first()
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    
    db.delete(receipt)
    db.commit()
    return {"message": "Receipt deleted successfully"}
