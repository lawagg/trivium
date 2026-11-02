# -*- coding: utf-8 -*-
"""Мост между QML и ядром судейства."""

from __future__ import annotations

import json

from PySide6.QtCore import QObject, Slot

from .scoring import evaluate, spec


class JudgingBridge(QObject):
    """Единственный объект, доступный из QML как ``bridge``."""

    @Slot(result=str)
    def spec(self) -> str:
        """Описание формы: блоки, критерии, шкалы."""
        try:
            return json.dumps(spec(), ensure_ascii=False)
        except Exception as exc:  # pragma: no cover - защита от падения окна
            return json.dumps({"ok": False, "error": str(exc)}, ensure_ascii=False)

    @Slot(str, result=str)
    def compute(self, payload: str) -> str:
        """Считает результат судейства. Принимает JSON, возвращает JSON."""
        try:
            data = json.loads(payload or "{}")
        except Exception as exc:
            return json.dumps(
                {"ok": False, "error": f"Некорректные данные формы: {exc}"},
                ensure_ascii=False,
            )
        try:
            return json.dumps(evaluate(data), ensure_ascii=False)
        except Exception as exc:  # pragma: no cover
            return json.dumps(
                {"ok": False, "error": f"Ошибка расчёта: {exc}"},
                ensure_ascii=False,
            )

    @Slot(result=str)
    def saveDir(self) -> str:
        """Папка по умолчанию для сохранения скриншотов (url)."""
        from pathlib import Path

        from PySide6.QtCore import QStandardPaths, QUrl

        try:
            path = QStandardPaths.writableLocation(QStandardPaths.PicturesLocation)
        except Exception:
            path = ""
        if not path:
            path = str(Path.home())
        return QUrl.fromLocalFile(path).toString()
