from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_async_session
from app.schemas.course_material import CourseMaterialRead, CourseMaterialUpload
from app.schemas.teacher_rule import TeacherRuleRead, TeacherRuleUpsert
from app.services.rag import RAGService

router = APIRouter()


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
