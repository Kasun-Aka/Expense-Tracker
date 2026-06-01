from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel


class ReceiptLineItemOut(BaseModel):
    name: str = ""
    quantity: Optional[float] = 1
    price: Optional[float] = 0.0


class ReceiptCreate(BaseModel):
    filename: str
    ocr_text: Optional[str] = None


class ReceiptOut(BaseModel):
    id: int
    filename: str
    merchant: Optional[str] = None
    amount: Optional[float] = None
    receipt_date: Optional[date] = None
    currency: Optional[str] = "LKR"
    category: Optional[str] = None
    confidence_score: Optional[float] = None
    line_items: Optional[str] = None  # JSON string
    ocr_text: Optional[str] = None
    processed: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ReceiptUploadResponse(BaseModel):
    """Response returned to the frontend after uploading a receipt."""
    receipt_id: int
    filename: str
    merchant: Optional[str] = None
    amount: Optional[float] = None
    date: Optional[str] = None
    currency: str = "LKR"
    category: Optional[str] = None
    confidence_score: Optional[float] = None
    line_items: Optional[str] = None  # Newline-separated items text
