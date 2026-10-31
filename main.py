# -*- coding: utf-8 -*-
"""Тривиум — система судейства двух песен.

Запуск:
    python main.py            # обычный запуск
    python main.py --selftest # проверка сборки без показа окна (для CI)
"""

from __future__ import annotations

import os
import sys
from pathlib import Path


def base_dir() -> Path:
    """Папка с ресурсами: рядом со скриптом или внутри собранного бандла."""
    if getattr(sys, "frozen", False):
        return Path(getattr(sys, "_MEIPASS", Path(sys.executable).parent))
    return Path(__file__).resolve().parent


BASE_DIR = base_dir()
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))


def _say(message: str) -> None:
    """Печать, безопасная для оконного исполняемого файла без консоли."""
    try:
        if sys.stdout is not None:
            print(message)
            sys.stdout.flush()
    except Exception:
        pass


def run_selftest() -> int:
    """Загружает интерфейс без окна: проверка, что бандл собран правильно."""
    os.environ.setdefault("QT_QPA_PLATFORM", "offscreen")

    from PySide6.QtCore import QTimer, QUrl
    from PySide6.QtGui import QGuiApplication
    from PySide6.QtQml import QQmlApplicationEngine
    from PySide6.QtQuickControls2 import QQuickStyle

    from trivium.bridge import JudgingBridge

    try:
        QQuickStyle.setStyle("Basic")
    except Exception:
        pass

    app = QGuiApplication([])
    engine = QQmlApplicationEngine()
    engine.addImportPath(str(BASE_DIR / "qml"))
    bridge = JudgingBridge()
    engine.rootContext().setContextProperty("bridge", bridge)
    engine.load(QUrl.fromLocalFile(str(BASE_DIR / "qml" / "Main.qml")))

    ok = bool(engine.rootObjects())
    if ok:
        try:
            spec_len = len(bridge.spec())
        except Exception:
            spec_len = -1
        _say("SELFTEST OK: spec " + str(spec_len) + " chars")
    else:
        _say("SELFTEST FAIL: интерфейс не загрузился")

    QTimer.singleShot(400, app.quit)
    app.exec()

    # os._exit: не даём Qt зависнуть на разрушении окна без цикла событий
    os._exit(0 if ok else 1)


def main(argv=None) -> int:
    argv = list(sys.argv if argv is None else argv)
    if "--selftest" in argv:
        return run_selftest()

    try:
        from PySide6.QtCore import QUrl
        from PySide6.QtGui import QGuiApplication
        from PySide6.QtQml import QQmlApplicationEngine
        from PySide6.QtQuickControls2 import QQuickStyle
    except ImportError as exc:  # pragma: no cover
        print("Не удалось импортировать PySide6:", exc)
        print("Установите зависимости:  pip install PySide6")
        return 1

    try:
        QQuickStyle.setStyle("Basic")
    except Exception:
        pass

    app = QGuiApplication(argv)
    app.setApplicationName("Trivium")
    app.setApplicationDisplayName("Тривиум — система судейства")

    from trivium.bridge import JudgingBridge

    engine = QQmlApplicationEngine()
    engine.addImportPath(str(BASE_DIR / "qml"))

    bridge = JudgingBridge()
    engine.rootContext().setContextProperty("bridge", bridge)

    engine.load(QUrl.fromLocalFile(str(BASE_DIR / "qml" / "Main.qml")))
    if not engine.rootObjects():
        print("Не удалось загрузить интерфейс: qml/Main.qml")
        return 1

    # служебный хук для автопроверки сборки: закрыться через N мс
    autoclose = os.environ.get("TRIVIUM_AUTOCLOSE_MS")
    if autoclose:
        try:
            from PySide6.QtCore import QTimer

            QTimer.singleShot(int(autoclose), app.quit)
        except Exception:
            pass

    return app.exec()


if __name__ == "__main__":
    sys.exit(main())
