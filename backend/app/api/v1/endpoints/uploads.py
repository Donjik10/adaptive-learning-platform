import uuid
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile

router = APIRouter(prefix="/uploads", tags=["uploads"])

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx", ".txt", ".png", ".jpg", ".jpeg", ".zip", ".rar"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post("")
async def upload_file(file: UploadFile = File(...)):
    """Upload a file and return its URL."""
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Max size: {MAX_FILE_SIZE // 1024 // 1024} MB",
        )

    unique_name = f"{uuid.uuid4().hex}_{datetime.now().strftime('%Y%m%d_%H%M%S')}{ext}"
    file_path = UPLOAD_DIR / unique_name

    with open(file_path, "wb") as f:
        f.write(content)

    return {"filename": file.filename, "url": f"/uploads/{unique_name}"}
