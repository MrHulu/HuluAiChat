"""Tests for src/ui/settings_validation.py - 纯验证逻辑测试。"""
import pytest

from src.ui.settings_validation import (
    validate_name,
    validate_base_url,
    validate_model_id,
    validate_api_key,
    validate_provider,
    URL_PATTERN,
)


class TestValidateName:
    """测试名称验证逻辑。"""

    def test_valid_name_returns_true(self) -> None:
        """有效名称通过验证。"""
        assert validate_name("OpenAI") is True
        assert validate_name("A") is True
        assert validate_name("x" * 64) is True
        assert validate_name("  OpenAI  ") is True  # trim
        assert validate_name("中文名称") is True

    def test_empty_name_returns_false(self) -> None:
        """空名称验证失败。"""
        assert validate_name("") is False
        assert validate_name(None) is False
        assert validate_name("   ") is False  # 仅空格

    def test_too_long_name_returns_false(self) -> None:
        """超长名称验证失败。"""
        assert validate_name("x" * 65) is False


class TestValidateBaseUrl:
    """测试 Base URL 验证逻辑。"""

    def test_valid_http_url_returns_true(self) -> None:
        """合法 HTTP URL 通过验证。"""
        assert validate_base_url("http://localhost:11434") is True
        assert validate_base_url("http://127.0.0.1:8080") is True
        assert validate_base_url("https://api.openai.com") is True
        assert validate_base_url("https://api.example.com/v1") is True
        assert validate_base_url("  https://api.example.com  ") is True  # trim

    def test_invalid_url_returns_false(self) -> None:
        """非法 URL 验证失败。"""
        assert validate_base_url("") is False
        assert validate_base_url(None) is False
        assert validate_base_url("not-a-url") is False
        assert validate_base_url("ftp://example.com") is False
        assert validate_base_url("://invalid") is False
        assert validate_base_url("https://") is False
        assert validate_base_url("http://") is False

    def test_url_with_spaces_returns_false(self) -> None:
        """包含空格的 URL 验证失败。"""
        assert validate_base_url("https://api. example.com") is False
        assert validate_base_url("https://api.example.com /v1") is False


class TestValidateModelId:
    """测试 Model ID 验证逻辑。"""

    def test_custom_model_valid_returns_true(self) -> None:
        """合法的自定义 Model ID 通过验证。"""
        assert validate_model_id("gpt-4", is_custom=True) is True
        assert validate_model_id("x" * 128, is_custom=True) is True
        assert validate_model_id("  gpt-4  ", is_custom=True) is True

    def test_custom_model_empty_returns_false(self) -> None:
        """空的自定义 Model ID 验证失败。"""
        assert validate_model_id("", is_custom=True) is False
        assert validate_model_id(None, is_custom=True) is False
        assert validate_model_id("   ", is_custom=True) is False

    def test_custom_model_too_long_returns_false(self) -> None:
        """超长自定义 Model ID 验证失败。"""
        assert validate_model_id("x" * 129, is_custom=True) is False

    def test_preset_model_non_empty_returns_true(self) -> None:
        """非空的预设 Model ID 通过验证。"""
        assert validate_model_id("gpt-3.5-turbo", is_custom=False) is True
        assert validate_model_id("  gpt-4  ", is_custom=False) is True
        assert validate_model_id("x" * 200, is_custom=False) is True

    def test_preset_model_empty_returns_false(self) -> None:
        """空的预设 Model ID 验证失败。"""
        assert validate_model_id("", is_custom=False) is False
        assert validate_model_id(None, is_custom=False) is False
        assert validate_model_id("   ", is_custom=False) is False


class TestValidateApiKey:
    """测试 API Key 验证逻辑。"""

    def test_valid_api_key_returns_true(self) -> None:
        """合法 API Key 通过验证。"""
        assert validate_api_key("sk-" + "x" * 50) is True
        assert validate_api_key("x" * 8) is True
        assert validate_api_key("  " + "x" * 8 + "  ") is True  # trim
        assert validate_api_key("my-api-key-12345") is True

    def test_empty_api_key_returns_false(self) -> None:
        """空 API Key 验证失败。"""
        assert validate_api_key("") is False
        assert validate_api_key(None) is False
        assert validate_api_key("   ") is False

    def test_short_api_key_returns_false(self) -> None:
        """过短 API Key 验证失败。"""
        assert validate_api_key("short") is False
        assert validate_api_key("1234567") is False
        assert validate_api_key("  1234567  ") is False


class TestValidateProvider:
    """测试完整的 Provider 验证逻辑。"""

    def test_valid_provider_returns_true(self) -> None:
        """所有字段合法时验证通过。"""
        assert validate_provider(
            name="OpenAI",
            base_url="https://api.openai.com/v1",
            model_id="gpt-4",
            model_id_is_custom=True,
            api_key="sk-proj-" + "x" * 32,
        ) is True

    def test_invalid_name_returns_false(self) -> None:
        """名称非法时验证失败。"""
        assert validate_provider(
            name="",  # invalid
            base_url="https://api.openai.com/v1",
            model_id="gpt-4",
            model_id_is_custom=True,
            api_key="sk-" + "x" * 32,
        ) is False

    def test_invalid_base_url_returns_false(self) -> None:
        """Base URL 非法时验证失败。"""
        assert validate_provider(
            name="OpenAI",
            base_url="not-a-url",  # invalid
            model_id="gpt-4",
            model_id_is_custom=True,
            api_key="sk-" + "x" * 32,
        ) is False

    def test_invalid_model_id_returns_false(self) -> None:
        """Model ID 非法时验证失败。"""
        assert validate_provider(
            name="OpenAI",
            base_url="https://api.openai.com/v1",
            model_id="",  # invalid
            model_id_is_custom=True,
            api_key="sk-" + "x" * 32,
        ) is False

    def test_invalid_api_key_returns_false(self) -> None:
        """API Key 非法时验证失败。"""
        assert validate_provider(
            name="OpenAI",
            base_url="https://api.openai.com/v1",
            model_id="gpt-4",
            model_id_is_custom=True,
            api_key="short",  # invalid
        ) is False

    def test_all_invalid_returns_false(self) -> None:
        """所有字段非法时验证失败。"""
        assert validate_provider(
            name="",
            base_url="invalid",
            model_id="",
            model_id_is_custom=True,
            api_key="",
        ) is False


class TestUrlPattern:
    """测试 URL_PATTERN 正则表达式。"""

    def test_pattern_matches_valid_urls(self) -> None:
        """正则匹配合法 URL。"""
        assert URL_PATTERN.match("http://localhost") is not None
        assert URL_PATTERN.match("https://api.openai.com") is not None
        assert URL_PATTERN.match("http://127.0.0.1:8080") is not None
        assert URL_PATTERN.match("https://example.com/path") is not None
        assert URL_PATTERN.match("HTTP://EXAMPLE.COM") is not None  # case insensitive

    def test_pattern_rejects_invalid_urls(self) -> None:
        """正则拒绝非法 URL。"""
        assert URL_PATTERN.match("") is None
        assert URL_PATTERN.match("not-a-url") is None
        assert URL_PATTERN.match("ftp://example.com") is None
        assert URL_PATTERN.match("://invalid") is None
        assert URL_PATTERN.match("https://") is None
