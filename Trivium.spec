# -*- mode: python ; coding: utf-8 -*-
"""Сборка «Тривиума».

По умолчанию — папка (onedir): запускается сразу, ничего не распаковывает
во временную папку, и антивирус/SmartScreen реагируют заметно спокойнее.

    pyinstaller --noconfirm Trivium.spec      → dist/Trivium/Trivium.exe

Одноместный файл (onefile) — по флагу окружения:
    TRIVIUM_ONEFILE=1 pyinstaller --noconfirm Trivium.spec  → dist/Trivium.exe
"""

import os
import sys
from pathlib import Path

ROOT = Path(SPECPATH)
IS_MAC = sys.platform == "darwin"
ONEFILE = os.environ.get("TRIVIUM_ONEFILE") == "1"

ICON = ROOT / "assets" / ("trivium.icns" if IS_MAC else "trivium.ico")
ICON_ARG = str(ICON) if ICON.exists() else None

EXCLUDES = [
    "tkinter",
    "unittest",
    "pydoc",
    "PySide6.QtWebEngineCore",
    "PySide6.QtWebEngineWidgets",
    "PySide6.QtWebEngineQuick",
    "PySide6.QtQuick3D",
    "PySide6.Qt3DCore",
    "PySide6.Qt3DRender",
    "PySide6.QtMultimedia",
    "PySide6.QtMultimediaWidgets",
    "PySide6.QtCharts",
    "PySide6.QtDataVisualization",
    "PySide6.QtBluetooth",
    "PySide6.QtPositioning",
    "PySide6.QtSerialPort",
    "PySide6.QtSql",
    "PySide6.QtTest",
    "PySide6.QtDesigner",
    "PySide6.QtHelp",
    "PySide6.QtUiTools",
    "PySide6.QtPdf",
    "PySide6.QtPdfWidgets",
]

a = Analysis(
    ["main.py"],
    pathex=[str(ROOT)],
    binaries=[],
    datas=[(str(ROOT / "qml"), "qml")],
    hiddenimports=["trivium.bridge", "trivium.scoring", "trivium.texts"],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=EXCLUDES,
    noarchive=False,
)

pyz = PYZ(a.pure)

APP_NAME = "Trivium"
BUNDLE_INFO = {
    "CFBundleName": "Trivium",
    "CFBundleDisplayName": "Тривиум",
    "CFBundleShortVersionString": "1.0.0",
    "CFBundleVersion": "1.0.0",
    "NSHighResolutionCapable": True,
    "LSMinimumSystemVersion": "11.0",
}

if ONEFILE:
    exe = EXE(
        pyz,
        a.scripts,
        a.binaries,
        a.datas,
        [],
        name=APP_NAME,
        debug=False,
        bootloader_ignore_signals=False,
        strip=False,
        upx=False,
        runtime_tmpdir=None,
        console=False,
        disable_windowed_traceback=False,
        argv_emulation=False,
        target_arch=None,
        codesign_identity=None,
        entitlements_file=None,
        icon=ICON_ARG,
    )
    if IS_MAC:
        app = BUNDLE(
            exe,
            name=APP_NAME + ".app",
            icon=ICON_ARG,
            bundle_identifier="com.lawanda.trivium",
            info_plist=BUNDLE_INFO,
        )
else:
    exe = EXE(
        pyz,
        a.scripts,
        [],
        exclude_binaries=True,
        name=APP_NAME,
        debug=False,
        bootloader_ignore_signals=False,
        strip=False,
        upx=False,
        console=False,
        disable_windowed_traceback=False,
        argv_emulation=False,
        target_arch=None,
        codesign_identity=None,
        entitlements_file=None,
        icon=ICON_ARG,
    )
    coll = COLLECT(
        exe,
        a.binaries,
        a.datas,
        strip=False,
        upx=False,
        name=APP_NAME,
    )
    if IS_MAC:
        app = BUNDLE(
            coll,
            name=APP_NAME + ".app",
            icon=ICON_ARG,
            bundle_identifier="com.lawanda.trivium",
            info_plist=BUNDLE_INFO,
        )
