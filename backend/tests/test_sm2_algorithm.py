"""Tests for the SM-2 algorithm — the core scheduling logic."""

from datetime import UTC, datetime, timedelta

from app.utils.sm2_algorithm import SM2Result, calculate_sm2


def test_sm2_initial_review():
    """First review of a new card with quality=5."""
    result = calculate_sm2(ease_factor=2.5, interval=0, repetitions=0, quality=5)
    assert result.interval == 1
    assert result.repetitions == 1
    assert result.ease_factor == 2.6
    assert result.next_review_at > datetime.now(UTC)


def test_sm2_second_review():
    """Second consecutive correct answer — interval should be 6."""
    result = calculate_sm2(ease_factor=2.5, interval=1, repetitions=1, quality=4)
    assert result.interval == 6
    assert result.repetitions == 2
    assert result.ease_factor == 2.5


def test_sm2_subsequent_reviews():
    """After second review, interval is multiplied by ease factor."""
    result = calculate_sm2(ease_factor=2.5, interval=6, repetitions=2, quality=4)
    assert result.interval == 15  # round(6 * 2.5)
    assert result.repetitions == 3


def test_sm2_failed_review():
    """Quality < 3 resets repetitions to 0 and interval to 1."""
    result = calculate_sm2(ease_factor=2.5, interval=15, repetitions=5, quality=1)
    assert result.interval == 1
    assert result.repetitions == 0
    assert result.ease_factor < 2.5  # decreased


def test_sm2_ease_factor_floor():
    """Ease factor should never drop below 1.3."""
    result = calculate_sm2(ease_factor=1.3, interval=1, repetitions=0, quality=0)
    assert result.ease_factor >= 1.3


def test_sm2_perfect_response():
    """Quality=5 increases ease factor."""
    result = calculate_sm2(ease_factor=2.5, interval=1, repetitions=1, quality=5)
    assert result.ease_factor > 2.5


def test_sm2_quality_3_boundary():
    """Quality=3 is considered passing (repetitions increment)."""
    result = calculate_sm2(ease_factor=2.5, interval=0, repetitions=0, quality=3)
    assert result.repetitions == 1
    assert result.interval == 1


def test_sm2_next_review_is_future():
    """next_review_at should always be in the future."""
    result = calculate_sm2(ease_factor=2.5, interval=0, repetitions=0, quality=5)
    assert result.next_review_at > datetime.now(UTC) - timedelta(seconds=1)


def test_sm2_returns_dataclass():
    """Function should return SM2Result dataclass."""
    result = calculate_sm2(ease_factor=2.5, interval=0, repetitions=0, quality=5)
    assert isinstance(result, SM2Result)
    assert hasattr(result, "ease_factor")
    assert hasattr(result, "interval")
    assert hasattr(result, "repetitions")
    assert hasattr(result, "next_review_at")
