# -*- coding: utf-8 -*-
"""Проверка темы и сохранения скриншотов (без показа окна пользователю)."""
import json
import sys
import tempfile
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
OUT = Path(__file__).resolve().parent / "preview"
OUT.mkdir(exist_ok=True)
SAVE_DIR = Path(tempfile.mkdtemp(prefix="triv_save_"))

sys.path.insert(0, str(BASE))
import os

os.environ.pop("QT_QPA_PLATFORM", None)

from PySide6.QtCore import QTimer, QUrl  # noqa: E402
from PySide6.QtGui import QGuiApplication  # noqa: E402
from PySide6.QtQml import QQmlApplicationEngine  # noqa: E402
from PySide6.QtQuickControls2 import QQuickStyle  # noqa: E402

from trivium.bridge import JudgingBridge  # noqa: E402
from trivium.theme import Theme  # noqa: E402

QQuickStyle.setStyle("Basic")
app = QGuiApplication(sys.argv)
engine = QQmlApplicationEngine()
engine.addImportPath(str(BASE / "qml"))
bridge = JudgingBridge()
theme = Theme()
engine.rootContext().setContextProperty("bridge", bridge)
engine.rootContext().setContextProperty("theme", theme)
engine.load(QUrl.fromLocalFile(str(BASE / "qml" / "Main.qml")))

root = engine.rootObjects()[0]
root.resize(1440, 900)
root.setPosition(-4000, -4000)

BLOCKS = {b["key"]: b for b in json.loads(bridge.spec())["blocks"]}
VERTEX = ["art", "reason", "body", "soul"]


def shot(name):
    root.grabWindow().save(str(OUT / f"{name}.png"))
    print("saved", name)


def open_vertex(i):
    root.setProperty("panelData", BLOCKS[VERTEX[i]])
    root.setProperty("activeBlock", i)


def result_payload():
    return json.loads(bridge.compute(json.dumps({
        "song_a": "Трек 1", "song_b": "Трек 2", "ov_a": 7, "ov_b": 5,
        "base": {"image": -0.6, "rhyme": -0.2, "rhythm": 0.3, "technique": -0.4,
                 "density": 0.5, "conformity": -0.1, "individuality": -0.3,
                 "nativity": 0.2, "quality": 0.4},
        "art": {"depth": -0.3, "reach": 0.2},
    })))


def step1():
    root.setProperty("nameA", "Трек 1")
    root.setProperty("nameB", "Трек 2")
    QTimer.singleShot(500, step2)


def step2():
    shot("dark_form")
    open_vertex(1)
    QTimer.singleShot(1200, step3)


def step3():
    shot("dark_block")
    root.setProperty("activeBlock", -1)
    root.setProperty("result", result_payload())
    QTimer.singleShot(900, step4)


def step4():
    shot("dark_result")
    theme.toggle()
    QTimer.singleShot(700, step5)


def step5():
    shot("light_result")
    root.setProperty("result", None)
    open_vertex(2)
    QTimer.singleShot(1100, step6)


def step6():
    shot("light_block")
    root.setProperty("activeBlock", -1)
    root.setProperty("helpOpen", True)
    QTimer.singleShot(1000, step6b)


def step6b():
    shot("light_help")
    root.setProperty("helpOpen", False)
    QTimer.singleShot(300, step7)


def step7():
    shot("light_form")
    root.setProperty("result", result_payload())
    QTimer.singleShot(800, step8)


def step8():
    root.setProperty("saveDir", QUrl.fromLocalFile(str(SAVE_DIR)).toString())
    root.setProperty("nameA", "Трек 1")
    root.setProperty("nameB", "Трек 2")
    ok = root.metaObject().invokeMethod
    from PySide6.QtCore import QMetaObject, Qt

    QMetaObject.invokeMethod(root, "beginSave", Qt.DirectConnection)
    QTimer.singleShot(9000, step9)


def step9():
    files = sorted(p.name for p in SAVE_DIR.glob("*"))
    print("файлов сохранено:", len(files))
    for f in files:
        size = (SAVE_DIR / f).stat().st_size
        print(f"  {f} — {size} байт")
    status = root.property("saveStatus")
    print("статус:", status)
    app.quit()


QTimer.singleShot(1200, step1)
app.exec()
print("save dir:", SAVE_DIR)
print("done")
