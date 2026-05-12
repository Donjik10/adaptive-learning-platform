from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ReviewCreate(BaseModel):
    user_id: UUID
    flashcard_id: UUID
    is_correct: bool
    time_spent: float | None = None
    confidence: int | None = None


class ReviewRead(BaseModel):
    id: UUID
    user_id: UUID
    flashcard_id: UUID
    is_correct: bool
    time_spent: float | None
    confidence: int | None
    reviewed_at: datetime

    model_config = {"from_attributes": True}
