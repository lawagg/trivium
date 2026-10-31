# -*- coding: utf-8 -*-
"""Скриншоты для README: рендер с реальным платформенным движком (со шрифтами).

Окно уводится за пределы экрана, поэтому на рабочем столе ничего не мешает.
"""
import json
import os
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
OUT = BASE / "docs" / "screenshots"
OUT.mkdir(parents=True, exist_ok=True)
sys.path.insert(0, str(BASE))

os.environ.pop("QT_QPA_PLATFORM", None)

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
root.resize(1440, 900)
root.setPosition(-4000, -4000)

BLOCKS = {b["key"]: b for b in json.loads(bridge.spec())["blocks"]}
VERTEX = ["art", "reason", "body", "soul"]


def shoot(name):
    img = root.grabWindow()
    path = OUT / f"{name}.png"
    img.save(str(path))
    print("saved", path.name, img.width(), img.height())


def open_vertex(i):
    root.setProperty("panelData", BLOCKS[VERTEX[i]])
    root.setProperty("activeBlock", i)


def set_names(a, b):
    from PySide6.QtCore import QObject

    card_a = root.findChild(QObject, "cardA")
    card_b = root.findChild(QObject, "cardB")
    if card_a:
        card_a.setProperty("name", a)
    if card_b:
        card_b.setProperty("name", b)


def step1():
    set_names("Трек 1", "Трек 2")
    root.setProperty("nameA", "Трек 1")
    root.setProperty("nameB", "Трек 2")
    QTimer.singleShot(600, step2)


def step2():
    shoot("1_form")
    open_vertex(1)
    QTimer.singleShot(1500, step3)


def step3():
    shoot("2_block")
    root.setProperty("activeBlock", -1)
    payload = {
        "song_a": "Трек 1",
        "song_b": "Трек 2",
        "ov_a": 7,
        "ov_b": 5,
        "base": {
            "image": -0.6, "rhyme": -0.2, "rhythm": 0.3,
            "technique": -0.4, "density": 0.5, "conformity": -0.1,
            "individuality": -0.3, "nativity": 0.2, "quality": 0.4,
        },
        "art": {"depth": -0.3, "reach": 0.2},
    }
    root.setProperty("result", json.loads(bridge.compute(json.dumps(payload))))
    QTimer.singleShot(1200, step4)


def step4():
    shoot("3_result")
    root.setProperty("result", None)
    root.setProperty("helpOpen", True)
    QTimer.singleShot(1200, step5)


def step5():
    shoot("4_help")
    app.quit()


QTimer.singleShot(1500, step1)
app.exec()
print("done")
