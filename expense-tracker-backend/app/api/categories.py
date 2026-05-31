from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.db.category import Category as DBCategory
from app.models.category import CategoryCreate, CategoryOut

router = APIRouter(prefix="/categories", tags=["Categories"])

@router.get("/", response_model=List[CategoryOut])
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(DBCategory).all()
    return categories

@router.post("/", response_model=CategoryOut)
def create_category(category: CategoryCreate, db: Session = Depends(get_db)):
    db_category = db.query(DBCategory).filter(DBCategory.name == category.name).first()
    if db_category:
        raise HTTPException(status_code=400, detail="Category already exists")
    
    new_category = DBCategory(name=category.name)
    db.add(new_category)
    db.commit()
    db.refresh(new_category)
    return new_category
