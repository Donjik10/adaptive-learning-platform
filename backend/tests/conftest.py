"""Pytest fixtures and configuration."""

import pytest


@pytest.fixture
def sample_flashcard_data() -> dict:
    return {"question": "What is 2+2?", "answer": "4"}


@pytest.fixture
def sample_user_data() -> dict:
    return {
        "name": "Test User",
        "email": "test@example.com",
        "password": "test123456",
        "role": "student",
    }


@pytest.fixture
def sample_vectors() -> tuple[list[float], list[float]]:
    return ([1.0, 2.0, 3.0], [4.0, 5.0, 6.0])
