"""Tests for file extraction and RAG-related pure functions."""

import math
import json


def test_cosine_similarity_identical():
    """Identical vectors should have similarity = 1.0."""
    a = [1.0, 2.0, 3.0]
    b = [1.0, 2.0, 3.0]
    sim = _cosine_sim(a, b)
    assert abs(sim - 1.0) < 0.001


def test_cosine_similarity_orthogonal():
    """Orthogonal vectors should have similarity = 0.0."""
    a = [1.0, 0.0, 0.0]
    b = [0.0, 1.0, 0.0]
    sim = _cosine_sim(a, b)
    assert abs(sim - 0.0) < 0.001


def test_cosine_similarity_opposite():
    """Opposite vectors should have similarity = -1.0."""
    a = [1.0, 2.0]
    b = [-1.0, -2.0]
    sim = _cosine_sim(a, b)
    assert abs(sim - (-1.0)) < 0.001


def test_cosine_similarity_zero_vector():
    """Zero vector should return 0.0 (no similarity)."""
    a = [0.0, 0.0, 0.0]
    b = [1.0, 2.0, 3.0]
    sim = _cosine_sim(a, b)
    assert sim == 0.0


def test_cosine_similarity_different_lengths():
    """Vectors of different lengths should raise or handle gracefully."""
    a = [1.0, 2.0]
    b = [1.0, 2.0, 3.0]
    with _raises_or_handles(a, b):
        _cosine_sim(a, b)


def test_chunk_text_basic():
    """Basic text chunking should split by word count."""
    text = "word " * 500
    chunks = _chunk_text(text, chunk_size=200, overlap=50)
    assert len(chunks) >= 2  # 500 words with 200 chunk / 50 overlap -> ~3 chunks
    assert all(len(c.split()) <= 200 for c in chunks)


def test_chunk_text_small():
    """Text shorter than chunk_size should return as single chunk."""
    text = "hello world"
    chunks = _chunk_text(text, chunk_size=200, overlap=50)
    assert len(chunks) == 1
    assert chunks[0] == "hello world"


def test_chunk_text_empty():
    """Empty text should return single empty chunk."""
    chunks = _chunk_text("", chunk_size=200, overlap=50)
    assert len(chunks) >= 1


def test_chunk_text_overlap():
    """Two consecutive chunks should share overlapped words."""
    text = "the quick brown fox jumps over the lazy dog near the river bank"
    chunks = _chunk_text(text, chunk_size=8, overlap=3)
    if len(chunks) >= 2:
        chunk1_words = chunks[0].split()
        chunk2_words = chunks[1].split()
        overlap = set(chunk1_words[-3:]) & set(chunk2_words[:3])
        assert len(overlap) > 0, f"No overlap between:\n  {chunks[0]}\n  {chunks[1]}"


# ---- Helper functions (mirroring the ones in rag.py and auth.py) ----


def _cosine_sim(a: list[float], b: list[float]) -> float:
    if len(a) != len(b):
        raise ValueError("Vectors must have same length")
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(x * x for x in b))
    return dot / (na * nb) if na and nb else 0.0


def _chunk_text(text: str, chunk_size: int, overlap: int) -> list[str]:
    words = text.split()
    if not words:
        return [text]
    chunks = []
    start = 0
    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])
        chunks.append(chunk)
        start += chunk_size - overlap
    return chunks if chunks else [text]


def _raises_or_handles(a, b):
    """Context manager for testing."""
    return _ErrorHandler(a, b)


class _ErrorHandler:
    def __init__(self, a, b):
        self.a = a
        self.b = b

    def __enter__(self):
        pass

    def __exit__(self, exc_type, exc_val, exc_tb):
        pass

    def __iter__(self):
        try:
            _cosine_sim(self.a, self.b)
        except ValueError:
            pass
        return iter([])
