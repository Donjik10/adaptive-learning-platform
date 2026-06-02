"""Tests for the auth service (password hashing, JWT)."""

from app.services.auth import (
    create_access_token,
    decode_access_token,
    get_password_hash,
    verify_password,
)


def test_password_hash_and_verify():
    """Hashed password should verify correctly."""
    password = "test_password_123"
    hashed = get_password_hash(password)
    assert hashed != password  # hash should differ
    assert verify_password(password, hashed) is True
    assert verify_password("wrong_password", hashed) is False


def test_password_hash_is_unique():
    """Same password should produce different hashes (salt)."""
    password = "same_password"
    hash1 = get_password_hash(password)
    hash2 = get_password_hash(password)
    assert hash1 != hash2


def test_create_and_decode_token():
    """JWT token should encode and decode correctly."""
    data = {"sub": "user-123", "role": "student"}
    token = create_access_token(data)
    assert token is not None

    payload = decode_access_token(token)
    assert payload is not None
    assert payload["sub"] == "user-123"
    assert payload["role"] == "student"
    assert "exp" in payload


def test_decode_invalid_token():
    """Invalid JWT should return None."""
    result = decode_access_token("invalid.token.here")
    assert result is None


def test_token_contains_required_claims():
    """Token must contain 'sub' and 'exp' claims."""
    data = {"sub": "demo_user"}
    token = create_access_token(data)
    payload = decode_access_token(token)
    assert payload is not None
    assert payload["sub"] == "demo_user"
    assert payload.get("exp") is not None
