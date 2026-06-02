from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    learning_style: str | None = None
    daily_study_limit: float | None = 60.0

    @field_validator("name")
    @classmethod
    def no_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip()

    @field_validator("daily_study_limit")
    @classmethod
    def positive(cls, v: float | None) -> float | None:
        if v is not None and v <= 0:
            raise ValueError("daily_study_limit must be positive")
        return v


class UserUpdate(BaseModel):
    name: str | None = None
    learning_style: str | None = None
    daily_study_limit: float | None = None


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    email: str
    learning_style: str | None
    daily_study_limit: float | None
    created_at: datetime
    updated_at: datetime
