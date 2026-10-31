# -*- coding: utf-8 -*-
"""Проверки ядра судейства. Запуск: python tests/test_scoring.py

Qt не требуется.
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from trivium import scoring  # noqa: E402

FAILS = []


def check(name, actual, expected, eps=1e-6):
    ok = abs(actual - expected) <= eps if isinstance(expected, (int, float)) else actual == expected
    if ok:
        print(f"  ok   {name}: {actual}")
    else:
        FAILS.append(f"{name}: получили {actual!r}, ожидали {expected!r}")
        print(f"  FAIL {name}: получили {actual!r}, ожидали {expected!r}")


def payload(**kwargs):
    data = {
        "song_a": "Трек A",
        "song_b": "Трек B",
        "ov_a": None,
        "ov_b": None,
        "base": {},
        "art": {},
    }
    data.update(kwargs)
    return data


print("\n[1] Округление вниз до шага шкалы")
check("2.55 -> 2.5", scoring.floor_to(2.55, 0.1), 2.5, 1e-9)
check("2.54 -> 2.5", scoring.floor_to(2.54, 0.1), 2.5, 1e-9)
check("6.0 -> 6.0", scoring.floor_to(6.0, 0.1), 6.0, 1e-9)
check("1.0 -> 1.0", scoring.floor_to(1.0, 0.1), 1.0, 1e-9)

print("\n[2] Базовый критерий: центр, влево, вправо")
check("центр: обе по 1", scoring.criterion_pair(0.0), (1.0, 1.0))
a, b = scoring.criterion_pair(-1.0)
check("крайние левые: A", a, 6.0)
check("крайние левые: B", b, 1.0)
a, b = scoring.criterion_pair(0.02)
check("чуть вправо: A", a, 1.0)
check("чуть вправо: B", b, 1.1)
a, b = scoring.criterion_pair(0.5)
check("середина вправо: B = 3.5", b, 3.5)
check("середина вправо: A = 1", a, 1.0)

print("\n[3] Все фейдеры в центре")
res = scoring.evaluate(payload())
check("база A", res["total_a"], 9.0)
check("база B", res["total_b"], 9.0)
check("ничья", res["winner"], "draw")
check("коэффициент", res["ratio"], 1.0)

print("\n[4] Худший из возможных случаев: A выиграла все 9 критериев по максимуму")
base_full = {key: -1.0 for key in scoring.BASE_KEYS}
res = scoring.evaluate(payload(base=base_full))
check("итог A", res["total_a"], 54.0)
check("итог B", res["total_b"], 9.0)
check("победитель", res["winner"], "A")

print("\n[5] Блок «Арт»: принятый режим (delta), лидер A")
res = scoring.evaluate(payload(base=base_full, art={"depth": -0.5}))
check("доля базы у A = 0.25 (коэф. 1,25)", res["art"]["a"]["depth"], 0.25)
check("доля базы у B = 0", res["art"]["b"]["depth"], 0.0)
check("итог A = 54 * 1.25", res["total_a"], 54.0 * 1.25)
check("режим", res["mode"], "delta")

print("\n[5б] Буквальная формула 6.6 (multiplier)")
scoring.ART_BONUS_MODE = "multiplier"
res = scoring.evaluate(payload(base=base_full, art={"depth": -0.5}))
check("итог A = 54 * (1 + 1.25)", res["total_a"], 54.0 * 2.25)

print("\n[6] Мягкий режим: минимальный сдвиг даёт минимальную прибавку")
res = scoring.evaluate(payload(base=base_full, art={"depth": -0.1}))
check("коэф. 1.05 (доля базы 1.05)", res["art"]["a"]["depth"], 1.05)
scoring.ART_BONUS_MODE = "delta"
res = scoring.evaluate(payload(base=base_full, art={"depth": -0.1}))
check("прибавка = 0.05 базы", res["total_a"], 54.0 * 1.05)

print("\n[7] Ничья по баллам решается по ОВ")
res = scoring.evaluate(payload(ov_a=4, ov_b=9))
check("победитель", res["winner"], "B")
check("тип развязки", res["tiebreak"], "ov")

print("\n[8] Равные баллы и равное ОВ — ничья")
res = scoring.evaluate(payload(ov_a=7, ov_b=7))
check("победитель", res["winner"], "draw")

print("\n[9] Формула соотношения сил")
res = scoring.evaluate(payload(base={"image": -0.5}))  # A: 3.5 + 8, B: 1 + 8
check("ratio ~ 11.5 / 9", res["ratio"], round(11.5 / 9.0, 2))
print("     строка:", res["sentence"])

print("\n[10] Формат чисел")
check("2.0 -> 2", scoring._format_num(2.0), "2")
check("1.234 -> 1,23", scoring._format_num(1.234), "1,23")
check("1.5 -> 1,5", scoring._format_num(1.5), "1,5")

print("\n[11] Метки разрыва")
res = scoring.evaluate(payload(base={"image": -0.05}))   # 9.25 / 9
check("На грани", res["gap"], "На грани")
res = scoring.evaluate(payload(base={"image": -0.2}))    # 10 / 9
check("Уверенная победа", res["gap"], "Уверенная победа")
res = scoring.evaluate(payload(base={"image": -0.5}))    # 11.5 / 9
check("Разгром", res["gap"], "Разгром")
res = scoring.evaluate(payload())
check("Ничья", res["gap"], "Ничья")
check("вид исхода", res["kind"], "draw")

print("\n[12] Переворот блоком «Арт»")
res = scoring.evaluate(payload(base={"image": -0.12}, art={"depth": 1.0}))
check("по базе сильнее A", res["base_a"] > res["base_b"], True)
check("по итогу победил B", res["winner"], "B")
check("переворот зафиксирован", res["art_flip"], True)
check("вид исхода", res["kind"], "art_flip")

print("\n[13] Радар: базовое значение × коэффициент «Арта»")
check("B: Образ 1 × 1.5", res["radar"]["b"][0], 1.5)
check("A: Образ 1.6 × 1.0", res["radar"]["a"][0], 1.6)
check("осей девять", len(res["radar"]["labels"]), 9)
check("подписи по порядку", res["radar"]["labels"][0], "Образ")

print("\n[14] Сильные и слабые стороны")
res = scoring.evaluate(payload(base={"image": -0.5, "rhyme": 0.3}))
check("A забрала Образ", res["strengths_a"][0]["label"], "Образ")
check("A отдала Рифму", res["weaknesses_a"][0]["label"], "Рифма")
check("B забрала Рифму", res["strengths_b"][0]["label"], "Рифма")
check("B отдала Образ", res["weaknesses_b"][0]["label"], "Образ")

print()
if FAILS:
    print(f"ПРОВАЛЕНО {len(FAILS)} проверок:")
    for line in FAILS:
        print("  -", line)
    sys.exit(1)
print("Все проверки пройдены.")
