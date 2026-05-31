from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional

class ExpenseBase(BaseModel):
    receipt_id: int
    merchant: str
    amount: float
    date: date
    category_id: Optional[int] = None

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseOut(ExpenseBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
