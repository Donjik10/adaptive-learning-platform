import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    UUID,
    DateTime,
    Enum,
    ForeignKey,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class SenderType(enum.Enum):
    STUDENT = "student"
    TEACHER = "teacher"
    AI_TUTOR = "ai_tutor"


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    submission_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("submissions.id", ondelete="CASCADE"), nullable=False,
    )
    sender_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True,
    )
    sender_type: Mapped[SenderType] = mapped_column(
        Enum(SenderType), nullable=False,
    )
    message_text: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )

    submission: Mapped["Submission"] = relationship(
        "Submission", back_populates="messages",
    )
    sender: Mapped["User | None"] = relationship("User")
