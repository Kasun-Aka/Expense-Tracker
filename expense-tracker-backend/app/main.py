from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.health import router as health_router
from app.api.receipts import router as receipts_router
from app.api.categories import router as categories_router
from app.api.expenses import router as expenses_router
from app.db.database import engine
from app.db import receipt, expense, category

app = FastAPI()

# Configure CORS for Angular frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(receipts_router)
app.include_router(categories_router)
app.include_router(expenses_router)

receipt.Base.metadata.create_all(bind=engine)
expense.Base.metadata.create_all(bind=engine)
category.Base.metadata.create_all(bind=engine)
