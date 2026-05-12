from datetime import datetime
from uuid import UUID
from pydantic import BaseModel


class CourseMaterialRead(BaseModel):
    id: UUID
    teacher_id: UUID
    course_id: UUID
    filename: str
    created_at: datetime
    model_config = {"from_attributes": True}


class CourseMaterialUpload(BaseModel):
    teacher_id: UUID
    course_id: UUID
    filename: str
    content_text: str
