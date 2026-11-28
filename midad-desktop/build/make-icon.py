#!/usr/bin/env python3
"""يولّد أيقونة مِداد ستوديو (PNG للحزم + ICO لويندوز) من نفس هوية التطبيق.
التشغيل: python3 make-icon.py  (يتطلب Pillow وخط Noto Sans Arabic Bold)
"""
from PIL import Image, ImageDraw, ImageFont
import os

HERE = os.path.dirname(os.path.abspath(__file__))
S = 2048                 # نرسم بالحجم الكبير ثم نصغّر لجودة حواف عالية
R = S // 8 * 2           # نصف قطر الحواف (25%)
FONT_PATH = "/usr/share/fonts/truetype/noto/NotoSansArabic-Bold.ttf"
if not os.path.exists(FONT_PATH):
    import subprocess
    try:
        FONT_PATH = subprocess.check_output(
            ["fc-match", "-f", "%{file}", "Noto Sans Arabic:weight=bold"],
            text=True).strip()
    except Exception:
        FONT_PATH = None

NAVY_DEEP = (18, 41, 60)
NAVY = (30, 61, 89)
NAVY_SOFT = (44, 88, 119)
CORAL = (255, 110, 64)
WHITE = (255, 255, 255)


def gradient(size, stops):
    w, h = size
    img = Image.new("RGB", (w, h))
    d = ImageDraw.Draw(img)
    for y in range(h):
        t = y / (h - 1)
        for i in range(len(stops) - 1):
            p0, c0 = stops[i]
            p1, c1 = stops[i + 1]
            if p0 <= t <= p1:
                k = (t - p0) / (p1 - p0) if p1 > p0 else 0
                col = tuple(round(c0[j] + (c1[j] - c0[j]) * k) for j in range(3))
                d.line([(0, y), (w, y)], fill=col)
                break
    return img


def main():
    base = gradient((S, S), [(0.0, NAVY_DEEP), (0.55, NAVY), (1.0, NAVY_SOFT)]).convert("RGBA")

    mask = Image.new("L", (S, S), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, S - 1, S - 1], radius=R, fill=255)
    icon = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    icon.paste(base, (0, 0), mask)

    d = ImageDraw.Draw(icon)

    # إطار داخلي رقيق (كما في شعار الواجهة)
    d.rounded_rectangle([6, 6, S - 7, S - 7], radius=R - 6,
                        outline=(255, 255, 255, 40), width=8)

    # حرف «م» أبيض
    if FONT_PATH and os.path.exists(FONT_PATH):
        font = ImageFont.truetype(FONT_PATH, int(S * 0.60))
        d.text((S * 0.47, S * 0.455), "م", font=font, fill=WHITE, anchor="mm")

    # نقطة مرجانية (هوية مِداد) أسفل اليمين — داخل الحواف
    cx, cy, rad, ring = S * 0.795, S * 0.795, S * 0.070, S * 0.016
    d.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], fill=CORAL)
    d.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], outline=WHITE, width=int(ring))

    big = icon
    png512 = big.resize((512, 512), Image.LANCZOS)
    png512.save(os.path.join(HERE, "icon.png"))
    png512.save(os.path.join(HERE, "icon.ico"),
                sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
    print("wrote build/icon.png (512x512) and build/icon.ico")


if __name__ == "__main__":
    main()