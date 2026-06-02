from uuid import UUID

from openai import APIError as OpenAIAPIError
from openai import AsyncOpenAI
from openai import RateLimitError as OpenAIRateLimitError
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.exceptions import AIServiceError, NotFoundError
from app.models.flashcard import Flashcard
from app.models.user import User

LEARNING_STYLE_PROMPTS = {
    "visual": (
        "Use vivid imagery, spatial metaphors, and mental diagrams. "
        "Describe concepts in terms of shapes, colors, and spatial relationships."
    ),
    "auditory": (
        "Use a conversational, lecture-like tone. Incorporate rhythm, "
        "mnemonics, or rhymes where possible."
    ),
    "reading": (
        "Provide a well-structured, text-heavy explanation with clear "
        "headings, definitions, and logical flow."
    ),
    "kinesthetic": (
        "Use real-world analogies, hands-on examples, and step-by-step "
        "walkthroughs that feel like 'doing' rather than just reading."
    ),
}

DEFAULT_STYLE_PROMPT = (
    "Use a balanced approach with clear examples and step-by-step reasoning."
)


class AITutorService:
    """
    Generates personalised explanations using OpenAI GPT-4.

    Consumes the student's learning style (from the User model) and the
    flashcard context to produce a tailored tutorial response.
    """

    def __init__(self, session: AsyncSession):
        self.session = session
        self._client: AsyncOpenAI | None = None

    @property
    def client(self) -> AsyncOpenAI:
        if self._client is None:
            kwargs = {}
            if settings.OPENAI_BASE_URL:
                kwargs["base_url"] = settings.OPENAI_BASE_URL
                kwargs["api_key"] = "ollama"
            elif not settings.OPENAI_API_KEY:
                raise RuntimeError(
                    "OPENAI_API_KEY is not set. Add it to the .env file "
                    "or set OPENAI_BASE_URL for a local model."
                )
            else:
                kwargs["api_key"] = settings.OPENAI_API_KEY
            self._client = AsyncOpenAI(**kwargs)
        return self._client

    async def generate_explanation(
        self,
        flashcard_id: UUID,
        user_id: UUID,
        student_error: str,
    ) -> str:
        """
        Generate a personalised explanation for a student's mistake.

        Args:
            flashcard_id: Target flashcard.
            user_id:      Target user (learning style is read from here).
            student_error: Free-text description of the student's confusion.

        Returns:
            AI-generated explanation string.
        """
        flashcard = await self.session.get(Flashcard, flashcard_id)
        if not flashcard:
            raise NotFoundError(f"Flashcard {flashcard_id} not found")

        user = await self.session.get(User, user_id)
        if not user:
            raise NotFoundError(f"User {user_id} not found")

        style_instruction = LEARNING_STYLE_PROMPTS.get(
            user.learning_style, DEFAULT_STYLE_PROMPT,
        )

        prompt = self._build_prompt(
            question=flashcard.question,
            answer=flashcard.answer,
            explanation_hint=flashcard.explanation_prompt or "",
            student_error=student_error,
            style_instruction=style_instruction,
        )

        try:
            response = await self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are an expert AI tutor in an adaptive learning platform. "
                            "Your task is to help the student understand why their answer "
                            "was wrong and guide them to the correct concept. "
                            "Be encouraging, precise, and tailor your language to the "
                            "student's learning style.\n\n"
                            f"{style_instruction}"
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=settings.OPENAI_TEMPERATURE,
                max_tokens=settings.OPENAI_MAX_TOKENS,
            )
        except OpenAIRateLimitError as e:
            raise AIServiceError(
                "AI tutor is temporarily unavailable (rate limit). Please try again later."
            ) from e
        except OpenAIAPIError as e:
            raise AIServiceError(
                f"AI tutor service error: {e.message}"
            ) from e

        return response.choices[0].message.content or ""

    async def ask(self, prompt: str) -> str:
        """Send a raw prompt to the AI and return the response."""
        try:
            response = await self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are an expert AI tutor. Provide clear, "
                            "constructive feedback to help students learn."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=settings.OPENAI_TEMPERATURE,
                max_tokens=settings.OPENAI_MAX_TOKENS,
            )
        except OpenAIRateLimitError as e:
            raise AIServiceError(
                "AI tutor is temporarily unavailable (rate limit). "
                "Please try again later."
            ) from e
        except OpenAIAPIError as e:
            raise AIServiceError(
                f"AI tutor service error: {e.message}"
            ) from e

        return response.choices[0].message.content or ""

    @staticmethod
    def _build_prompt(
        question: str,
        answer: str,
        explanation_hint: str,
        student_error: str,
        style_instruction: str,
    ) -> str:
        return f"""
## Flashcard
**Question:** {question}
**Correct answer:** {answer}

## Context for tutor
{explanation_hint}

## Student's difficulty
The student answered incorrectly or expressed confusion about this concept.
Their description of the problem: "{student_error}"

## Task
Explain the correct concept in a way that directly addresses the student's
specific misunderstanding shown above. {style_instruction}

Keep your explanation concise (2-4 paragraphs) and focused on clearing up
the exact confusion the student described.
"""
