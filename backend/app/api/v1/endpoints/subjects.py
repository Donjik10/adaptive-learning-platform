from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_async_session
from app.schemas.subject import SubjectCreate, SubjectRead
from app.services.subject import SubjectService

router = APIRouter()


@router.post("", response_model=SubjectRead, status_code=status.HTTP_201_CREATED)
async def create_subject(
    data: SubjectCreate,
    session: AsyncSession = Depends(get_async_session),
):
    service = SubjectService(session)
    return await service.create(data)


@router.get("", response_model=list[SubjectRead])
async def list_subjects(session: AsyncSession = Depends(get_async_session)):
    service = SubjectService(session)
    return await service.get_all()


@router.get("/{subject_id}", response_model=SubjectRead)
async def get_subject(
    subject_id: UUID,
    session: AsyncSession = Depends(get_async_session),
):
    service = SubjectService(session)
    return await service.get_by_id(subject_id)


@router.delete("/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subject(
    subject_id: UUID,
    session: AsyncSession = Depends(get_async_session),
):
    service = SubjectService(session)
    await service.delete(subject_id)
