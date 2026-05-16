from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Application configuration loaded from environment variables.

    Attributes:
        DATABASE_URL: PostgreSQL DSN with async driver.
        REDIS_URL: Redis connection string.
        OPENAI_API_KEY: API key for OpenAI GPT-4.
        SECRET_KEY: Secret key for JWT / session signing.
        DEBUG: Enable debug mode.
        API_V1_PREFIX: URL prefix for v1 API routes.
        PROJECT_NAME: Application name displayed in docs.
    """

    DATABASE_URL: str = "postgresql+asyncpg://ai_platform:ai_platform_secret@localhost:5432/ai_platform"
    REDIS_URL: str = "redis://localhost:6379/0"
    OPENAI_API_KEY: str = ""
    SECRET_KEY: str = "super-secret-key-change-in-production"
    DEBUG: bool = True

    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "Adaptive Learning Platform"
    OPENAI_BASE_URL: str = ""
    OPENAI_MODEL: str = "llama3.2:3b"
    OPENAI_MAX_TOKENS: int = 500
    OPENAI_TEMPERATURE: float = 0.7

    # JWT
    JWT_SECRET_KEY: str = "jwt-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
