import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.health import router as health_router
from app.api.receipts import router as receipts_router


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

app = FastAPI(
    title="Expense Tracker API",
    description="AI-powered expense tracking with Google Gemini",
    version="2.0.0",
)

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
