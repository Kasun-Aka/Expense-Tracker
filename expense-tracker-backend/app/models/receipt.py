from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field


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
    amount_LKR: Optional[float] = None
    category: Optional[str] = None
    confidence_score: Optional[float] = None
    line_items: Optional[str] = None
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
    line_items: Optional[str] = None


class ReceiptConfirm(BaseModel):
    merchant: str
    amount: float
    receipt_date: date
    category: str
    line_items: Optional[str] = None
    currency: str = Field(..., min_length=3, max_length=3, pattern="^[A-Za-z]{3}$")
