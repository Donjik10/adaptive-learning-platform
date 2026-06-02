from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator


class ReviewCreate(BaseModel):
    user_id: UUID
    flashcard_id: UUID
    is_correct: bool
    time_spent: float | None = None
    confidence: int | None = None

    @field_validator("confidence")
    @classmethod
    def valid_confidence(cls, v: int | None) -> int | None:
        if v is not None and not (1 <= v <= 5):
            raise ValueError("confidence must be between 1 and 5")
        return v

    @field_validator("time_spent")
    @classmethod
    def non_negative(cls, v: float | None) -> float | None:
        if v is not None and v < 0:
            raise ValueError("time_spent must be >= 0")
        return v


class ReviewRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    flashcard_id: UUID
    is_correct: bool
    time_spent: float | None
    confidence: int | None
    reviewed_at: datetime
