import os
import uuid
from datetime import datetime
from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.dependencies import require_role
from app.database import get_async_session
from app.models.user import User, UserRole
from app.schemas.course_material import CourseMaterialRead, CourseMaterialUpload
from app.schemas.teacher_rule import TeacherRuleRead, TeacherRuleUpsert
from app.services.rag import RAGService
from app.utils.file_extraction import extract_text_from_file

router = APIRouter()

UPLOAD_DIR = Path("uploads/materials")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".txt", ".md", ".csv", ".pdf", ".docx", ".doc", ".json", ".xml", ".html", ".htm"}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB

@router.put("/rules/{teacher_id}", response_model=TeacherRuleRead)
async def upsert_rule(
    teacher_id: UUID,
    body: TeacherRuleUpsert,
    session: AsyncSession = Depends(get_async_session),
):
    """Set or update the AI persona prompt for a teacher for a course."""
    svc = RAGService(session)
    return await svc.upsert_rule(
        teacher_id, body.course_id,
        body.ai_persona_prompt, body.strict_mode_enabled,
    )

@router.get("/rules/{teacher_id}/{course_id}", response_model=TeacherRuleRead | None)
async def get_rule(
    teacher_id: UUID,
    course_id: UUID,
    session: AsyncSession = Depends(get_async_session),
):
    """Get the teacher's rule for a specific course."""
    svc = RAGService(session)
    return await svc.get_rule(teacher_id, course_id)

@router.post("/materials", response_model=CourseMaterialRead)
async def upload_material(
    body: CourseMaterialUpload,
    session: AsyncSession = Depends(get_async_session),
):
    """Upload a text material for a course (teacher's knowledge base)."""
    svc = RAGService(session)
    mat = await svc.upload_material(
        teacher_id=body.teacher_id,
        course_id=body.course_id,
        filename=body.filename,
        content=body.content_text,
        file_url=None,
    )
    return mat

@router.post("/materials/file", response_model=CourseMaterialRead)
async def upload_material_file(
    course_id: UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(require_role(UserRole.TEACHER)),
    session: AsyncSession = Depends(get_async_session),
):
    """Upload a file as course material. Extracts text and creates embeddings."""
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # Read file content
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

    try:
        text_content = extract_text_from_file(file_path, file.filename)
    except Exception as e:
        file_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=400,
            detail=f"Failed to extract text from file: {str(e)}",
        )

    if not text_content or not text_content.strip():
        file_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=400,
            detail="Could not extract any text from the uploaded file.",
        )

    # Upload via RAG service
    svc = RAGService(session)
    mat = await svc.upload_material(
        teacher_id=current_user.id,
        course_id=course_id,
        filename=file.filename or "unnamed",
        content=text_content,
        file_url=f"/uploads/materials/{unique_name}",
    )
    return mat

@router.get("/materials/{course_id}", response_model=list[CourseMaterialRead])
async def list_materials(
    course_id: UUID,
    session: AsyncSession = Depends(get_async_session),
):
    """List all uploaded materials for a course."""
    svc = RAGService(session)
    return await svc.list_materials(course_id)
