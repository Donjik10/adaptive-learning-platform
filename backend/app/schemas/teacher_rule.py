from datetime import datetime
from uuid import UUID
from pydantic import BaseModel


class TeacherRuleRead(BaseModel):
    id: UUID
    teacher_id: UUID
    course_id: UUID
    ai_persona_prompt: str | None
    strict_mode_enabled: bool
    created_at: datetime
    model_config = {"from_attributes": True}


class TeacherRuleUpsert(BaseModel):
    course_id: UUID
    ai_persona_prompt: str | None = None
    strict_mode_enabled: bool = True
