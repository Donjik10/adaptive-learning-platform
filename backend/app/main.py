from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import api_router
from app.config import settings
from app.core.exceptions import AIServiceError, DuplicateError, NotFoundError
from app.database import async_session_factory, init_db
from app.utils.seed import seed_demo_data


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan handler that initialises the database on startup
    and performs cleanup on shutdown.
    """
    await init_db()
    async with async_session_factory() as session:
        await seed_demo_data(session)
        await session.commit()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_PREFIX)

# Serve uploaded files statically
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.exception_handler(NotFoundError)
async def not_found_handler(request: Request, exc: NotFoundError):
    return JSONResponse(status_code=404, content={"detail": str(exc)})


@app.exception_handler(DuplicateError)
async def duplicate_handler(request: Request, exc: DuplicateError):
    return JSONResponse(status_code=409, content={"detail": str(exc)})


@app.exception_handler(AIServiceError)
async def ai_service_handler(request: Request, exc: AIServiceError):
    return JSONResponse(status_code=503, content={"detail": str(exc)})


@app.get("/health")
async def health_check():
    """Simple liveness probe."""
    return {"status": "healthy"}
