#!/usr/bin/env bash
# Сборка macOS-версии «Тривиума».
# Запуск из папки проекта:  bash build_macos.sh
# Требуется macOS: PyInstaller не умеет собирать .app под другой системой.
set -euo pipefail
cd "$(dirname "$0")"

PY="${PYTHON:-python3}"
echo "Python: $($PY --version)"

"$PY" -m pip install --upgrade --quiet pyinstaller PySide6

# иконка: из PNG делаем .icns (на macOS есть sips и iconutil)
if [ -f assets/trivium_1024.png ]; then
    ICONSET="build/Trivium.iconset"
    rm -rf "$ICONSET"
    mkdir -p "$ICONSET"
    for s in 16 32 128 256 512; do
        sips -z "$s" "$s" assets/trivium_1024.png --out "$ICONSET/icon_${s}x${s}.png" >/dev/null
        sips -z "$((s * 2))" "$((s * 2))" assets/trivium_1024.png --out "$ICONSET/icon_${s}x${s}@2x.png" >/dev/null
    done
    iconutil -c icns "$ICONSET" -o assets/trivium.icns
fi

"$PY" -m PyInstaller --noconfirm --clean Trivium.spec

if [ -d "dist/Trivium.app" ]; then
    du -sh "dist/Trivium.app" || true
    echo
    echo "Готово: dist/Trivium.app"
    echo "Если macOS ругается на «неизвестного разработчика»:"
    echo "  xattr -dr com.apple.quarantine dist/Trivium.app"
    echo "или откройте через правый клик → «Открыть»."
else
    echo "Сборка не дала dist/Trivium.app" >&2
    exit 1
fi
