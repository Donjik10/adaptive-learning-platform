from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import DuplicateError, NotFoundError
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate


class UserService:
    """Business logic for User CRUD operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, data: UserCreate) -> User:
        existing = await self.session.execute(
            select(User).where(User.email == data.email),
        )
        if existing.scalar_one_or_none():
            raise DuplicateError(f"Email {data.email} already in use")
        user = User(**data.model_dump())
        self.session.add(user)
        await self.session.flush()
        return user

    async def get_by_id(self, user_id: UUID) -> User:
        user = await self.session.get(User, user_id)
        if not user:
            raise NotFoundError(f"User {user_id} not found")
        return user

    async def get_all(self) -> list[User]:
        result = await self.session.execute(select(User).order_by(User.created_at))
        return list(result.scalars().all())

    async def update(self, user_id: UUID, data: UserUpdate) -> User:
        user = await self.get_by_id(user_id)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(user, field, value)
        await self.session.flush()
        return user

    async def delete(self, user_id: UUID) -> None:
        user = await self.get_by_id(user_id)
        await self.session.delete(user)
        await self.session.flush()
