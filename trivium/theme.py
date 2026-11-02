# -*- coding: utf-8 -*-
"""Палитра приложения: тёмная и светлая темы.

Цвета отдаются в QML как свойства объекта ``theme`` — при переключении
все привязки пересчитываются автоматически.
"""

from __future__ import annotations

from PySide6.QtCore import Property, QObject, Signal, Slot

DARK = {
    "bg": "#08080C",
    "surface": "#0D0D15",
    "surfaceHi": "#12121C",
    "line": "#2C2C3C",
    "lineSoft": "#1C1C28",
    "text": "#ECECF2",
    "textDim": "#A6A6B8",
    "textMute": "#6E6E84",
    "accent": "#D0AE63",
    "sideA": "#56B4E9",
    "sideB": "#E69F00",
    "vertexRing": "#62627A",
}

LIGHT = {
    "bg": "#F3F2EE",
    "surface": "#FFFFFF",
    "surfaceHi": "#F8F7F3",
    "line": "#D5D2C7",
    "lineSoft": "#E3E0D6",
    "text": "#1B1C22",
    "textDim": "#4B4E5A",
    "textMute": "#8B8D99",
    "accent": "#9A6B12",
    "sideA": "#0F6FB5",
    "sideB": "#C24E00",
    "vertexRing": "#9A9AA6",
}


class Theme(QObject):
    """Текущая тема. ``dark`` — флаг, остальные свойства — цвета."""

    paletteChanged = Signal()

    def __init__(self, dark: bool = True) -> None:
        super().__init__()
        self._dark = dark

    def _color(self, name: str) -> str:
        return (DARK if self._dark else LIGHT)[name]

    @Property(bool, notify=paletteChanged)
    def dark(self) -> bool:
        return self._dark

    @Slot()
    def toggle(self) -> None:
        self._dark = not self._dark
        self.paletteChanged.emit()

    @Slot(bool)
    def setDark(self, value: bool) -> None:
        if self._dark != value:
            self._dark = value
            self.paletteChanged.emit()

    @Property(str, notify=paletteChanged)
    def bg(self) -> str:
        return self._color("bg")

    @Property(str, notify=paletteChanged)
    def surface(self) -> str:
        return self._color("surface")

    @Property(str, notify=paletteChanged)
    def surfaceHi(self) -> str:
        return self._color("surfaceHi")

    @Property(str, notify=paletteChanged)
    def line(self) -> str:
        return self._color("line")

    @Property(str, notify=paletteChanged)
    def lineSoft(self) -> str:
        return self._color("lineSoft")

    @Property(str, notify=paletteChanged)
    def text(self) -> str:
        return self._color("text")

    @Property(str, notify=paletteChanged)
    def textDim(self) -> str:
        return self._color("textDim")

    @Property(str, notify=paletteChanged)
    def textMute(self) -> str:
        return self._color("textMute")

    @Property(str, notify=paletteChanged)
    def accent(self) -> str:
        return self._color("accent")

    @Property(str, notify=paletteChanged)
    def sideA(self) -> str:
        return self._color("sideA")

    @Property(str, notify=paletteChanged)
    def sideB(self) -> str:
        return self._color("sideB")

    @Property(str, notify=paletteChanged)
    def vertexRing(self) -> str:
        return self._color("vertexRing")
