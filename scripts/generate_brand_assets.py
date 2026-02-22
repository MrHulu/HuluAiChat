from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw


@dataclass(frozen=True)
class Palette:
    green: tuple[int, int, int] = (34, 197, 94)   # #22C55E
    teal: tuple[int, int, int] = (16, 185, 129)   # #10B981
    cyan: tuple[int, int, int] = (6, 182, 212)    # #06B6D4
    slate: tuple[int, int, int] = (15, 23, 42)    # #0F172A
    white: tuple[int, int, int] = (248, 250, 252) # #F8FAFC


def _lerp(a: int, b: int, t: float) -> int:
    return int(round(a + (b - a) * t))


def _lerp_rgb(c0: tuple[int, int, int], c1: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    return (_lerp(c0[0], c1[0], t), _lerp(c0[1], c1[1], t), _lerp(c0[2], c1[2], t))


def _linear_gradient(size: tuple[int, int], c0: tuple[int, int, int], c1: tuple[int, int, int], *, horizontal: bool) -> Image.Image:
    w, h = size
    if horizontal:
        base = Image.new("RGB", (w, 1))
        px = base.load()
        for x in range(w):
            t = x / max(1, w - 1)
            px[x, 0] = _lerp_rgb(c0, c1, t)
        return base.resize((w, h), resample=Image.Resampling.BICUBIC)
    base = Image.new("RGB", (1, h))
    px = base.load()
    for y in range(h):
        t = y / max(1, h - 1)
        px[0, y] = _lerp_rgb(c0, c1, t)
    return base.resize((w, h), resample=Image.Resampling.BICUBIC)


def _rounded_rect_mask(size: tuple[int, int], radius: int) -> Image.Image:
    w, h = size
    m = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(m)
    d.rounded_rectangle((0, 0, w, h), radius=radius, fill=255)
    return m


def render_icon(size: int = 1024) -> Image.Image:
    p = Palette()
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))

    g1 = _linear_gradient((size, size), p.green, p.cyan, horizontal=False)
    g2 = _linear_gradient((size, size), p.teal, p.cyan, horizontal=True)
    bg = Image.blend(g1, g2, 0.45).convert("RGBA")

    radius = int(size * 0.19)
    mask = _rounded_rect_mask((size, size), radius)
    canvas.paste(bg, (0, 0), mask)

    # subtle highlight
    shine = _linear_gradient((size, size), (255, 255, 255), (255, 255, 255), horizontal=False).convert("RGBA")
    shine.putalpha(int(255 * 0.10))
    shine_mask = _rounded_rect_mask((size, size), radius)
    canvas.alpha_composite(shine, dest=(int(size * -0.05), int(size * -0.08)), source=(0, 0, size, size))
    canvas.putalpha(mask)

    d = ImageDraw.Draw(canvas)

    # geometry helpers
    def s(v: float) -> int:
        return int(round(v * size))

    # chat bubble "steam"
    bubble = (s(0.33), s(0.18), s(0.72), s(0.46))
    d.rounded_rectangle(bubble, radius=s(0.07), fill=(*p.white, 242), outline=(*p.slate, 30), width=s(0.012))
    tail = [(s(0.46), s(0.46)), (s(0.40), s(0.52)), (s(0.40), s(0.44))]
    d.polygon(tail, fill=(*p.white, 242))

    # tea cup body
    cup = (s(0.26), s(0.45), s(0.74), s(0.76))
    d.rounded_rectangle(cup, radius=s(0.09), fill=(*p.white, 255), outline=(*p.slate, 36), width=s(0.014))

    # handle (two arcs)
    hx0, hy0, hx1, hy1 = s(0.70), s(0.50), s(0.89), s(0.72)
    d.arc((hx0, hy0, hx1, hy1), start=275, end=85, fill=(*p.white, 255), width=s(0.05))
    d.arc((hx0, hy0, hx1, hy1), start=275, end=85, fill=(*p.slate, 30), width=s(0.022))

    # saucer
    d.arc((s(0.22), s(0.73), s(0.78), s(0.92)), start=12, end=168, fill=(*p.white, 255), width=s(0.05))
    d.arc((s(0.22), s(0.73), s(0.78), s(0.92)), start=12, end=168, fill=(*p.slate, 22), width=s(0.022))

    # small sparkle
    cx, cy = s(0.78), s(0.26)
    r1, r2 = s(0.018), s(0.042)
    sparkle = [
        (cx, cy - r2),
        (cx + r1, cy - r1),
        (cx + r2, cy),
        (cx + r1, cy + r1),
        (cx, cy + r2),
        (cx - r1, cy + r1),
        (cx - r2, cy),
        (cx - r1, cy - r1),
    ]
    d.polygon(sparkle, fill=(*p.white, 230))

    return canvas


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    out_dir = root / "assets" / "branding"
    out_dir.mkdir(parents=True, exist_ok=True)

    base = render_icon(1024)

    (out_dir / "icon-1024.png").write_bytes(_png_bytes(base))
    base_512 = base.resize((512, 512), resample=Image.Resampling.LANCZOS)
    (out_dir / "icon.png").write_bytes(_png_bytes(base_512))
    base_256 = base.resize((256, 256), resample=Image.Resampling.LANCZOS)
    (out_dir / "icon-256.png").write_bytes(_png_bytes(base_256))

    ico_path = out_dir / "icon.ico"
    base_256.save(
        ico_path,
        format="ICO",
        sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
    )

    print(f"Generated: {out_dir.relative_to(root) / 'icon.png'}")
    print(f"Generated: {out_dir.relative_to(root) / 'icon.ico'}")


def _png_bytes(img: Image.Image) -> bytes:
    from io import BytesIO

    buf = BytesIO()
    img.save(buf, format="PNG", optimize=True)
    return buf.getvalue()


if __name__ == "__main__":
    os.environ.setdefault("PYTHONUTF8", "1")
    main()

