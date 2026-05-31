from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.db.expense import Expense as DBExpense
from app.db.receipt import Receipt as DBReceipt
from app.models.expense import ExpenseCreate, ExpenseOut

router = APIRouter(prefix="/expenses", tags=["Expenses"])

@router.get("/", response_model=List[ExpenseOut])
def get_expenses(db: Session = Depends(get_db)):
    expenses = db.query(DBExpense).all()
    return expenses

@router.post("/", response_model=ExpenseOut)
def create_expense(expense: ExpenseCreate, db: Session = Depends(get_db)):
    # Verify receipt exists
    db_receipt = db.query(DBReceipt).filter(DBReceipt.id == expense.receipt_id).first()
    if not db_receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
        
    db_receipt.processed = True
    
    new_expense = DBExpense(
        receipt_id=expense.receipt_id,
        merchant=expense.merchant,
        amount=expense.amount,
        date=expense.date,
        category_id=expense.category_id
    )
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)
    return new_expense
