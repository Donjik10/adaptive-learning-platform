from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_async_session
from app.schemas.tutor import TutorAskRequest, TutorAskResponse
from app.services.rag import RAGService

router = APIRouter()


@router.post("/ask", response_model=TutorAskResponse)
async def tutor_ask(
    body: TutorAskRequest,
    session: AsyncSession = Depends(get_async_session),
):
    """
    Ask the AI tutor a question. Uses RAG to retrieve relevant
    course materials and answers strictly within the teacher's guidelines.
    """
    svc = RAGService(session)
    answer, sources = await svc.ask(
        user_id=body.user_id,
        course_id=body.course_id,
        question=body.question,
    )
    return TutorAskResponse(answer=answer, sources=sources)
