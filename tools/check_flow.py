# -*- coding: utf-8 -*-
"""Сквозная проверка формы: заполнение -> calc() -> результат -> reset()."""
import json
import os
import sys
from pathlib import Path

os.environ.setdefault("QT_QPA_PLATFORM", "offscreen")

BASE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE))

from PySide6.QtCore import QMetaObject, QTimer, QUrl, Qt  # noqa: E402
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
engine.rootContext().setContextProperty("quick3dAvailable", False)
engine.load(QUrl.fromLocalFile(str(BASE / "qml" / "Main.qml")))

roots = engine.rootObjects()
assert roots, "форма не загрузилась"
root = roots[0]

print("== сценарий: A сильнее по Образу и Технике ==")
root.setProperty("nameA", "Иван Дымин — Стул")
root.setProperty("nameB", "Дарья Самойлова — Мышь")
root.setProperty("basePos", {"image": -0.6, "technique": -0.3})
root.setProperty("artPos", {"atmosphere": 0.4})
root.setProperty("ovA", 7)
root.setProperty("ovB", 5)

ok = QMetaObject.invokeMethod(root, "calc", Qt.DirectConnection)
print("calc() вызван:", ok)

res = root.property("result")
if hasattr(res, "toVariant"):
    res = res.toVariant()
print("result:", json.dumps(res, ensure_ascii=False, indent=2, default=str))

print("\n== проверка сброса ==")
ok = QMetaObject.invokeMethod(root, "resetAll", Qt.DirectConnection)
print("resetAll() вызван:", ok)
print("result после сброса:", root.property("result"))
print("nameA после сброса:", repr(root.property("nameA")))
print("gen:", root.property("gen"))

QTimer.singleShot(300, app.quit)
app.exec()
print("OK")
