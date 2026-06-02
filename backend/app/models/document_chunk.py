from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.course_material import CourseMaterial


class DocumentChunk(Base):
    """
    Кусок текста из загруженного материала курса.

    Хранит текст и эмбеддинг (JSON-список float) для векторного поиска.
    Для MVP используется cosine similarity, вычисляемый в Python.
    """

    __tablename__ = "document_chunks"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    material_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("course_materials.id", ondelete="CASCADE"),
        index=True,
    )
    text_chunk: Mapped[str] = mapped_column(Text, nullable=False)
    token_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )
    # JSON-массив float, например [0.01, -0.03, ...]
    embedding: Mapped[str | None] = mapped_column(Text, nullable=True)

    material: Mapped[CourseMaterial] = relationship(
        "CourseMaterial", back_populates="chunks",
    )
