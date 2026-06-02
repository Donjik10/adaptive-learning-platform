from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, Float, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.assignment import Assignment
    from app.models.review_history import ReviewHistory
    from app.models.sm2_data import SM2Data
    from app.models.submission import Submission


class UserRole(enum.Enum):
    STUDENT = "student"
    TEACHER = "teacher"
    ADMIN = "admin"


class User(Base):
    """
    Represents a user in the adaptive platform.

    Stores personalisation parameters such as learning style and
    daily study limit which are consumed by the scheduling module.
    """

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    email: Mapped[str] = mapped_column(String(256), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(256), nullable=False, default="")
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole), nullable=False, default=UserRole.STUDENT,
    )
    learning_style: Mapped[str | None] = mapped_column(
        String(32), nullable=True,
        comment="Preferred learning style: visual / reading / auditory / kinesthetic",
    )
    daily_study_limit: Mapped[int | None] = mapped_column(
        Float, nullable=True, default=60.0,
        comment="Daily study time limit in minutes",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(),
    )

    review_history: Mapped[list[ReviewHistory]] = relationship(
        "ReviewHistory", back_populates="user", lazy="selectin",
    )
    sm2_data: Mapped[list[SM2Data]] = relationship(
        "SM2Data", back_populates="user", lazy="selectin",
    )
    assignments: Mapped[list[Assignment]] = relationship(
        "Assignment", back_populates="teacher", lazy="selectin",
    )
    submissions: Mapped[list[Submission]] = relationship(
        "Submission", back_populates="student", lazy="selectin",
    )
