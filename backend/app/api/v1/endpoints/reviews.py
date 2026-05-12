from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_async_session
from app.schemas.review_history import ReviewCreate, ReviewRead
from app.schemas.sm2_data import SM2DataRead
from app.services.review import ReviewService
from app.services.sm2 import SM2Service

router = APIRouter()


@router.post("", response_model=ReviewRead, status_code=status.HTTP_201_CREATED)
async def submit_review(
    data: ReviewCreate,
    quality: int | None = Query(
        None, ge=0, le=5,
        description="SM-2 quality grade (0-5). Auto-calculated when omitted.",
    ),
    session: AsyncSession = Depends(get_async_session),
):
    """
    Submit a flashcard review.

    When *quality* is not provided the service automatically derives it
    from correctness, response time, confidence and repetition streak
    (modified SM-2).

    Quality grades (when provided explicitly):
      5 – perfect response
      4 – correct after hesitation
      3 – correct with difficulty
      2 – incorrect; correct answer seemed easy to recall
      1 – incorrect; correct answer remembered upon seeing it
      0 – complete blackout.
    """
    service = ReviewService(session)
    return await service.submit_review(data, quality=quality)


@router.get("/history/{user_id}", response_model=list[ReviewRead])
async def get_review_history(
    user_id: UUID,
    limit: int = 50,
    session: AsyncSession = Depends(get_async_session),
):
    service = ReviewService(session)
    return await service.get_history_for_user(user_id, limit=limit)


@router.get("/sm2/{user_id}/{flashcard_id}", response_model=SM2DataRead)
async def get_sm2_state(
    user_id: UUID,
    flashcard_id: UUID,
    session: AsyncSession = Depends(get_async_session),
):
    service = SM2Service(session)
    return await service.get_sm2_state(user_id, flashcard_id)


@router.post("/recalculate/{user_id}/{flashcard_id}", response_model=SM2DataRead)
async def recalculate_sm2(
    user_id: UUID,
    flashcard_id: UUID,
    session: AsyncSession = Depends(get_async_session),
):
    """
    Retroactively replay all review history for a flashcard and
    recompute the SM-2 state from scratch.

    Useful after importing historical data or debugging schedules.
    """
    service = SM2Service(session)
    await service.recalculate_from_history(user_id, flashcard_id)
    return await service.get_sm2_state(user_id, flashcard_id)
