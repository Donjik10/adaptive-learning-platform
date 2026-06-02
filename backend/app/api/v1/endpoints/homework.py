from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.v1.dependencies import get_current_active_user, require_role
from app.database import get_async_session
from app.models.assignment import Assignment
from app.models.message import Message, SenderType
from app.models.submission import Submission, SubmissionStatus
from app.models.user import User, UserRole
from app.services.ai_tutor import AITutorService

router = APIRouter(prefix="/homework", tags=["homework"])


# ── Schemas ───────────────────────────────────────────────

class AssignmentCreate(BaseModel):
    course_id: UUID
    title: str
    description: str | None = None
    deadline: str | None = None  # ISO datetime string


class AssignmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    teacher_id: UUID
    course_id: UUID
    title: str
    description: str | None
    deadline: datetime | None
    created_at: datetime


class SubmissionCreate(BaseModel):
    assignment_id: UUID
    content_text: str | None = None
    file_url: str | None = None


class SubmissionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    assignment_id: UUID
    student_id: UUID
    content_text: str | None
    file_url: str | None
    status: str
    created_at: datetime


class ChatMessageCreate(BaseModel):
    message_text: str


class ChatMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    submission_id: UUID
    sender_id: UUID | None
    sender_type: str
    message_text: str
    created_at: datetime


# ── Assignments ───────────────────────────────────────────

@router.post("/assignments", response_model=AssignmentResponse, status_code=status.HTTP_201_CREATED)
async def create_assignment(
    req: AssignmentCreate,
    current_user: Annotated[User, Depends(require_role(UserRole.TEACHER))],
    session: AsyncSession = Depends(get_async_session),
):
    from datetime import datetime

    deadline_dt = None
    if req.deadline:
        deadline_dt = datetime.fromisoformat(req.deadline)

    assignment = Assignment(
        teacher_id=current_user.id,
        course_id=req.course_id,
        title=req.title,
        description=req.description,
        deadline=deadline_dt,
    )
    session.add(assignment)
    await session.commit()
    await session.refresh(assignment)
    return assignment


@router.get("/assignments", response_model=list[AssignmentResponse])
async def list_assignments(
    course_id: UUID | None = None,
    session: AsyncSession = Depends(get_async_session),
):
    stmt = select(Assignment)
    if course_id:
        stmt = stmt.where(Assignment.course_id == course_id)
    result = await session.execute(stmt)
    return result.scalars().all()


@router.get("/assignments/{assignment_id}", response_model=AssignmentResponse)
async def get_assignment(
    assignment_id: UUID,
    session: AsyncSession = Depends(get_async_session),
):
    result = await session.execute(
        select(Assignment).where(Assignment.id == assignment_id),
    )
    assignment = result.scalar_one_or_none()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return assignment


# ── Submissions ───────────────────────────────────────────

@router.post("/submissions", response_model=SubmissionResponse, status_code=status.HTTP_201_CREATED)
async def create_submission(
    req: SubmissionCreate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: AsyncSession = Depends(get_async_session),
):
    assignment = await session.execute(
        select(Assignment).where(Assignment.id == req.assignment_id),
    )
    if not assignment.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Assignment not found")

    # Prevent duplicate submissions from the same student
    existing = await session.execute(
        select(Submission).where(
            Submission.assignment_id == req.assignment_id,
            Submission.student_id == current_user.id,
        ),
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Submission already exists")

    submission = Submission(
        assignment_id=req.assignment_id,
        student_id=current_user.id,
        content_text=req.content_text,
        file_url=req.file_url,
    )
    session.add(submission)
    await session.commit()
    await session.refresh(submission)
    return submission


@router.get("/submissions", response_model=list[SubmissionResponse])
async def list_submissions(
    current_user: Annotated[User, Depends(get_current_active_user)],
    assignment_id: UUID | None = None,
    session: AsyncSession = Depends(get_async_session),
):
    stmt = select(Submission)
    if current_user.role == UserRole.STUDENT:
        stmt = stmt.where(Submission.student_id == current_user.id)
    elif current_user.role == UserRole.TEACHER:
        stmt = stmt.join(Assignment, Submission.assignment_id == Assignment.id)
        stmt = stmt.where(Assignment.teacher_id == current_user.id)
    if assignment_id:
        stmt = stmt.where(Submission.assignment_id == assignment_id)
    result = await session.execute(stmt)
    return result.scalars().all()


@router.get("/submissions/{submission_id}", response_model=SubmissionResponse)
async def get_submission(
    submission_id: UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: AsyncSession = Depends(get_async_session),
):
    result = await session.execute(
        select(Submission).where(Submission.id == submission_id),
    )
    submission = result.scalar_one_or_none()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    if current_user.role == UserRole.STUDENT and submission.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return submission


# ── Chat / Messages ───────────────────────────────────────

@router.get("/submissions/{submission_id}/chat", response_model=list[ChatMessageResponse])
async def get_chat_messages(
    submission_id: UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: AsyncSession = Depends(get_async_session),
):
    result = await session.execute(
        select(Message)
        .where(Message.submission_id == submission_id)
        .order_by(Message.created_at),
    )
    return result.scalars().all()


@router.post(
    "/submissions/{submission_id}/chat",
    response_model=ChatMessageResponse,
    status_code=status.HTTP_201_CREATED,
)
async def post_chat_message(
    submission_id: UUID,
    req: ChatMessageCreate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: AsyncSession = Depends(get_async_session),
):
    result = await session.execute(
        select(Submission).where(Submission.id == submission_id),
    )
    submission = result.scalar_one_or_none()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    if current_user.role == UserRole.STUDENT and submission.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    sender_type = (
        SenderType.TEACHER
        if current_user.role == UserRole.TEACHER
        else SenderType.STUDENT
    )
    message = Message(
        submission_id=submission_id,
        sender_id=current_user.id,
        sender_type=sender_type,
        message_text=req.message_text,
    )
    session.add(message)
    await session.commit()
    await session.refresh(message)
    return message


@router.post(
    "/submissions/{submission_id}/chat/ai-review",
    response_model=ChatMessageResponse,
    status_code=status.HTTP_201_CREATED,
)
async def request_ai_review(
    submission_id: UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: AsyncSession = Depends(get_async_session),
):
    result = await session.execute(
        select(Submission)
        .where(Submission.id == submission_id)
        .options(selectinload(Submission.assignment)),
    )
    submission = result.scalar_one_or_none()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    if current_user.role == UserRole.STUDENT and submission.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    ai_service = AITutorService(session)
    prompt = (
        "You are an AI tutor. Review the student's submission and provide "
        "constructive feedback.\n\n"
        f"Assignment: {submission.assignment.title}\n"
        f"Description: {submission.assignment.description or 'N/A'}\n\n"
        f"Student submission:\n{submission.content_text or '(no text provided)'}\n\n"
        f"Provide helpful, encouraging feedback with specific suggestions for improvement."
    )
    feedback = await ai_service.ask(prompt)

    ai_message = Message(
        submission_id=submission_id,
        sender_id=None,
        sender_type=SenderType.AI_TUTOR,
        message_text=feedback,
    )
    session.add(ai_message)

    if submission.status == SubmissionStatus.PENDING:
        submission.status = SubmissionStatus.AI_REVIEWED

    await session.commit()
    await session.refresh(ai_message)
    return ai_message
