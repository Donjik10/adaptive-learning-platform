from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator


class SM2DataUpdate(BaseModel):
    ease_factor: float
    interval: int
    repetitions: int
    next_review_at: datetime | None = None

    @field_validator("ease_factor")
    @classmethod
    def min_ease(cls, v: float) -> float:
        if v < 1.3:
            raise ValueError("ease_factor must be >= 1.3")
        return v

    @field_validator("interval", "repetitions")
    @classmethod
    def non_negative(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Value must be >= 0")
        return v


class SM2DataRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    flashcard_id: UUID
    ease_factor: float
    interval: int
    repetitions: int
    next_review_at: datetime | None
    created_at: datetime
    updated_at: datetime
