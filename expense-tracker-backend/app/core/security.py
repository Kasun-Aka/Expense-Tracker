"""
Security module for the Expense Tracker backend.
Provides rate limiting, file validation, and filename sanitization.
"""

import time
import uuid
import re
import magic
from pathlib import Path
from collections import defaultdict
from fastapi import UploadFile, HTTPException, Request
from typing import Optional


# ---------------------------------------------------------------------------
# Rate Limiter — In-memory, per-IP
# ---------------------------------------------------------------------------

class RateLimiter:
    """
    Simple in-memory sliding-window rate limiter.
    Tracks request timestamps per IP and enforces limits.
    """

    def __init__(self, max_per_minute: int = 10, max_per_hour: int = 50):
        self.max_per_minute = max_per_minute
        self.max_per_hour = max_per_hour
        # { ip_address: [timestamp1, timestamp2, ...] }
        self._requests: dict[str, list[float]] = defaultdict(list)

    def _cleanup(self, ip: str, now: float):
        """Remove timestamps older than 1 hour."""
        cutoff = now - 3600
        self._requests[ip] = [t for t in self._requests[ip] if t > cutoff]

    def check(self, ip: str):
        """
        Check if the IP is within rate limits.
        Raises HTTPException 429 if exceeded.
        """
        now = time.time()
        self._cleanup(ip, now)

        timestamps = self._requests[ip]

        # Check per-minute limit
        one_minute_ago = now - 60
        recent_minute = [t for t in timestamps if t > one_minute_ago]
        if len(recent_minute) >= self.max_per_minute:
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded. Maximum {self.max_per_minute} uploads per minute. Please wait."
            )

        # Check per-hour limit
        if len(timestamps) >= self.max_per_hour:
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded. Maximum {self.max_per_hour} uploads per hour. Please try again later."
            )

        # Record this request
        timestamps.append(now)

    def get_client_ip(self, request: Request) -> str:
        """Extract client IP from request, handling proxies."""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            # Take the first IP in the chain (original client)
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"


# Global rate limiter instance
upload_rate_limiter = RateLimiter(max_per_minute=10, max_per_hour=50)


# ---------------------------------------------------------------------------
# File Validation
# ---------------------------------------------------------------------------

# Allowed MIME types (images only)
ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}

# Allowed file extensions (as a secondary check)
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

# Maximum file size: 5 MB
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


async def validate_upload_file(file: UploadFile) -> bytes:
    """
    Validates an uploaded file for security:
    1. Checks file extension against whitelist.
    2. Reads file content and checks size limit.
    3. Validates MIME type using magic bytes (not just the extension).
    
    Returns the file content bytes if valid.
    Raises HTTPException if validation fails.
    """

    # --- 1. Extension Check ---
    if file.filename:
        ext = Path(file.filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type '{ext}'. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
            )
    else:
        raise HTTPException(status_code=400, detail="Filename is required.")

    # --- 2. Read content and check size ---
    content = await file.read()

    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    if len(content) > MAX_FILE_SIZE_BYTES:
        size_mb = len(content) / (1024 * 1024)
        raise HTTPException(
            status_code=400,
            detail=f"File too large ({size_mb:.1f} MB). Maximum allowed size is {MAX_FILE_SIZE_BYTES // (1024 * 1024)} MB."
        )

    # --- 3. Magic byte MIME validation ---
    # This checks the actual file content, not the extension, preventing
    # attacks where a malicious file is renamed to .jpg
    detected_mime = magic.from_buffer(content, mime=True)
    if detected_mime not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file content. Detected type '{detected_mime}' is not an allowed image format. "
                   f"Allowed: JPEG, PNG, WebP."
        )

    # Reset file position for potential re-read
    await file.seek(0)

    return content


# ---------------------------------------------------------------------------
# Filename Sanitization
# ---------------------------------------------------------------------------

def sanitize_filename(original_filename: str) -> str:
    """
    Generates a safe filename using UUID to prevent:
    - Path traversal attacks (e.g., ../../etc/passwd)
    - Special character injection
    - Filename collisions
    
    Preserves the original extension for convenience.
    """
    # Extract and validate extension
    ext = Path(original_filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        ext = ".jpg"  # Fallback

    # Generate UUID-based filename
    safe_name = f"{uuid.uuid4().hex}{ext}"
    return safe_name


def sanitize_string_output(value: str, max_length: int = 500) -> str:
    """
    Sanitize a string returned by the AI to prevent stored XSS or
    injection when displayed on the frontend.
    - Strips HTML tags
    - Truncates to max_length
    - Strips leading/trailing whitespace
    """
    if not value:
        return ""
    
    # Remove any HTML tags
    clean = re.sub(r'<[^>]+>', '', value)
    # Remove any script-like patterns
    clean = re.sub(r'javascript:', '', clean, flags=re.IGNORECASE)
    # Truncate
    clean = clean.strip()[:max_length]
    return clean
