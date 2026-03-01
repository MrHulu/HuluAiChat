"""测试共享 fixtures 与工具。"""
import os
import tempfile
from pathlib import Path

import pytest


@pytest.fixture
def temp_dir(tmp_path: Path) -> Path:
    """临时目录 fixture，每个测试独立。"""
    return tmp_path


@pytest.fixture
def temp_db_path(temp_dir: Path) -> str:
    """临时数据库路径。"""
    return str(temp_dir / "test.db")


@pytest.fixture
def temp_config_path(temp_dir: Path) -> str:
    """临时配置文件路径。"""
    return str(temp_dir / "test_config.json")


@pytest.fixture
def mock_app_data_dir(temp_dir: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    """Mock 应用数据目录，指向临时目录。"""
    # 需要在导入前设置，通过环境变量或直接 patch
    monkeypatch.setenv("HULUCHAT_APP_DATA_DIR", str(temp_dir))
    return temp_dir
