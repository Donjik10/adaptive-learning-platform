from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.dependencies import require_role
from app.database import get_async_session
from app.models.user import User, UserRole
from app.models.video_material import VideoMaterial, VideoSourceType

router = APIRouter(prefix="/videos", tags=["videos"])


class VideoCreate(BaseModel):
    course_id: UUID
    title: str
    description: str | None = None
    source_type: str  # "upload" or "external_link"
    external_url: str | None = None


class VideoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    teacher_id: UUID
    course_id: UUID
    title: str
    description: str | None
    source_type: str
    file_url: str | None
    external_url: str | None
    created_at: datetime


@router.post("", response_model=VideoResponse, status_code=status.HTTP_201_CREATED)
async def create_video(
    req: VideoCreate,
    current_user: Annotated[User, Depends(require_role(UserRole.TEACHER))],
    session: AsyncSession = Depends(get_async_session),
):
    video = VideoMaterial(
        teacher_id=current_user.id,
        course_id=req.course_id,
        title=req.title,
        description=req.description,
        source_type=VideoSourceType(req.source_type),
        external_url=req.external_url,
    )
    session.add(video)
    await session.commit()
    await session.refresh(video)
    return video


@router.get("", response_model=list[VideoResponse])
async def list_videos(
    course_id: UUID | None = None,
    session: AsyncSession = Depends(get_async_session),
):
    stmt = select(VideoMaterial)
    if course_id:
        stmt = stmt.where(VideoMaterial.course_id == course_id)
    result = await session.execute(stmt)
    return result.scalars().all()


@router.get("/{video_id}", response_model=VideoResponse)
async def get_video(
    video_id: UUID,
    session: AsyncSession = Depends(get_async_session),
):
    result = await session.execute(
        select(VideoMaterial).where(VideoMaterial.id == video_id),
    )
    video = result.scalar_one_or_none()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    return video


@router.delete("/{video_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_video(
    video_id: UUID,
    current_user: Annotated[User, Depends(require_role(UserRole.TEACHER))],
    session: AsyncSession = Depends(get_async_session),
):
    result = await session.execute(
        select(VideoMaterial).where(VideoMaterial.id == video_id),
    )
    video = result.scalar_one_or_none()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    if video.teacher_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Access denied")
    await session.delete(video)
    await session.commit()