from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_async_session
from app.schemas.topic import TopicCreate, TopicRead, TopicTree, TopicUpdate
from app.services.topic import TopicService

router = APIRouter()


@router.post("", response_model=TopicRead, status_code=status.HTTP_201_CREATED)
async def create_topic(
    data: TopicCreate,
    session: AsyncSession = Depends(get_async_session),
):
    service = TopicService(session)
    return await service.create(data)


@router.get("/by-subject/{subject_id}", response_model=list[TopicRead])
async def list_topics_by_subject(
    subject_id: UUID,
    session: AsyncSession = Depends(get_async_session),
):
    service = TopicService(session)
    return await service.get_by_subject(subject_id)


@router.get("/tree/{subject_id}", response_model=list[TopicTree])
async def get_topic_tree(
    subject_id: UUID,
    session: AsyncSession = Depends(get_async_session),
):
    """Return the topic hierarchy as a nested tree."""
    service = TopicService(session)
    return await service.get_tree(subject_id)


@router.get("/{topic_id}", response_model=TopicRead)
async def get_topic(
    topic_id: UUID,
    session: AsyncSession = Depends(get_async_session),
):
    service = TopicService(session)
    return await service.get_by_id(topic_id)


@router.patch("/{topic_id}", response_model=TopicRead)
async def update_topic(
    topic_id: UUID,
    data: TopicUpdate,
    session: AsyncSession = Depends(get_async_session),
):
    service = TopicService(session)
    return await service.update(topic_id, data)


@router.delete("/{topic_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_topic(
    topic_id: UUID,
    session: AsyncSession = Depends(get_async_session),
):
    service = TopicService(session)
    await service.delete(topic_id)
