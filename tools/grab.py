# -*- coding: utf-8 -*-
"""Снимки экранов в PNG для проверки вёрстки."""
import json
import os
import sys
from pathlib import Path

os.environ.setdefault("QT_QPA_PLATFORM", "offscreen")

BASE = Path(__file__).resolve().parent.parent
OUT = Path(__file__).resolve().parent / "shots"
OUT.mkdir(parents=True, exist_ok=True)
sys.path.insert(0, str(BASE))

from PySide6.QtCore import QTimer, QUrl  # noqa: E402
from PySide6.QtGui import QGuiApplication  # noqa: E402
from PySide6.QtQml import QQmlApplicationEngine  # noqa: E402
from PySide6.QtQuickControls2 import QQuickStyle  # noqa: E402

from trivium.bridge import JudgingBridge  # noqa: E402

QQuickStyle.setStyle("Basic")
app = QGuiApplication(sys.argv)
engine = QQmlApplicationEngine()
engine.addImportPath(str(BASE / "qml"))
bridge = JudgingBridge()
engine.rootContext().setContextProperty("bridge", bridge)
engine.load(QUrl.fromLocalFile(str(BASE / "qml" / "Main.qml")))

root = engine.rootObjects()[0]
BLOCKS = {b["key"]: b for b in json.loads(bridge.spec())["blocks"]}
VERTEX = ["art", "reason", "body", "soul"]


def shoot(name):
    img = root.grabWindow()
    img.save(str(OUT / f"{name}.png"))
    print("saved", name, img.width(), img.height())


def size(w, h):
    root.resize(w, h)


def open_vertex(i):
    root.setProperty("panelData", BLOCKS[VERTEX[i]])
    root.setProperty("activeBlock", i)


def show_result(base, art, ov_a=None, ov_b=None):
    payload = {
        "song_a": "Иван Дымин — Стул",
        "song_b": "Дарья Самойлова — Мышь",
        "ov_a": ov_a,
        "ov_b": ov_b,
        "base": base,
        "art": art,
    }
    res = json.loads(bridge.compute(json.dumps(payload)))
    root.setProperty("result", res)
    return res


def step1():
    size(1360, 880)
    QTimer.singleShot(300, step2)


def step2():
    shoot("1_idle")
    root.setProperty("nameA", "Иван Дымин — Стул")
    root.setProperty("nameB", "Дарья Самойлова — Мышь")
    open_vertex(1)
    QTimer.singleShot(1300, step3)


def step3():
    shoot("2_block_info")
    root.setProperty("activeBlock", -1)
    show_result(
        {"image": -0.6, "rhyme": -0.2, "rhythm": 0.3, "technique": -0.4,
         "density": 0.5, "conformity": -0.1, "individuality": -0.3,
         "nativity": 0.2, "quality": 0.4},
        {"depth": -0.3, "reach": 0.2},
        ov_a=7, ov_b=5,
    )
    QTimer.singleShot(900, step4)


def step4():
    shoot("3_result_win")
    show_result(
        {"image": -0.12},
        {"depth": 1.0},
        ov_a=6, ov_b=8,
    )
    QTimer.singleShot(700, step5)


def step5():
    shoot("4_result_flip")
    show_result({}, {}, ov_a=7, ov_b=7)
    QTimer.singleShot(700, step6)


def step6():
    shoot("5_result_draw")
    size(1000, 760)
    QTimer.singleShot(700, step7)


def step7():
    shoot("6_result_narrow")
    root.setProperty("result", None)
    size(1360, 880)
    root.setProperty("helpOpen", True)
    QTimer.singleShot(900, step8)


def step8():
    shoot("7_help")
    app.quit()


QTimer.singleShot(900, step1)
app.exec()
print("done")
