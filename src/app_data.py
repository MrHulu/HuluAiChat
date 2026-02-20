"""应用数据根目录：跨平台路径与目录保障。"""
import os
import sys


def get_app_data_dir() -> str:
    """返回应用数据根目录，跨平台（Windows / Linux / macOS）。"""
    if sys.platform == "win32":
        base = os.environ.get("APPDATA", os.path.expanduser("~"))
    elif sys.platform == "darwin":
        base = os.path.expanduser("~/Library/Application Support")
    else:
        base = os.environ.get("XDG_CONFIG_HOME", os.path.expanduser("~/.config"))
    return os.path.join(base, "HuluChat")


def ensure_app_data_dir() -> str:
    """确保应用数据目录存在，不存在则创建；返回该目录路径。"""
    path = get_app_data_dir()
    os.makedirs(path, exist_ok=True)
    return path
