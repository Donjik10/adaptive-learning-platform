from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import DuplicateError, NotFoundError
from app.models.subject import Subject
from app.schemas.subject import SubjectCreate


class SubjectService:
    """Business logic for Subject CRUD operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, data: SubjectCreate) -> Subject:
        existing = await self.session.execute(
            select(Subject).where(Subject.name == data.name),
        )
        if existing.scalar_one_or_none():
            raise DuplicateError(f"Subject '{data.name}' already exists")
        subject = Subject(**data.model_dump())
        self.session.add(subject)
        await self.session.flush()
        return subject

    async def get_by_id(self, subject_id: UUID) -> Subject:
        subject = await self.session.get(Subject, subject_id)
        if not subject:
            raise NotFoundError(f"Subject {subject_id} not found")
        return subject

    async def get_all(self) -> list[Subject]:
        result = await self.session.execute(select(Subject).order_by(Subject.name))
        return list(result.scalars().all())

    async def delete(self, subject_id: UUID) -> None:
        subject = await self.get_by_id(subject_id)
        await self.session.delete(subject)
        await self.session.flush()
