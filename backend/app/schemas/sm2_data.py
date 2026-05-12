from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class SM2DataUpdate(BaseModel):
    ease_factor: float
    interval: int
    repetitions: int
    next_review_at: datetime | None = None


class SM2DataRead(BaseModel):
    id: UUID
    user_id: UUID
    flashcard_id: UUID
    ease_factor: float
    interval: int
    repetitions: int
    next_review_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
