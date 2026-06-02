"""
SM-2 (SuperMemo 2) scheduling algorithm.

Reference:  https://www.supermemo.com/en/archives1990-2015/english/ol/sm2

The algorithm takes a quality-of-response grade (0-5) and
updates (ease_factor, interval, repetitions) for a flashcard.
"""

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta


@dataclass
class SM2Result:
    """Container for the output of the SM-2 algorithm."""
    ease_factor: float
    interval: int
    repetitions: int
    next_review_at: datetime


def calculate_sm2(
    ease_factor: float,
    interval: int,
    repetitions: int,
    quality: int,
) -> SM2Result:
    """
    Compute new SM-2 parameters after a single review.

    Args:
        ease_factor: Current easiness factor (>= 1.3).
        interval:     Current interval in days.
        repetitions:  Consecutive correct answers so far.
        quality:      User grade (0 = complete blackout … 5 = perfect response).

    Returns:
        SM2Result with updated scheduling data.
    """
    if quality < 3:
        repetitions = 0
        interval = 1
    else:
        if repetitions == 0:
            interval = 1
        elif repetitions == 1:
            interval = 6
        else:
            interval = round(interval * ease_factor)

        repetitions += 1

    ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    if ease_factor < 1.3:
        ease_factor = 1.3

    next_review_at = datetime.now(UTC) + timedelta(days=interval)

    return SM2Result(
        ease_factor=round(ease_factor, 2),
        interval=interval,
        repetitions=repetitions,
        next_review_at=next_review_at,
    )
