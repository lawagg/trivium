# -*- coding: utf-8 -*-
"""Проверка загрузки QML без показа окна."""
import os
import sys
from pathlib import Path

os.environ.setdefault("QT_QPA_PLATFORM", "offscreen")
os.environ.setdefault("QT_LOGGING_RULES", "*.debug=false")

BASE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE))

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
engine.rootContext().setContextProperty("quick3dAvailable", False)

engine.load(QUrl.fromLocalFile(str(BASE / "qml" / "Main.qml")))

roots = engine.rootObjects()
print("ROOT_OBJECTS:", len(roots))

if roots:
    root = roots[0]
    # проверим, что форма собралась: 4 блока
    try:
        spec = bridge.spec()
        print("SPEC_OK:", len(spec), "chars")
    except Exception as exc:
        print("SPEC_FAIL:", exc)

    # нажмём «Результат» программно через вызов логики
    try:
        result = root.property("result")
        print("RESULT_INITIAL:", result)
    except Exception as exc:
        print("PROP_FAIL:", exc)

QTimer.singleShot(1500, app.quit)
code = app.exec()
print("EXIT:", code)
