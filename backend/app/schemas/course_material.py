from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator


class CourseMaterialRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    teacher_id: UUID
    course_id: UUID
    filename: str
    content_text: str | None
    file_url: str | None
    created_at: datetime


class CourseMaterialUpload(BaseModel):
    teacher_id: UUID
    course_id: UUID
    filename: str
    content_text: str

    @field_validator("filename")
    @classmethod
    def validate_filename(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Filename cannot be empty")
        return v.strip()

    @field_validator("content_text")
    @classmethod
    def validate_content(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Content cannot be empty")
        return v.strip()
