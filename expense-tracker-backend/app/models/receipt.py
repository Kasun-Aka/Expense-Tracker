from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ReceiptCreate(BaseModel):
    filename: str
    ocr_text: str

class ReceiptOut(BaseModel):
    id: int
    filename: str
    ocr_text: str
    processed: bool
    created_at: datetime

    class Config:
        from_attributes = True
