from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_async_session
from app.schemas.flashcard import FlashcardCreate, FlashcardRead, FlashcardUpdate
from app.services.flashcard import FlashcardService

router = APIRouter()


@router.post("", response_model=FlashcardRead, status_code=status.HTTP_201_CREATED)
async def create_flashcard(
    data: FlashcardCreate,
    session: AsyncSession = Depends(get_async_session),
):
    service = FlashcardService(session)
    return await service.create(data)


@router.get("/by-topic/{topic_id}", response_model=list[FlashcardRead])
async def list_flashcards_by_topic(
    topic_id: UUID,
    session: AsyncSession = Depends(get_async_session),
):
    service = FlashcardService(session)
    return await service.get_by_topic(topic_id)


@router.get("/due/{user_id}", response_model=list[FlashcardRead])
async def get_due_flashcards(
    user_id: UUID,
    limit: int = 20,
    session: AsyncSession = Depends(get_async_session),
):
    """Return flashcards that are due for review for the given user."""
    service = FlashcardService(session)
    return await service.get_due_for_user(user_id, limit=limit)


@router.get("/{flashcard_id}", response_model=FlashcardRead)
async def get_flashcard(
    flashcard_id: UUID,
    session: AsyncSession = Depends(get_async_session),
):
    service = FlashcardService(session)
    return await service.get_by_id(flashcard_id)


@router.patch("/{flashcard_id}", response_model=FlashcardRead)
async def update_flashcard(
    flashcard_id: UUID,
    data: FlashcardUpdate,
    session: AsyncSession = Depends(get_async_session),
):
    service = FlashcardService(session)
    return await service.update(flashcard_id, data)


@router.delete("/{flashcard_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_flashcard(
    flashcard_id: UUID,
    session: AsyncSession = Depends(get_async_session),
):
    service = FlashcardService(session)
    await service.delete(flashcard_id)
