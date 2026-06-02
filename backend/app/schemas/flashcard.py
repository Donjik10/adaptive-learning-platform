from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator


class FlashcardCreate(BaseModel):
    topic_id: UUID
    question: str
    answer: str
    explanation_prompt: str | None = None

    @field_validator("question", "answer")
    @classmethod
    def no_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Field cannot be empty")
        return v.strip()


class FlashcardUpdate(BaseModel):
    question: str | None = None
    answer: str | None = None
    explanation_prompt: str | None = None


class FlashcardRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    topic_id: UUID
    question: str
    answer: str
    explanation_prompt: str | None
    created_at: datetime
