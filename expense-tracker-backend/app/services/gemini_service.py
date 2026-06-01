"""
Gemini AI service for receipt analysis.
Replaces the old Tesseract OCR + regex parser pipeline with a single
multimodal API call to Google Gemini.

SECURITY:
- The system prompt is HARDCODED — no user input is ever injected into it.
- Only raw image bytes are sent to the API — no user-provided text.
- The response is validated against a strict Pydantic schema.
"""

import os
import json
import logging
from typing import Optional
from pydantic import BaseModel, Field, field_validator
from dotenv import load_dotenv

import google.generativeai as genai

from app.core.security import sanitize_string_output

load_dotenv()

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    logger.warning(
        "GEMINI_API_KEY is not set in .env. Receipt analysis will fail. "
        "Get a free key from https://aistudio.google.com/apikey"
    )

# Configure the Gemini client
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


# ---------------------------------------------------------------------------
# Response Schema — Strict Pydantic validation for AI output
# ---------------------------------------------------------------------------

class ReceiptLineItem(BaseModel):
    """A single item on a receipt."""
    name: str = ""
    quantity: Optional[float] = 1
    price: Optional[float] = 0.0


class GeminiReceiptResponse(BaseModel):
    """
    Strict schema for validating Gemini's JSON response.
    Any unexpected or malicious fields from the AI are automatically dropped.
    """
    merchant: str = Field(default="Unknown Merchant", max_length=200)
    date: Optional[str] = Field(default=None, max_length=20)
    total_amount: float = Field(default=0.0, ge=0, le=99999999.99)
    currency: str = Field(default="LKR", max_length=10)
    category: str = Field(default="Other", max_length=100)
    confidence_score: float = Field(default=0.0, ge=0.0, le=1.0)
    line_items: list[ReceiptLineItem] = Field(default_factory=list)

    @field_validator('merchant', 'category', 'currency', 'date', mode='before')
    @classmethod
    def sanitize_strings(cls, v):
        """Sanitize all string fields from AI output."""
        if isinstance(v, str):
            return sanitize_string_output(v, max_length=200)
        return v

    @field_validator('total_amount', mode='before')
    @classmethod
    def clamp_amount(cls, v):
        """Ensure amount is a reasonable number."""
        try:
            val = float(v)
            if val < 0:
                return 0.0
            if val > 99999999.99:
                return 99999999.99
            return val
        except (ValueError, TypeError):
            return 0.0

    @field_validator('confidence_score', mode='before')
    @classmethod
    def clamp_confidence(cls, v):
        """Ensure confidence is between 0 and 1."""
        try:
            val = float(v)
            return max(0.0, min(1.0, val))
        except (ValueError, TypeError):
            return 0.0


# ---------------------------------------------------------------------------
# Hardcoded System Prompt — NEVER modified by user input
# ---------------------------------------------------------------------------

RECEIPT_ANALYSIS_PROMPT = """You are a receipt data extraction assistant. Analyze the uploaded receipt image and extract the following information into a JSON object.

RULES:
1. Extract data ONLY from the receipt image. Do not invent or guess data.
2. If a field cannot be determined, use the default values.
3. The date should be in YYYY-MM-DD format.
4. The total_amount should be the final total paid (including tax if shown).
5. The currency should be the 3-letter ISO code (e.g., LKR, USD, EUR). Default to LKR if unclear.
6. The category should be one of: Food & Dining, Groceries, Transport, Shopping, Entertainment, Healthcare, Utilities, Education, Travel, Other.
7. The confidence_score should be between 0.0 and 1.0, reflecting how confident you are in the extraction accuracy.
8. For line_items, extract each individual item with its name, quantity, and price.

Return ONLY a valid JSON object with this exact structure:
{
  "merchant": "Store Name",
  "date": "YYYY-MM-DD",
  "total_amount": 0.00,
  "currency": "LKR",
  "category": "Category Name",
  "confidence_score": 0.85,
  "line_items": [
    {"name": "Item 1", "quantity": 1, "price": 10.00},
    {"name": "Item 2", "quantity": 2, "price": 5.50}
  ]
}"""


# ---------------------------------------------------------------------------
# Main Analysis Function
# ---------------------------------------------------------------------------

async def analyze_receipt(image_bytes: bytes, mime_type: str) -> GeminiReceiptResponse:
    """
    Send a receipt image to Google Gemini and get structured data back.
    
    SECURITY NOTES:
    - Only image bytes are sent — no user text is concatenated into the prompt.
    - The system prompt is hardcoded above and cannot be modified by users.
    - The AI response is validated against GeminiReceiptResponse schema.
    - Any unexpected fields in the AI response are silently dropped.
    
    Args:
        image_bytes: Raw bytes of the receipt image.
        mime_type: MIME type of the image (e.g., "image/jpeg").
        
    Returns:
        GeminiReceiptResponse with validated, sanitized data.
        
    Raises:
        Exception if API call fails or response is unparseable.
    """

    if not GEMINI_API_KEY:
        raise RuntimeError(
            "GEMINI_API_KEY is not configured. "
            "Please set it in the .env file."
        )

    try:
        # Initialize the model
        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            generation_config={
                "temperature": 0.1,  # Low temperature for factual extraction
                "top_p": 0.95,
                "response_mime_type": "application/json",  # Force JSON output
            }
        )

        # Build the content — ONLY the hardcoded prompt + image bytes
        # No user-provided text is ever included here
        response = model.generate_content(
            [
                RECEIPT_ANALYSIS_PROMPT,
                {
                    "mime_type": mime_type,
                    "data": image_bytes,
                }
            ],
            request_options={"timeout": 30}  # 30-second timeout
        )

        # Parse the response
        response_text = response.text
        logger.info("Gemini raw response received (length: %d)", len(response_text))

        # Parse JSON from Gemini's response
        try:
            raw_data = json.loads(response_text)
        except json.JSONDecodeError as e:
            logger.error("Gemini returned invalid JSON: %s", str(e))
            # Return default values rather than crashing
            return GeminiReceiptResponse()

        # Validate through Pydantic — this is our main security gate.
        # Any fields not in the schema are silently dropped.
        # Any values outside the allowed ranges are clamped.
        validated = GeminiReceiptResponse.model_validate(raw_data)

        logger.info(
            "Receipt analyzed: merchant=%s, amount=%s %s, confidence=%.2f",
            validated.merchant, validated.total_amount,
            validated.currency, validated.confidence_score
        )

        return validated

    except RuntimeError:
        raise
    except Exception as e:
        logger.error("Gemini API call failed: %s", str(e), exc_info=True)
        raise RuntimeError(f"Failed to analyze receipt: {str(e)}")
