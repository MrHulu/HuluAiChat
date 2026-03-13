"""Security utilities for handling sensitive information."""
import re
from typing import Optional


def mask_api_key(api_key: Optional[str], visible_chars: int = 8) -> Optional[str]:
    """Mask an API key, showing only the first few characters.

    Args:
        api_key: The API key to mask
        visible_chars: Number of characters to show at the start (default: 8)

    Returns:
        Masked API key like "sk-abc123..." or None if input is None

    Examples:
        >>> mask_api_key("sk-1234567890abcdef")
        'sk-12345...'
        >>> mask_api_key("short")
        'shor...'
    """
    if not api_key:
        return None
    if len(api_key) <= visible_chars:
        return api_key[:2] + "..." if len(api_key) > 2 else "***"
    return api_key[:visible_chars] + "..."


def sanitize_error_message(error: Exception) -> str:
    """Sanitize error message to remove potential sensitive information.

    This function removes or masks:
    - API keys (sk-*, api_key=*, token=*)
    - URLs with credentials
    - Bearer tokens

    Args:
        error: The exception to sanitize

    Returns:
        A safe error message string
    """
    message = str(error)

    # Mask API keys (sk-xxxxx format)
    message = re.sub(
        r'sk-[a-zA-Z0-9]{10,}',
        'sk-***REDACTED***',
        message
    )

    # Mask api_key=xxx or token=xxx patterns
    message = re.sub(
        r'(api_key|apiKey|token|password|secret)["\']?\s*[:=]\s*["\']?[a-zA-Z0-9_-]{8,}',
        r'\1=***REDACTED***',
        message,
        flags=re.IGNORECASE
    )

    # Mask Bearer tokens
    message = re.sub(
        r'Bearer\s+[a-zA-Z0-9_-]{10,}',
        'Bearer ***REDACTED***',
        message,
        flags=re.IGNORECASE
    )

    # Mask URLs with credentials (user:pass@host)
    message = re.sub(
        r'([a-zA-Z]+://)([^:@\s]+):([^@\s]+)@',
        r'\1***:***@',
        message
    )

    return message


def get_safe_error_type(error: Exception) -> str:
    """Get a safe error type name without exposing internal details.

    Args:
        error: The exception to get the type for

    Returns:
        A user-friendly error type string
    """
    error_type = type(error).__name__

    # Map internal error types to user-friendly names
    error_mapping = {
        'APIConnectionError': 'ConnectionError',
        'APITimeoutError': 'TimeoutError',
        'APIStatusError': 'ServiceError',
        'AuthenticationError': 'AuthError',
        'RateLimitError': 'RateLimitError',
        'ValueError': 'ConfigurationError',
    }

    return error_mapping.get(error_type, error_type)
