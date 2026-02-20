"""设置页校验：Provider 名称、Base URL、Model ID、API Key 严格规则。"""
import re

# Base URL 合法 http(s)
URL_PATTERN = re.compile(r"^https?://[^\s/]+(?:\/[^\s]*)?$", re.IGNORECASE)


def validate_name(name: str) -> bool:
    """名称非空且长度 1–64，不允许仅空格。"""
    s = (name or "").strip()
    return 1 <= len(s) <= 64


def validate_base_url(url: str) -> bool:
    """Base URL 为合法 http(s) URL。"""
    return bool(url and URL_PATTERN.match(url.strip()))


def validate_model_id(model_id: str, is_custom: bool) -> bool:
    """Model ID 非空；Custom 时 1–128 字符。"""
    s = (model_id or "").strip()
    if is_custom:
        return 1 <= len(s) <= 128
    return len(s) > 0


def validate_api_key(key: str) -> bool:
    """API Key 非空且长度 ≥8，不允许仅空格。"""
    s = (key or "").strip()
    return len(s) >= 8


def validate_provider(
    name: str,
    base_url: str,
    model_id: str,
    model_id_is_custom: bool,
    api_key: str,
) -> bool:
    """四项均通过才返回 True。"""
    return (
        validate_name(name)
        and validate_base_url(base_url)
        and validate_model_id(model_id, model_id_is_custom)
        and validate_api_key(api_key)
    )
