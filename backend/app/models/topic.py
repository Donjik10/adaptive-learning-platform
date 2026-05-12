import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Topic(Base):
    """
    A knowledge unit within a subject.

    Topics form a directed acyclic graph (DAG) via *parent_topic_id*,
    which enables prerequisite-chain analysis for gap detection.

    Examples inside "Mathematics":
        "Algebra" → "Linear Equations" → "Systems of Equations"
    """

    __tablename__ = "topics"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    subject_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("subjects.id", ondelete="CASCADE"),
        index=True,
    )
    parent_topic_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("topics.id", ondelete="SET NULL"),
        nullable=True,
        comment="Prerequisite topic; None means root-level topic",
    )
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    description: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    order_index: Mapped[int] = mapped_column(default=0, comment="Sort order within the subject")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )

    subject: Mapped["Subject"] = relationship("Subject", back_populates="topics")
    parent_topic: Mapped["Topic | None"] = relationship(
        "Topic", remote_side="Topic.id", backref="children",
    )
    flashcards: Mapped[list["Flashcard"]] = relationship(
        "Flashcard", back_populates="topic", lazy="selectin",
    )
