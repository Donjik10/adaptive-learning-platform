from uuid import UUID

from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_async_session
from app.models.user import User


async def get_user_by_id(
    user_id: UUID,
    session: AsyncSession = Depends(get_async_session),
) -> User:
    """
    Dependency that fetches a User by primary key.

    Raises 404 if the user does not exist.
    """
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found",
        )
    return user
