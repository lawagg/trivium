# -*- coding: utf-8 -*-
"""Генерирует иконки приложения: assets/trivium.ico и PNG для macOS."""
from pathlib import Path

from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / "assets"
OUT.mkdir(exist_ok=True)

S = 1024


def draw_icon(size: int) -> Image.Image:
    k = size / 1024.0

    def sc(p):
        return (p[0] * k, p[1] * k)

    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    pad = 16 * k
    d.rounded_rectangle(
        [pad, pad, size - pad, size - pad],
        radius=208 * k,
        fill=(11, 11, 18, 255),
        outline=(44, 44, 60, 255),
        width=max(1, int(8 * k)),
    )

    apex = sc((512, 176))
    left = sc((176, 784))
    right = sc((848, 784))
    back = sc((512, 552))

    edges = [
        (apex, left),
        (apex, right),
        (apex, back),
        (left, right),
        (right, back),
        (back, left),
    ]
    for a, b in edges:
        d.line([a, b], fill=(232, 232, 238, 210), width=max(1, int(12 * k)))

    r = 20 * k
    for cx, cy in (left, right, back):
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(232, 232, 238, 255))

    r = 32 * k
    d.ellipse(
        [apex[0] - r, apex[1] - r, apex[0] + r, apex[1] + r],
        fill=(208, 174, 99, 255),
    )
    return img


big = draw_icon(S)
big.save(OUT / "trivium_1024.png")
draw_icon(512).save(OUT / "trivium_512.png")
draw_icon(256).save(OUT / "trivium_256.png")
draw_icon(256).save(
    OUT / "trivium.ico",
    sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
)
print("ok", OUT / "trivium.ico")
