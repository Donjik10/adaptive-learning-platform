from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.flashcard import Flashcard
from app.models.subject import Subject
from app.models.topic import Topic
from app.models.user import User, UserRole


async def seed_demo_data(session: AsyncSession) -> None:
    result = await session.execute(select(Subject).limit(1))
    if result.scalar_one_or_none() is not None:
        return

    from datetime import datetime, timedelta
    from app.services.auth import get_password_hash

    user = User(
        name="Demo Student",
        email="demo@student.com",
        hashed_password=get_password_hash("demo123"),
        role=UserRole.STUDENT,
        learning_style="visual",
        daily_study_limit=60,
    )
    session.add(user)
    await session.flush()

    # Create a teacher user
    teacher_user = User(
        name="Demo Teacher",
        email="demo@teacher.com",
        hashed_password=get_password_hash("teacher123"),
        role=UserRole.TEACHER,
        learning_style="visual",
        daily_study_limit=60,
    )
    session.add(teacher_user)
    await session.flush()

    courses = [
        {
            "name": "Mathematics",
            "description": "Numbers, logic & problem solving",
            "topics": [
                ("Algebra", "Variables & expressions", [
                    "What is a variable?", "A symbol for an unknown value",
                    "Simplify 2x + 3x", "5x",
                    "Evaluate 3a + 2b when a=2, b=3", "12",
                ]),
                ("Linear Equations", "Solving ax + b = c", [
                    "Solve 2x + 3 = 7", "x = 2",
                    "Solve 5x - 10 = 0", "x = 2",
                    "Solve 3(x + 2) = 15", "x = 3",
                ]),
                ("Quadratic Equations", "Solving ax² + bx + c = 0", [
                    "Solve x² - 9 = 0", "x = ±3",
                    "Factor x² + 5x + 6", "(x + 2)(x + 3)",
                    "Solve x² - 4x + 4 = 0", "x = 2",
                ]),
                ("Geometry", "Shapes, angles & proofs", [
                    "What is Pythagoras theorem?", "a² + b² = c²",
                    "Area of a triangle", "½ × base × height",
                    "Sum of angles in a triangle", "180°",
                ]),
            ],
        },
        {
            "name": "Physics",
            "description": "Forces, energy & motion",
            "topics": [
                ("Mechanics", "Motion, forces & Newton's laws", [
                    "What is Newton's First Law?", "Object stays at rest or uniform motion unless acted upon",
                    "Formula for force", "F = ma",
                    "What is acceleration?", "Rate of change of velocity",
                ]),
                ("Thermodynamics", "Heat & energy transfer", [
                    "What is the 1st Law of Thermodynamics?", "Energy cannot be created or destroyed",
                    "What is entropy?", "Measure of disorder in a system",
                    "Formula for heat energy", "Q = mcΔT",
                ]),
                ("Optics", "Light & lenses", [
                    "What is the speed of light?", "3 × 10⁸ m/s",
                    "What does a convex lens do?", "Converges light rays",
                    "Law of reflection", "Angle of incidence = angle of reflection",
                ]),
                ("Electromagnetism", "Electricity & magnetism", [
                    "What is Ohm's Law?", "V = IR",
                    "What is a magnetic field?", "Region around a magnet where force acts",
                    "Unit of electric current", "Ampere (A)",
                ]),
            ],
        },
        {
            "name": "English",
            "description": "Grammar, vocabulary & reading",
            "topics": [
                ("Grammar", "Tenses, articles & prepositions", [
                    "What is present simple?", "I walk, he walks",
                    "What is past perfect?", "I had walked",
                    "When to use 'a' vs 'an'?", "Use 'an' before vowel sounds",
                ]),
                ("Vocabulary", "Word roots & building", [
                    "What does 'benevolent' mean?", "Kind, generous",
                    "Prefix 'un-' means?", "Not or opposite of",
                    "What is a synonym?", "A word with similar meaning",
                ]),
                ("Reading Comprehension", "Understanding texts", [
                    "What is the main idea?", "The central point of a text",
                    "What is inference?", "Reading between the lines",
                    "What is a conclusion?", "The final judgment reached",
                ]),
            ],
        },
        {
            "name": "Programming",
            "description": "Python, algorithms & data structures",
            "topics": [
                ("Python Basics", "Variables, loops & functions", [
                    "How to print in Python?", "print('Hello')",
                    "What is a list?", "Ordered, mutable collection",
                    "How to define a function?", "def my_func():",
                ]),
                ("Data Structures", "Lists, dicts & sets", [
                    "What is a dictionary?", "Key-value pairs",
                    "What is a set?", "Unordered unique elements",
                    "What does .append() do?", "Adds item to end of list",
                ]),
                ("Algorithms", "Sorting, searching & complexity", [
                    "What is Big O notation?", "Describes algorithm efficiency",
                    "What is binary search?", "O(log n) search on sorted array",
                    "What is bubble sort?", "Simple O(n²) sorting algorithm",
                ]),
            ],
        },
    ]

    for course in courses:
        subject = Subject(name=course["name"], description=course["description"])
        session.add(subject)
        await session.flush()

        for idx, (topic_name, topic_desc, cards) in enumerate(course["topics"]):
            topic = Topic(
                subject_id=subject.id,
                parent_topic_id=None,
                name=topic_name,
                description=topic_desc,
                order_index=idx,
            )
            session.add(topic)
            await session.flush()

            for q, a in zip(cards[0::2], cards[1::2]):
                session.add(Flashcard(topic_id=topic.id, question=q, answer=a))

        await session.flush()

    # Demo assignments
    from app.models.assignment import Assignment
    from app.models.submission import Submission, SubmissionStatus
    from app.models.message import Message, SenderType

    subjects_result = await session.execute(select(Subject))
    subjects_list = subjects_result.scalars().all()

    assignments_data = [
        {
            "course": subjects_list[0],
            "title": "Algebra Problem Set #1",
            "description": "Solve 10 linear equations from Chapter 3.",
            "deadline": datetime.now() + timedelta(days=7),
        },
        {
            "course": subjects_list[0],
            "title": "Geometry Quiz",
            "description": "Calculate areas and perimeters for 5 shapes.",
            "deadline": datetime.now() + timedelta(days=14),
        },
        {
            "course": subjects_list[1],
            "title": "Newton's Laws Essay",
            "description": "Write a 500-word essay explaining Newton's three laws with real-world examples.",
            "deadline": datetime.now() + timedelta(days=10),
        },
        {
            "course": subjects_list[2],
            "title": "Vocabulary Test",
            "description": "Learn 20 new words and use them in sentences.",
            "deadline": datetime.now() + timedelta(days=5),
        },
        {
            "course": subjects_list[3],
            "title": "Python Functions",
            "description": "Write 5 functions with docstrings and type hints.",
            "deadline": datetime.now() + timedelta(days=3),
        },
    ]

    for idx, ad in enumerate(assignments_data):
        assignment = Assignment(
            teacher_id=teacher_user.id,
            course_id=ad["course"].id,
            title=ad["title"],
            description=ad["description"],
            deadline=ad["deadline"],
        )
        session.add(assignment)
        await session.flush()

        # Create a submission for the first 3 assignments
        if idx < 3:
            submission = Submission(
                assignment_id=assignment.id,
                student_id=user.id,
                content_text=f"Here is my submission for {ad['title']}. I completed all the required tasks.",
                status=SubmissionStatus.PENDING,
            )
            session.add(submission)
            await session.flush()

            # Add some demo chat messages
            msg1 = Message(
                submission_id=submission.id,
                sender_id=user.id,
                sender_type=SenderType.STUDENT,
                message_text="I have completed the assignment, please review.",
            )
            session.add(msg1)

            # AI review for first submission
            if idx == 0:
                ai_msg = Message(
                    submission_id=submission.id,
                    sender_id=None,
                    sender_type=SenderType.AI_TUTOR,
                    message_text="Great work! Your solutions are mostly correct. Consider showing your work step-by-step for partial credit. Check problem #3 — you may have made a small sign error.",
                )
                session.add(ai_msg)
                submission.status = SubmissionStatus.AI_REVIEWED

            # Teacher review for second submission
            if idx == 1:
                teacher_msg = Message(
                    submission_id=submission.id,
                    sender_id=teacher_user.id,
                    sender_type=SenderType.TEACHER,
                    message_text="Excellent! You demonstrated a solid understanding of geometric concepts. 95/100.",
                )
                session.add(teacher_msg)
                submission.status = SubmissionStatus.REVIEWED

    await session.flush()
