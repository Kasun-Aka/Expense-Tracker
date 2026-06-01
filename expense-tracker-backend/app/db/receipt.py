from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Numeric, Float, Date
from datetime import datetime
from app.db.database import Base


class Receipt(Base):
    __tablename__ = "receipts"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(500), nullable=False)
    
    # AI-extracted structured data
    merchant = Column(String(200), nullable=True)
    amount = Column(Numeric(12, 2), nullable=True)
    receipt_date = Column(Date, nullable=True)
    currency = Column(String(10), default="LKR")
    category = Column(String(100), nullable=True)
    confidence_score = Column(Float, nullable=True)
    line_items = Column(Text, nullable=True)  # JSON string of line items
    
    # Raw AI response stored for audit/debugging
    ai_raw_response = Column(Text, nullable=True)
    
    # Legacy field kept for backward compatibility
    ocr_text = Column(Text, nullable=True)
    
    processed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
