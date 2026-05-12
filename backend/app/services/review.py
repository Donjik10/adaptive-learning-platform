from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.review_history import ReviewHistory
from app.schemas.review_history import ReviewCreate
from app.services.sm2 import SM2Service


class ReviewService:
    """
    Business logic for reviewing flashcards.

    Delegates SM-2 scheduling to *SM2Service* while remaining responsible
    for persisting review-history records.
    """

    def __init__(self, session: AsyncSession):
        self.session = session
        self._sm2 = SM2Service(session)

    async def submit_review(
        self,
        data: ReviewCreate,
        quality: int | None = None,
    ) -> ReviewHistory:
        """
        Record a review and update SM-2 scheduling data.

        When *quality* is **None** the SM2Service computes it
        automatically from correctness, response time, confidence,
        and repetition streak.

        Args:
            data:    Review details (user, flashcard, correctness …).
            quality: Optional override 0-5; auto-calculated when omitted.

        Returns:
            The newly created ReviewHistory record.
        """
        review = ReviewHistory(**data.model_dump())
        self.session.add(review)

        if quality is None:
            sm2 = await self._sm2.get_sm2_state(data.user_id, data.flashcard_id)
            await self._sm2.process_review(
                user_id=data.user_id,
                flashcard_id=data.flashcard_id,
                is_correct=data.is_correct,
                time_spent=data.time_spent,
                confidence=data.confidence,
            )
        else:
            sm2 = await self._sm2.get_sm2_state(data.user_id, data.flashcard_id)
            from app.utils.sm2_algorithm import calculate_sm2

            result = calculate_sm2(
                ease_factor=sm2.ease_factor,
                interval=sm2.interval,
                repetitions=sm2.repetitions,
                quality=quality,
            )
            sm2.ease_factor = result.ease_factor
            sm2.interval = result.interval
            sm2.repetitions = result.repetitions
            sm2.next_review_at = result.next_review_at

        await self.session.flush()
        return review

    async def get_history_for_user(
        self, user_id: UUID, limit: int = 50,
    ) -> list[ReviewHistory]:
        result = await self.session.execute(
            select(ReviewHistory)
            .where(ReviewHistory.user_id == user_id)
            .order_by(ReviewHistory.reviewed_at.desc())
            .limit(limit),
        )
        return list(result.scalars().all())
