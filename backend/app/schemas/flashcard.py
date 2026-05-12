from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class FlashcardCreate(BaseModel):
    topic_id: UUID
    question: str
    answer: str
    explanation_prompt: str | None = None


class FlashcardUpdate(BaseModel):
    question: str | None = None
    answer: str | None = None
    explanation_prompt: str | None = None


class FlashcardRead(BaseModel):
    id: UUID
    topic_id: UUID
    question: str
    answer: str
    explanation_prompt: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
