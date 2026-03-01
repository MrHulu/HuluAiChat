"""Tests for src/app_data.py - 跨平台应用数据目录测试。"""
import os
from pathlib import Path

import pytest

from src.app_data import get_app_data_dir, ensure_app_data_dir


@pytest.mark.parametrize(
    ("platform", "env_var", "env_value", "must_contain"),
    [
        # Windows with APPDATA
        ("win32", "APPDATA", "C:\\Users\\Test\\AppData\\Roaming", ["AppData", "Roaming", "HuluChat"]),
        # Windows without APPDATA (fallback to ~)
        ("win32", None, None, None),  # Will use home directory
        # macOS
        ("darwin", None, None, ["Library", "Application Support", "HuluChat"]),
        # Linux with XDG_CONFIG_HOME
        ("linux", "XDG_CONFIG_HOME", "/home/test/.config", [".config", "HuluChat"]),
        # Linux without XDG_CONFIG_HOME (fallback to ~/.config)
        ("linux", None, None, None),
    ],
)
def test_get_app_data_dir_cross_platform(
    platform: str,
    env_var: str | None,
    env_value: str | None,
    must_contain: list[str] | None,
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    """测试跨平台应用数据目录路径生成。"""
    # Mock platform
    monkeypatch.setattr("sys.platform", platform)

    # Mock home directory
    fake_home = tmp_path / "home"
    fake_home.mkdir()
    monkeypatch.setenv("HOME", str(fake_home))
    monkeypatch.setenv("USERPROFILE", str(fake_home))  # Windows

    # Set environment variable if provided
    if env_var and env_value:
        monkeypatch.setenv(env_var, env_value)

    result = get_app_data_dir()

    # Verify result ends with HuluChat
    assert result.endswith(os.sep + "HuluChat") or result.endswith("/HuluChat") or result.endswith("\\HuluChat")

    # Verify must_contain elements
    if must_contain:
        for element in must_contain:
            assert element in result


def test_ensure_app_data_dir_creates_directory(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    """测试 ensure_app_data_dir 创建目录。"""
    fake_home = tmp_path / "home"
    fake_home.mkdir()
    monkeypatch.setenv("HOME", str(fake_home))

    # Mock platform to Linux for predictable path
    monkeypatch.setattr("sys.platform", "linux")

    result = ensure_app_data_dir()

    # Verify directory was created
    assert os.path.isdir(result)
    assert result.endswith("HuluChat")


def test_ensure_app_data_dir_idempotent(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    """测试 ensure_app_data_dir 重复调用幂等性。"""
    fake_home = tmp_path / "home"
    fake_home.mkdir()
    monkeypatch.setenv("HOME", str(fake_home))
    monkeypatch.setattr("sys.platform", "linux")

    result1 = ensure_app_data_dir()
    result2 = ensure_app_data_dir()

    assert result1 == result2
    assert os.path.isdir(result1)
