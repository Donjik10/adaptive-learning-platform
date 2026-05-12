from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class SubjectCreate(BaseModel):
    name: str
    description: str | None = None


class SubjectRead(BaseModel):
    id: UUID
    name: str
    description: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
