import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Flashcard(Base):
    """
    A single question-answer pair linked to a Topic.

    *explanation_prompt* stores a template/system-prompt snippet used
    later by the AI tutor to generate personalised explanations.
    """

    __tablename__ = "flashcards"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    topic_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("topics.id", ondelete="CASCADE"),
        index=True,
    )
    question: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[str] = mapped_column(Text, nullable=False)
    explanation_prompt: Mapped[str | None] = mapped_column(
        Text, nullable=True,
        comment="Contextual prompt for GPT-4 to generate a tailored explanation",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )

    topic: Mapped["Topic"] = relationship("Topic", back_populates="flashcards")
    review_history: Mapped[list["ReviewHistory"]] = relationship(
        "ReviewHistory", back_populates="flashcard", lazy="selectin",
    )
    sm2_data: Mapped[list["SM2Data"]] = relationship(
        "SM2Data", back_populates="flashcard", lazy="selectin",
    )
