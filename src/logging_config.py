"""应用日志配置：控制台与可选文件输出。"""
import logging
import sys

from src.app_data import get_app_data_dir


def setup_logging() -> None:
    """配置根 logger：控制台 INFO，应用数据目录下 HuluChat.log 文件。"""
    root = logging.getLogger()
    root.setLevel(logging.INFO)
    if root.handlers:
        return  # 避免重复添加 handler

    fmt = logging.Formatter(
        "%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    console = logging.StreamHandler(sys.stderr)
    console.setLevel(logging.INFO)
    console.setFormatter(fmt)
    root.addHandler(console)

    try:
        log_dir = get_app_data_dir()
        log_path = log_dir + "/HuluChat.log"
        file_handler = logging.FileHandler(log_path, encoding="utf-8")
        file_handler.setLevel(logging.DEBUG)
        file_handler.setFormatter(fmt)
        root.addHandler(file_handler)
    except OSError:
        pass  # 无法写文件时仅使用控制台
