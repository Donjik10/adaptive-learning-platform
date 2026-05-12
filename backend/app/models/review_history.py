import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ReviewHistory(Base):
    """
    Log of every flashcard review performed by a user.

    Used by the analytics module to compute retention curves,
    detect knowledge gaps, and feed the SM-2 algorithm.
    """

    __tablename__ = "review_history"

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
    is_correct: Mapped[bool] = mapped_column(
        Boolean, nullable=False,
        comment="Whether the user answered correctly",
    )
    time_spent: Mapped[float | None] = mapped_column(
        Float, nullable=True,
        comment="Seconds spent on this review",
    )
    confidence: Mapped[int | None] = mapped_column(
        Integer, nullable=True,
        comment="Self-reported confidence (1-5)",
    )
    reviewed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
        index=True,
    )

    user: Mapped["User"] = relationship("User", back_populates="review_history")
    flashcard: Mapped["Flashcard"] = relationship("Flashcard", back_populates="review_history")
