class BaseAppError(Exception):
    """Base exception for application-level errors."""


class NotFoundError(BaseAppError):
    """Raised when a requested resource does not exist."""


class DuplicateError(BaseAppError):
    """Raised when a unique-constraint violation occurs."""


class AIServiceError(BaseAppError):
    """Raised when an external AI service call fails."""
