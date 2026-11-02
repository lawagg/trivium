# -*- coding: utf-8 -*-
"""Сверяет расчёт веб-версии (web/scoring.js) с Python-ядром."""
import json
import random
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from trivium.scoring import evaluate  # noqa: E402

NODE = Path(r"C:\Users\admin\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe")
if not NODE.exists():
    NODE = Path("node")

random.seed(20261103)

BASE = ["image", "rhyme", "rhythm", "technique", "density",
        "conformity", "individuality", "nativity", "quality"]
ART = ["depth", "reach"]

CASES = [
    {"song_a": "Трек 1", "song_b": "Трек 2", "ov_a": None, "ov_b": None, "base": {}, "art": {}},
    {"song_a": "", "song_b": "", "ov_a": 7, "ov_b": 5,
     "base": {k: -1.0 for k in BASE}, "art": {k: -1.0 for k in ART}},
    {"song_a": "Иван", "song_b": "Дарья", "ov_a": 4, "ov_b": 9,
     "base": {"image": -0.12}, "art": {"depth": 1.0}},
    {"song_a": "A", "song_b": "B", "ov_a": 5, "ov_b": 5,
     "base": {"rhyme": 0.0}, "art": {"depth": 0.0}},
]

for _ in range(200):
    payload = {
        "song_a": random.choice(["Трек 1", "Песня А", ""]),
        "song_b": random.choice(["Трек 2", "Песня Б", "  "]),
        "ov_a": random.choice([None, 0, 3, 7, 10, 5]),
        "ov_b": random.choice([None, 0, 3, 7, 10, 5]),
        "base": {k: random.choice([0, 0.0, round(random.uniform(-1, 1), 3)]) for k in BASE},
        "art": {k: random.choice([0, round(random.uniform(-1, 1), 3)]) for k in ART},
    }
    CASES.append(payload)

expected = [evaluate(c) for c in CASES]

with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as fh:
    json.dump(CASES, fh, ensure_ascii=False)
    tmp = Path(fh.name)

proc = subprocess.run(
    [str(NODE), str(ROOT / "tools" / "parity_node.js"), str(tmp)],
    capture_output=True, text=True, encoding="utf-8",
)
tmp.unlink(missing_ok=True)

if proc.returncode != 0:
    print("node упал:", proc.stderr[:2000])
    sys.exit(1)

actual = json.loads(proc.stdout)

FIELDS = [
    "winner", "kind", "gap", "verdict_label", "ratio", "ratio_text",
    "winner_name", "loser_name", "winner_ov", "loser_ov", "ov_a", "ov_b",
    "total_a", "total_b", "base_a", "base_b", "winner_total", "loser_total",
    "art_flip", "sentence",
]

fails = 0
for i, (exp, act) in enumerate(zip(expected, actual)):
    for field in FIELDS:
        if exp[field] != act[field]:
            print(f"[{i}] {field}: python={exp[field]!r} js={act[field]!r}")
            fails += 1
    for side in ("a", "b"):
        if exp["radar"][side] != act["radar"][side]:
            print(f"[{i}] radar.{side}: {exp['radar'][side]} vs {act['radar'][side]}")
            fails += 1
        for key in BASE:
            if exp["criteria"][key]["a"] != act["criteria"][key]["a"]:
                print(f"[{i}] criteria.{key}.a расходится")
                fails += 1
    if len(exp["strengths_a"]) != len(act["strengths_a"]):
        print(f"[{i}] strengths_a: {len(exp['strengths_a'])} vs {len(act['strengths_a'])}")
        fails += 1

print(f"проверено случаев: {len(CASES)}, расхождений: {fails}")
sys.exit(0 if fails == 0 else 1)
