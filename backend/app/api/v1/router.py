from fastapi import APIRouter

from app.api.v1.endpoints import ai_tutor, flashcards, reviews, subjects, topics, users

api_router = APIRouter()

api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(subjects.router, prefix="/subjects", tags=["Subjects"])
api_router.include_router(topics.router, prefix="/topics", tags=["Topics"])
api_router.include_router(flashcards.router, prefix="/flashcards", tags=["Flashcards"])
api_router.include_router(reviews.router, prefix="/reviews", tags=["Reviews"])
api_router.include_router(ai_tutor.router, prefix="/ai-tutor", tags=["AI Tutor"])
