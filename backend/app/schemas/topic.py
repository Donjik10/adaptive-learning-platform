from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator


class TopicCreate(BaseModel):
    subject_id: UUID
    parent_topic_id: UUID | None = None
    name: str
    description: str | None = None
    order_index: int = 0

    @field_validator("name")
    @classmethod
    def no_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip()


class TopicUpdate(BaseModel):
    parent_topic_id: UUID | None = None
    name: str | None = None
    description: str | None = None
    order_index: int | None = None


class TopicRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    subject_id: UUID
    parent_topic_id: UUID | None
    name: str
    description: str | None
    order_index: int
    created_at: datetime


class TopicTree(TopicRead):
    """Topic with nested children for graph rendering."""
    children: list["TopicTree"] = []
