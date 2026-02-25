"""
从 assets/icon.png 生成 assets/icon.ico，保证 exe 内嵌图标与窗口使用的 PNG 一致。
依赖: Pillow
"""
from __future__ import annotations

import os
from pathlib import Path

from PIL import Image

ICO_SIZES = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    png_path = root / "assets" / "icon.png"
    ico_path = root / "assets" / "icon.ico"

    if not png_path.exists():
        raise FileNotFoundError(f"图标源文件不存在: {png_path}")

    img = Image.open(png_path)
    if img.mode != "RGBA":
        img = img.convert("RGBA")
    img.save(ico_path, format="ICO", sizes=ICO_SIZES)
    print(f"已从 {png_path.name} 生成 {ico_path.name}")


if __name__ == "__main__":
    os.environ.setdefault("PYTHONUTF8", "1")
    main()
