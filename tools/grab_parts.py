# -*- coding: utf-8 -*-
"""Снимок отдельных компонентов (фейдеры) в PNG."""
import os
import sys
from pathlib import Path

os.environ.setdefault("QT_QPA_PLATFORM", "offscreen")

BASE = Path(__file__).resolve().parent.parent
HERE = Path(__file__).resolve().parent
OUT = HERE / "shots"
OUT.mkdir(parents=True, exist_ok=True)
sys.path.insert(0, str(BASE))

from PySide6.QtCore import QTimer, QUrl  # noqa: E402
from PySide6.QtGui import QGuiApplication  # noqa: E402
from PySide6.QtQml import QQmlApplicationEngine  # noqa: E402
from PySide6.QtQuickControls2 import QQuickStyle  # noqa: E402

QQuickStyle.setStyle("Basic")
app = QGuiApplication(sys.argv)

engine = QQmlApplicationEngine()
engine.addImportPath(str(BASE / "qml"))
engine.load(QUrl.fromLocalFile(str(HERE / "faders.qml")))

if engine.rootObjects():
    root = engine.rootObjects()[0]
    root.resize(620, 260)
    img = root.grabWindow()
    img.save(str(OUT / "5_faders.png"))
    print("saved 5_faders", img.width(), img.height())
else:
    print("FAIL: faders.qml не загрузился")

QTimer.singleShot(200, app.quit)
app.exec()
