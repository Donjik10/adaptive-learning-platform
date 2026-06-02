from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.topic import Topic
from app.schemas.topic import TopicCreate, TopicTree, TopicUpdate


class TopicService:
    """Business logic for Topic CRUD and tree-building."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, data: TopicCreate) -> Topic:
        topic = Topic(**data.model_dump())
        self.session.add(topic)
        await self.session.flush()
        return topic

    async def get_by_id(self, topic_id: UUID) -> Topic:
        topic = await self.session.get(Topic, topic_id)
        if not topic:
            raise NotFoundError(f"Topic {topic_id} not found")
        return topic

    async def get_by_subject(self, subject_id: UUID) -> list[Topic]:
        result = await self.session.execute(
            select(Topic)
            .where(Topic.subject_id == subject_id)
            .order_by(Topic.order_index),
        )
        return list(result.scalars().all())

    async def get_tree(self, subject_id: UUID) -> list[TopicTree]:
        """Return topics as a nested tree (roots → children)."""
        result = await self.session.execute(
            select(Topic)
            .where(Topic.subject_id == subject_id)
            .order_by(Topic.order_index),
        )
        topics = result.scalars().all()

        tree_map: dict[UUID, TopicTree] = {}
        for t in topics:
            tree_map[t.id] = TopicTree(
                id=t.id,
                subject_id=t.subject_id,
                parent_topic_id=t.parent_topic_id,
                name=t.name,
                description=t.description,
                order_index=t.order_index,
                created_at=t.created_at,
                children=[],
            )

        roots: list[TopicTree] = []
        for node in tree_map.values():
            if node.parent_topic_id is None:
                roots.append(node)
            else:
                parent = tree_map.get(node.parent_topic_id)
                if parent is not None:
                    parent.children.append(node)

        return roots

    async def update(self, topic_id: UUID, data: TopicUpdate) -> Topic:
        topic = await self.get_by_id(topic_id)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(topic, field, value)
        await self.session.flush()
        return topic

    async def delete(self, topic_id: UUID) -> None:
        topic = await self.get_by_id(topic_id)
        await self.session.delete(topic)
        await self.session.flush()
