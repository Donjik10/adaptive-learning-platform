from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.subject import Subject
    from app.models.user import User


class TeacherRule(Base):
    """
    Правила учителя: системный промт ИИ и флаг строгого режима.

    Привязывается к курсу (subject) — учитель задаёт границы,
    внутри которых работает ИИ-репетитор для этого курса.
    """

    __tablename__ = "teacher_rules"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    teacher_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )
    course_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("subjects.id", ondelete="CASCADE"),
        index=True,
    )
    ai_persona_prompt: Mapped[str | None] = mapped_column(
        Text, nullable=True,
        comment="Системный промт для ИИ-репетитора, заданный учителем",
    )
    strict_mode_enabled: Mapped[bool] = mapped_column(
        Boolean, default=False,
        comment="Если True, ИИ отвечает ТОЛЬКО на основе загруженных материалов",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )

    teacher: Mapped[User] = relationship("User", backref="teacher_rules")
    course: Mapped[Subject] = relationship("Subject", backref="teacher_rules")

    @classmethod
    async def get_for_course(cls, session, course_id):
        from sqlalchemy import select
        result = await session.execute(
            select(cls).where(cls.course_id == course_id)
        )
        return result.scalar_one_or_none()
