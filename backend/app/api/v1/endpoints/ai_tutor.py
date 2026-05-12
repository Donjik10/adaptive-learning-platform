from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_async_session
from app.services.ai_tutor import AITutorService

router = APIRouter()


class TutorRequest(BaseModel):
    flashcard_id: UUID
    user_id: UUID
    student_error: str


class TutorResponse(BaseModel):
    explanation: str


@router.post("/explain", response_model=TutorResponse)
async def get_ai_explanation(
    body: TutorRequest,
    session: AsyncSession = Depends(get_async_session),
):
    """
    Generate a personalised AI explanation for a student's mistake.

    The explanation is tailored to the student's learning style
    (stored in the User model) and the flashcard's context.
    """
    service = AITutorService(session)
    explanation = await service.generate_explanation(
        flashcard_id=body.flashcard_id,
        user_id=body.user_id,
        student_error=body.student_error,
    )
    return TutorResponse(explanation=explanation)
