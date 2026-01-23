from fastapi import FastAPI
from app.api.health import router as health_router
from app.api.receipts import router as receipts_router

app = FastAPI()

app.include_router(health_router)
app.include_router(receipts_router)
