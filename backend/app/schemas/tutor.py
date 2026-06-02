from uuid import UUID

from pydantic import BaseModel


class TutorAskRequest(BaseModel):
    user_id: UUID
    course_id: UUID
    question: str


class SourceInfo(BaseModel):
    filename: str
    text_snippet: str


class TutorAskResponse(BaseModel):
    answer: str
    sources: list[SourceInfo] = []
