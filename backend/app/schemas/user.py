from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    learning_style: str | None = None
    daily_study_limit: float | None = 60.0


class UserUpdate(BaseModel):
    name: str | None = None
    learning_style: str | None = None
    daily_study_limit: float | None = None


class UserRead(BaseModel):
    id: UUID
    name: str
    email: str
    learning_style: str | None
    daily_study_limit: float | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
