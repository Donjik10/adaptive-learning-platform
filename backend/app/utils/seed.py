"""
Demo-data seeder.

Creates a default user, subject, topic, and flashcards when the
database is first started (i.e. no subjects exist yet).
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.flashcard import Flashcard
from app.models.subject import Subject
from app.models.topic import Topic
from app.models.user import User


async def seed_demo_data(session: AsyncSession) -> None:
    """Insert demo records if the subjects table is empty."""
    result = await session.execute(select(Subject).limit(1))
    if result.scalar_one_or_none() is not None:
        return

    user = User(
        name="Demo Student",
        email="demo@student.com",
        learning_style="visual",
        daily_study_limit=60,
    )
    session.add(user)
    await session.flush()

    subject = Subject(name="Mathematics", description="Numbers & logic")
    session.add(subject)
    await session.flush()

    topics_data = [
        ("Algebra", "Variables, expressions, equations", 0, None),
        ("Linear Equations", "Solving ax + b = c", 1, None),
        ("Quadratic Equations", "Solving ax² + bx + c = 0", 2, None),
    ]
    topics = []
    for name, desc, order, parent_idx in topics_data:
        t = Topic(
            subject_id=subject.id,
            parent_topic_id=topics[parent_idx].id if parent_idx is not None else None,
            name=name,
            description=desc,
            order_index=order,
        )
        session.add(t)
        topics.append(t)
    await session.flush()

    flashcards_data = [
        (topics[1].id, "Solve 2x + 3 = 7", "x = 2"),
        (topics[1].id, "Solve 5x - 10 = 0", "x = 2"),
        (topics[1].id, "Solve 3(x + 2) = 15", "x = 3"),
        (topics[2].id, "Solve x² - 9 = 0", "x = ±3"),
        (topics[2].id, "Factor x² + 5x + 6", "(x + 2)(x + 3)"),
        (topics[0].id, "What is a variable?", "A symbol representing an unknown value"),
    ]
    for topic_id, question, answer in flashcards_data:
        session.add(
            Flashcard(topic_id=topic_id, question=question, answer=answer)
        )
    await session.flush()
