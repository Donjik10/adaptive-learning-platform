import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    """
    Represents a learner in the adaptive platform.

    Stores personalisation parameters such as learning style and
    daily study limit which are consumed by the scheduling module.
    """

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    email: Mapped[str] = mapped_column(String(256), unique=True, nullable=False, index=True)
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

    review_history: Mapped[list["ReviewHistory"]] = relationship(
        "ReviewHistory", back_populates="user", lazy="selectin",
    )
    sm2_data: Mapped[list["SM2Data"]] = relationship(
        "SM2Data", back_populates="user", lazy="selectin",
    )
