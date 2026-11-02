# -*- coding: utf-8 -*-
"""Собирает web/data.js из Python-источников (критерии, тексты, шкалы).

Запуск: python tools/build_web_data.py
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from trivium.scoring import spec  # noqa: E402
from trivium.texts import ALGORITHM  # noqa: E402

data = spec()

payload = {
    "blocks": data["blocks"],
    "scales": data["scales"],
    "algorithm": ALGORITHM,
}

out = ROOT / "web" / "data.js"
out.parent.mkdir(exist_ok=True)
text = (
    "// Сгенерировано tools/build_web_data.py — правьте trivium/texts.py и scoring.py.\n"
    "const SPEC = " + json.dumps(payload, ensure_ascii=False, indent=2) + ";\n"
)
out.write_text(text, encoding="utf-8")
print("записано:", out, len(text), "символов")
