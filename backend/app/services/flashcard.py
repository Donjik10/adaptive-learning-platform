from datetime import UTC
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.flashcard import Flashcard
from app.schemas.flashcard import FlashcardCreate, FlashcardUpdate


class FlashcardService:
    """Business logic for Flashcard CRUD operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, data: FlashcardCreate) -> Flashcard:
        flashcard = Flashcard(**data.model_dump())
        self.session.add(flashcard)
        await self.session.flush()
        return flashcard

    async def get_by_id(self, flashcard_id: UUID) -> Flashcard:
        flashcard = await self.session.get(Flashcard, flashcard_id)
        if not flashcard:
            raise NotFoundError(f"Flashcard {flashcard_id} not found")
        return flashcard

    async def get_by_topic(self, topic_id: UUID) -> list[Flashcard]:
        result = await self.session.execute(
            select(Flashcard)
            .where(Flashcard.topic_id == topic_id)
            .order_by(Flashcard.created_at),
        )
        return list(result.scalars().all())

    async def get_due_for_user(self, user_id: UUID, limit: int = 20) -> list[Flashcard]:
        """
        Return flashcards that are due for review for a given user,
        based on their SM-2 scheduling data.
        """
        from datetime import datetime

        from sqlalchemy import select as sa_select

        from app.models.sm2_data import SM2Data

        now = datetime.now(UTC)
        stmt = (
            sa_select(Flashcard)
            .join(SM2Data, SM2Data.flashcard_id == Flashcard.id)
            .where(SM2Data.user_id == user_id)
            .where(
                (SM2Data.next_review_at.is_(None))
                | (SM2Data.next_review_at <= now)
            )
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def update(self, flashcard_id: UUID, data: FlashcardUpdate) -> Flashcard:
        flashcard = await self.get_by_id(flashcard_id)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(flashcard, field, value)
        await self.session.flush()
        return flashcard

    async def delete(self, flashcard_id: UUID) -> None:
        flashcard = await self.get_by_id(flashcard_id)
        await self.session.delete(flashcard)
        await self.session.flush()
