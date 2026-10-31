# -*- coding: utf-8 -*-
"""Ядро системы судейства «Тривиум».

Модуль не зависит от Qt: вся математика проверяется юнит-тестами
(tests/test_scoring.py).

Термины
-------
* ``pos`` — положение фейдера в диапазоне [-1; 1].
  ``pos < 0`` — сильнее левая песня (A), ``pos > 0`` — правая (B),
  ``pos == 0`` — фейдер в центре, преимущества нет ни у кого.
* Базовый критерий — 9 фейдеров блоков «Разум», «Тело», «Душа».
* Коэффициентный блок «Арт» — 2 фейдера, дают бонус тому, кто впереди.
"""

from __future__ import annotations

import math

# --- Шкалы ---------------------------------------------------------------

BASE_MIN = 1.0
BASE_MAX = 6.0
BASE_STEP = 0.1

ART_MIN = 1.0
ART_MAX = 1.5
ART_STEP = 0.01

OV_MIN = 0
OV_MAX = 10

# Блок «Арт»: значение фейдера — коэффициент.
#   a = A − 1 ∈ [0; 0,5], w = W − 1 ∈ [0; 0,5],  Итог = База × (1 + a + w)
#   "multiplier" — прежняя буквальная формула ТЗ п. 6.6, оставлена на случай возврата.
ART_BONUS_MODE = "delta"

EPS = 1e-9

# --- Описание интерфейса -------------------------------------------------
# Из этого списка QML строит блоки и фейдеры: форму меняем здесь,
# интерфейс подхватывает сам.

BLOCKS = [
    {
        "key": "reason",
        "title": "Разум",
        "subtitle": "поэтический потенциал текста",
        "accent": "#00e5ff",
        "kind": "base",
        "criteria": [
            {
                "key": "image",
                "label": "Образ",
                "hint": "Художественное наполнение текста: метафоры, эпитеты, "
                        "аллюзии, панчлайны, игра слов, яркие образы, афоризмы, "
                        "сюжетные повороты, глубину и целостность.",
            },
            {
                "key": "rhyme",
                "label": "Рифма",
                "hint": "Созвучия, ассонансы, аллитерации, эпифоры, анафоры, "
                        "звуковые связи и общая музыкальность текста.",
            },
            {
                "key": "rhythm",
                "label": "Ритмика",
                "hint": "Работа со стихотворными размерами: регулярные ударения, "
                        "метрические схемы, паузы, акценты, их вариации.",
            },
        ],
    },
    {
        "key": "body",
        "title": "Тело",
        "subtitle": "исполнительские качества",
        "accent": "#ff3b6b",
        "kind": "base",
        "criteria": [
            {
                "key": "technique",
                "label": "Техника",
                "hint": "Управление голосом, безошибочность, точность, чистота, "
                        "мастерство, аккуратность, художественная изящность.",
            },
            {
                "key": "density",
                "label": "Насыщенность",
                "hint": "Приёмы, резко выделяющиеся в плюс: сложные выразительные "
                        "фрагменты, эдлибы, хоры, тембры, смены подачи.",
            },
            {
                "key": "conformity",
                "label": "Соответствие",
                "hint": "Гармония исполнения с музыкой, характерность стиля, "
                        "передача атмосферы и идеи произведения.",
            },
        ],
    },
    {
        "key": "soul",
        "title": "Душа",
        "subtitle": "эстетически важные параметры",
        "accent": "#aa00ff",
        "kind": "base",
        "criteria": [
            {
                "key": "individuality",
                "label": "Индивидуальность",
                "hint": "Харизма, магнетизм, самобытность, неповторимость — то, "
                        "что ярко выделяет исполнителя.",
            },
            {
                "key": "nativity",
                "label": "Нативность",
                "hint": "Лёгкость и естественность: органично, без натяжек, "
                        "музыка воспринимается без усилий.",
            },
            {
                "key": "quality",
                "label": "Качество",
                "hint": "Баланс инструментов и голоса, качество сведения, объём, "
                        "единая акустическая картина, аранжировка.",
            },
        ],
    },
    {
        "key": "art",
        "title": "Арт",
        "subtitle": "коэффициентный блок",
        "accent": "#ffd700",
        "kind": "art",
        "criteria": [
            {
                "key": "depth",
                "label": "Глубина",
                "hint": "Содержательная глубина песни: собственный художественный "
                        "мир, возвращаемость, независимость от текущего сезона.",
            },
            {
                "key": "reach",
                "label": "Широкоохватность",
                "hint": "Соответствие актуальным модам и направлениям, "
                        "хитовая привлекательность для широкой аудитории.",
            },
        ],
    },
]

BASE_KEYS = tuple(
    c["key"] for b in BLOCKS if b["kind"] == "base" for c in b["criteria"]
)
ART_KEYS = tuple(
    c["key"] for b in BLOCKS if b["kind"] == "art" for c in b["criteria"]
)


# --- Вспомогательные функции --------------------------------------------

def clamp_pos(value) -> float:
    """Приводит положение фейдера к [-1; 1]. Мусор считаем центром."""
    try:
        pos = float(value)
    except (TypeError, ValueError):
        return 0.0
    if math.isnan(pos):
        return 0.0
    return max(-1.0, min(1.0, pos))


def floor_to(value: float, step: float) -> float:
    """Округление ВНИЗ до шага шкалы.

    ТЗ: «если фейдер между 2,5 и 2,55 — засчитывается 2,5».
    """
    if step <= 0:
        return value
    steps = math.floor(value / step + 1e-9)
    return round(steps * step, 6)


def criterion_pair(pos, lo=BASE_MIN, hi=BASE_MAX, step=BASE_STEP):
    """Баллы обеих песен по базовому критерию.

    Возвращает (score_a, score_b): лидер получает значение фейдера,
    отстающий — ровно ``lo`` (единицу).
    """
    pos = clamp_pos(pos)
    if abs(pos) <= EPS:
        return (lo, lo)
    lead = floor_to(lo + abs(pos) * (hi - lo), step)
    lead = max(lo, min(hi, lead))
    return (lead, lo) if pos < 0 else (lo, lead)


def art_pair(pos):
    """Коэффициенты блока «Арт»: (bonus_a, bonus_b).

    Бонус получает только лидер; при равенстве — никто.
    При ``ART_BONUS_MODE == "delta"`` из значения вычитается единица.
    """
    pos = clamp_pos(pos)
    if abs(pos) <= EPS:
        return (0.0, 0.0)
    lead = floor_to(ART_MIN + abs(pos) * (ART_MAX - ART_MIN), ART_STEP)
    lead = max(ART_MIN, min(ART_MAX, lead))
    if ART_BONUS_MODE == "delta":
        lead = lead - ART_MIN
    return (lead, 0.0) if pos < 0 else (0.0, lead)


def _num(value, default=0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _format_num(value: float, decimals: int = 2) -> str:
    """2.0 -> «2», 1.234 -> «1,23». Запятая как десятичный разделитель."""
    rounded = round(float(value), decimals)
    if abs(rounded - round(rounded)) < 1e-9:
        text = str(int(round(rounded)))
    else:
        text = f"{rounded:.{decimals}f}".rstrip("0").rstrip(".")
    return text.replace(".", ",")


def _name(value, fallback: str) -> str:
    text = (value or "").strip() if isinstance(value, str) else ""
    return text or fallback


def _times_word(value: float) -> str:
    """«в 1,23 раза», «в 2 раза», «в 6 раз»."""
    nearest = round(float(value))
    if abs(float(value) - nearest) > 1e-9:
        return "раза"  # дробные: «в 5,5 раза»
    if nearest % 100 in (11, 12, 13, 14):
        return "раз"
    if nearest % 10 >= 5 or nearest % 10 == 0:
        return "раз"
    return "раза"


# --- Основной расчёт -----------------------------------------------------

def evaluate(payload: dict) -> dict:
    """Считает результат судейства.

    ``payload``::

        {
          "song_a": "Иван Дымин - Стул", "song_b": "...",
          "ov_a": 7, "ov_b": 8,
          "base": {"image": -0.3, "rhyme": 0.0, ...},
          "art":  {"atmosphere": 0.4, "reach": 0.0}
        }
    """
    payload = payload or {}
    base_positions = payload.get("base") or {}
    art_positions = payload.get("art") or {}

    name_a = _name(payload.get("song_a"), "Трек 1")
    name_b = _name(payload.get("song_b"), "Трек 2")

    # Базовые критерии по блокам
    blocks_a: dict[str, float] = {}
    blocks_b: dict[str, float] = {}
    criteria: dict[str, dict] = {}

    for block in BLOCKS:
        if block["kind"] != "base":
            continue
        sum_a = 0.0
        sum_b = 0.0
        for item in block["criteria"]:
            score_a, score_b = criterion_pair(base_positions.get(item["key"], 0.0))
            sum_a += score_a
            sum_b += score_b
            criteria[item["key"]] = {
                "label": item["label"],
                "pos": clamp_pos(base_positions.get(item["key"], 0.0)),
                "a": score_a,
                "b": score_b,
            }
        blocks_a[block["key"]] = round(sum_a, 4)
        blocks_b[block["key"]] = round(sum_b, 4)

    base_a = round(sum(blocks_a.values()), 4)
    base_b = round(sum(blocks_b.values()), 4)

    # Коэффициентный блок: a = A − 1, w = W − 1, Итог = База × (1 + a + w)
    art_a: dict[str, float] = {}
    art_b: dict[str, float] = {}
    bonus_a = 0.0
    bonus_b = 0.0
    for key in ART_KEYS:
        part_a, part_b = art_pair(art_positions.get(key, 0.0))
        art_a[key] = round(part_a, 4)
        art_b[key] = round(part_b, 4)
        bonus_a += part_a
        bonus_b += part_b

    total_a = round(base_a * (1.0 + bonus_a), 4)
    total_b = round(base_b * (1.0 + bonus_b), 4)

    # Общее впечатление: не влияет на итог, только разрешает ничью
    ov_a = None
    ov_b = None
    if payload.get("ov_a") is not None and str(payload.get("ov_a")) != "":
        ov_a = int(max(OV_MIN, min(OV_MAX, round(_num(payload.get("ov_a"), -1)))))
    if payload.get("ov_b") is not None and str(payload.get("ov_b")) != "":
        ov_b = int(max(OV_MIN, min(OV_MAX, round(_num(payload.get("ov_b"), -1)))))

    tiebreak = None
    if abs(total_a - total_b) > 1e-9:
        winner = "A" if total_a > total_b else "B"
    elif ov_a is not None and ov_b is not None and ov_a != ov_b:
        winner = "A" if ov_a > ov_b else "B"
        tiebreak = "ov"
    else:
        winner = "draw"

    if winner == "A":
        winner_name, loser_name = name_a, name_b
        winner_total, loser_total = total_a, total_b
        winner_ov, loser_ov = ov_a, ov_b
    elif winner == "B":
        winner_name, loser_name = name_b, name_a
        winner_total, loser_total = total_b, total_a
        winner_ov, loser_ov = ov_b, ov_a
    else:
        winner_name = loser_name = ""
        winner_total = loser_total = max(total_a, total_b)
        winner_ov = loser_ov = None

    high = max(total_a, total_b)
    low = min(total_a, total_b)
    ratio_raw = (high / low) if low > 1e-9 else 1.0
    ratio = round(ratio_raw, 2)

    # --- Аналитика -------------------------------------------------------
    mult_a = 1.0 + bonus_a
    mult_b = 1.0 + bonus_b

    # радар: базовое значение каждого критерия × коэффициент блока «Арт»
    radar_labels = [criteria[key]["label"] for key in BASE_KEYS]
    radar_a = [round(criteria[key]["a"] * mult_a, 3) for key in BASE_KEYS]
    radar_b = [round(criteria[key]["b"] * mult_b, 3) for key in BASE_KEYS]

    # где кто выиграл, а где проиграл относительно оппонента
    strengths_a: list[dict] = []
    weaknesses_a: list[dict] = []
    strengths_b: list[dict] = []
    weaknesses_b: list[dict] = []
    for key in BASE_KEYS:
        item = criteria[key]
        diff = item["a"] - item["b"]
        entry = {
            "label": item["label"],
            "a": item["a"],
            "b": item["b"],
            "diff": round(diff, 2),
        }
        if diff > 1e-9:
            strengths_a.append(entry)
            weaknesses_b.append(entry)
        elif diff < -1e-9:
            strengths_b.append(entry)
            weaknesses_a.append(entry)
    strengths_a.sort(key=lambda e: -e["diff"])
    strengths_b.sort(key=lambda e: -e["diff"])
    weaknesses_a.sort(key=lambda e: e["diff"])
    weaknesses_b.sort(key=lambda e: -e["diff"])

    # переворот блоком «Арт»
    art_flip = False
    base_leader = None
    if abs(base_a - base_b) > 1e-9:
        base_leader = "A" if base_a > base_b else "B"
    if winner in ("A", "B") and base_leader is not None:
        art_flip = base_leader != winner

    # метка разрыва
    if winner == "draw":
        gap = "Ничья"
    elif ratio_raw < 1.05:
        gap = "На грани"
    elif ratio_raw < 1.20:
        gap = "Уверенная победа"
    else:
        gap = "Разгром"

    if winner == "draw":
        kind = "draw"
        verdict = (
            "Ничья: после всех коэффициентов баллы равны"
            + (" и общее впечатление тоже." if (ov_a is not None and ov_a == ov_b) else ".")
        )
    elif tiebreak == "ov":
        kind = "draw_ov"
        verdict = "Баллы равны — победитель определён по общему впечатлению."
    elif art_flip:
        kind = "art_flip"
        base_leader_name = name_a if base_leader == "A" else name_b
        verdict = (
            f"Переворот Артом: по базовым критериям сильнее «{base_leader_name}», "
            f"но коэффициент блока «Арт» перевернул итог."
        )
    else:
        kind = "win"
        verdict = "Победа и по базовым критериям, и по итогу."

    if winner == "draw":
        sentence = (
            f"Ничья: «{name_a}» и «{name_b}» набрали одинаковые баллы"
            + (" и одинаковое общее впечатление." if (ov_a is not None and ov_a == ov_b) else ".")
        )
        ratio_text = "1,00"
    else:
        sentence = (
            f"Песня «{winner_name}» сильнее песни «{loser_name}» "
            f"в {_format_num(ratio)} {_times_word(ratio)}."
        )
        ratio_text = _format_num(ratio)

    # короткий ярлык исхода — без чисел и пояснений
    if kind == "draw":
        verdict_label = "Ничья"
    elif kind == "draw_ov":
        verdict_label = "По общему впечатлению"
    elif kind == "art_flip":
        verdict_label = "Переворот Артом"
    else:
        verdict_label = gap

    def _ov_text(value):
        return "—" if value is None else str(value)

    return {
        "ok": True,
        "mode": ART_BONUS_MODE,
        "winner": winner,
        "draw": winner == "draw",
        "tiebreak": tiebreak,
        "name_a": name_a,
        "name_b": name_b,
        "winner_name": winner_name,
        "loser_name": loser_name,
        "winner_ov": _ov_text(winner_ov),
        "loser_ov": _ov_text(loser_ov),
        "ov_a": _ov_text(ov_a),
        "ov_b": _ov_text(ov_b),
        "winner_total": round(winner_total, 2),
        "loser_total": round(loser_total, 2),
        "total_a": round(total_a, 2),
        "total_b": round(total_b, 2),
        "base_a": round(base_a, 2),
        "base_b": round(base_b, 2),
        "ratio": ratio,
        "ratio_text": ratio_text,
        "sentence": sentence,
        "blocks": {"a": blocks_a, "b": blocks_b},
        "art": {
            # доля базы, которая прибавляется песне (в режиме "delta"
            # это коэффициент − 1, в режиме "multiplier" — сам коэффициент)
            "a": art_a,
            "b": art_b,
        },
        "criteria": criteria,
        # --- аналитика после «Результата» ---
        "kind": kind,
        "verdict": verdict,
        "verdict_label": verdict_label,
        "gap": gap,
        "art_flip": art_flip,
        "multipliers": {"a": round(mult_a, 4), "b": round(mult_b, 4)},
        "radar": {
            "labels": radar_labels,
            "a": radar_a,
            "b": radar_b,
            # шкала радара: по фактическому максимуму, чтобы диаграмма читалась,
            # но не меньше 2 — иначе низкие оценки схлопываются в точку
            "max": max(2.0, float(math.ceil(max(radar_a + radar_b + [BASE_MIN])))),
        },
        "strengths_a": strengths_a,
        "weaknesses_a": weaknesses_a,
        "strengths_b": strengths_b,
        "weaknesses_b": weaknesses_b,
    }


def spec() -> dict:
    """Описание формы для QML."""
    from .texts import ALGORITHM, DESCRIPTIONS

    def norm_desc(raw: dict) -> dict:
        """Приводит описание к виду {intro, sections:[{title, items:[{title,text}]}]}."""
        result = {"intro": raw.get("intro", ""), "sections": []}
        for sec in raw.get("sections", []):
            items = []
            for item in sec.get("items", []):
                if isinstance(item, (list, tuple)) and len(item) == 2:
                    items.append({"title": item[0], "text": item[1]})
                elif isinstance(item, dict):
                    items.append(item)
            result["sections"].append({"title": sec.get("title", ""), "items": items})
        return result

    blocks = []
    for block in BLOCKS:
        copy = dict(block)
        copy["criteria"] = []
        for item in block["criteria"]:
            entry = dict(item)
            raw = DESCRIPTIONS.get(item["key"])
            if raw is None:
                raw = {"intro": item.get("hint", ""), "sections": []}
            entry["desc"] = norm_desc(raw)
            copy["criteria"].append(entry)
        blocks.append(copy)

    return {
        "version": 3,
        "art_bonus_mode": ART_BONUS_MODE,
        "blocks": blocks,
        "algorithm": list(ALGORITHM),
        "scales": {
            "base": {"min": BASE_MIN, "max": BASE_MAX, "step": BASE_STEP},
            "art": {"min": ART_MIN, "max": ART_MAX, "step": ART_STEP},
            "ov": {"min": OV_MIN, "max": OV_MAX, "step": 1},
        },
        "art_hint": (
            "a = A − 1, w = W − 1, каждая в пределах [0; 0,5]. "
            "Итог = База × (1 + a + w)."
        ),
    }
