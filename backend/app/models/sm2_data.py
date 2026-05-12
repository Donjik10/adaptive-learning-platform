import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class SM2Data(Base):
    """
    Per-user, per-flashcard SM-2 algorithm state.

    The algorithm (SuperMemo-2) uses (ease_factor, interval, repetitions)
    to schedule the next review date for each flashcard.
    """

    __tablename__ = "sm2_data"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )
    flashcard_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("flashcards.id", ondelete="CASCADE"),
        index=True,
    )
    ease_factor: Mapped[float] = mapped_column(
        Float, default=2.5,
        comment="SM-2 easiness factor (minimum 1.3)",
    )
    interval: Mapped[int] = mapped_column(
        Integer, default=0,
        comment="Current interval in days before next review",
    )
    repetitions: Mapped[int] = mapped_column(
        Integer, default=0,
        comment="Number of consecutive correct answers",
    )
    next_review_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True,
        comment="Planned date for the next review",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(),
    )

    user: Mapped["User"] = relationship("User", back_populates="sm2_data")
    flashcard: Mapped["Flashcard"] = relationship("Flashcard", back_populates="sm2_data")
