from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class TopicCreate(BaseModel):
    subject_id: UUID
    parent_topic_id: UUID | None = None
    name: str
    description: str | None = None
    order_index: int = 0


class TopicUpdate(BaseModel):
    parent_topic_id: UUID | None = None
    name: str | None = None
    description: str | None = None
    order_index: int | None = None


class TopicRead(BaseModel):
    id: UUID
    subject_id: UUID
    parent_topic_id: UUID | None
    name: str
    description: str | None
    order_index: int
    created_at: datetime

    model_config = {"from_attributes": True}


class TopicTree(TopicRead):
    """Topic with nested children for graph rendering."""
    children: list["TopicTree"] = []

    model_config = {"from_attributes": True}
