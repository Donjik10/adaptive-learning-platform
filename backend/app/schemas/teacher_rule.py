from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class TeacherRuleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    teacher_id: UUID
    course_id: UUID
    ai_persona_prompt: str | None
    strict_mode_enabled: bool
    created_at: datetime


class TeacherRuleUpsert(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    course_id: UUID
    ai_persona_prompt: str | None = None
    strict_mode_enabled: bool = True
