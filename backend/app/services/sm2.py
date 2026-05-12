import math
from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.review_history import ReviewHistory
from app.models.sm2_data import SM2Data
from app.utils.sm2_algorithm import SM2Result, calculate_sm2


class SM2Service:
    """
    Modified SM-2 scheduling service.

    Extends the base SM-2 algorithm with:
      - Continuous quality derived from correctness, response time,
        self-reported confidence, and repetition streak.
      - Retroactive batch analysis of full review history.
    """

    def __init__(self, session: AsyncSession):
        self.session = session

    # ──────────────────────────────────────────────
    #  Quality calculation (modified SM-2)
    # ──────────────────────────────────────────────

    def compute_quality(
        self,
        is_correct: bool,
        time_spent: float | None = None,
        confidence: int | None = None,
        repetitions: int = 0,
    ) -> float:
        """
        Compute a continuous quality grade (0.0 – 5.0) using multiple signals.

        Signals & weights:
          - Base correctness          : 0 or 4
          - Response-time bonus       : -0.5 … +1.0
          - Confidence adjustment     : -0.3 … +0.3
          - Repetition-streak bonus   : +0.0 … +0.3
        """
        quality = 4.0 if is_correct else 1.0

        quality += self._time_bonus(time_spent, is_correct)
        quality += self._confidence_adjustment(confidence)
        quality += self._streak_bonus(repetitions)

        return max(0.0, min(5.0, quality))

    @staticmethod
    def _time_bonus(time_spent: float | None, is_correct: bool) -> float:
        if not is_correct or time_spent is None:
            return 0.0
        if time_spent < 5:
            return 1.0
        if time_spent < 15:
            return 0.5
        if time_spent > 30:
            return -0.5
        return 0.0

    @staticmethod
    def _confidence_adjustment(confidence: int | None) -> float:
        if confidence is None:
            return 0.0
        if confidence >= 4:
            return 0.3
        if confidence <= 2:
            return -0.3
        return 0.0

    @staticmethod
    def _streak_bonus(repetitions: int) -> float:
        if repetitions >= 5:
            return 0.3
        if repetitions >= 3:
            return 0.2
        if repetitions >= 1:
            return 0.1
        return 0.0

    # ──────────────────────────────────────────────
    #  Single-review processing
    # ──────────────────────────────────────────────

    async def process_review(
        self,
        user_id: UUID,
        flashcard_id: UUID,
        is_correct: bool,
        time_spent: float | None = None,
        confidence: int | None = None,
    ) -> SM2Result:
        """
        Process a single review and return updated SM-2 parameters.

        Steps:
          1. Fetch (or create) the SM2Data row for this user–flashcard pair.
          2. Compute quality from correctness, time, confidence & streak.
          3. Run the core SM-2 algorithm.
          4. Persist the updated SM2Data row.

        Returns:
            SM2Result with new ease_factor, interval, repetitions, next_review_at.
        """
        sm2 = await self._get_or_create_sm2(user_id, flashcard_id)

        quality = self.compute_quality(
            is_correct=is_correct,
            time_spent=time_spent,
            confidence=confidence,
            repetitions=sm2.repetitions,
        )
        result = calculate_sm2(
            ease_factor=sm2.ease_factor,
            interval=sm2.interval,
            repetitions=sm2.repetitions,
            quality=math.floor(quality),
        )

        sm2.ease_factor = result.ease_factor
        sm2.interval = result.interval
        sm2.repetitions = result.repetitions
        sm2.next_review_at = result.next_review_at
        await self.session.flush()

        return result

    # ──────────────────────────────────────────────
    #  Retroactive batch analysis
    # ──────────────────────────────────────────────

    async def recalculate_from_history(
        self,
        user_id: UUID,
        flashcard_id: UUID,
    ) -> SM2Result:
        """
        Retroactively replay all review-history records for a flashcard
        and re-compute the SM-2 state from scratch.

        Useful when review-history entries were imported or modified,
        or to diagnose scheduling anomalies.
        """
        result = await self.session.execute(
            select(ReviewHistory)
            .where(
                ReviewHistory.user_id == user_id,
                ReviewHistory.flashcard_id == flashcard_id,
            )
            .order_by(ReviewHistory.reviewed_at.asc()),
        )
        reviews = list(result.scalars().all())

        ef = 2.5
        interval = 0
        reps = 0

        for review in reviews:
            quality = self.compute_quality(
                is_correct=review.is_correct,
                time_spent=review.time_spent,
                confidence=review.confidence,
                repetitions=reps,
            )
            sm2 = calculate_sm2(
                ease_factor=ef,
                interval=interval,
                repetitions=reps,
                quality=math.floor(quality),
            )
            ef, interval, reps = sm2.ease_factor, sm2.interval, sm2.repetitions

        now = datetime.now(timezone.utc)
        next_review = now + timedelta(days=interval) if reviews else now

        sm2_row = await self._get_or_create_sm2(user_id, flashcard_id)
        sm2_row.ease_factor = ef
        sm2_row.interval = interval
        sm2_row.repetitions = reps
        sm2_row.next_review_at = next_review
        await self.session.flush()

        return SM2Result(
            ease_factor=ef,
            interval=interval,
            repetitions=reps,
            next_review_at=next_review,
        )

    # ──────────────────────────────────────────────
    #  Helpers
    # ──────────────────────────────────────────────

    async def _get_or_create_sm2(
        self, user_id: UUID, flashcard_id: UUID,
    ) -> SM2Data:
        result = await self.session.execute(
            select(SM2Data).where(
                SM2Data.user_id == user_id,
                SM2Data.flashcard_id == flashcard_id,
            ),
        )
        sm2 = result.scalar_one_or_none()
        if sm2 is None:
            sm2 = SM2Data(user_id=user_id, flashcard_id=flashcard_id)
            self.session.add(sm2)
            await self.session.flush()
        return sm2

    async def get_sm2_state(
        self, user_id: UUID, flashcard_id: UUID,
    ) -> SM2Data:
        sm2 = await self._get_or_create_sm2(user_id, flashcard_id)
        return sm2
