# Сборка Windows-версии «Тривиума».
#   powershell -ExecutionPolicy Bypass -File build_windows.ps1
#   powershell -ExecutionPolicy Bypass -File build_windows.ps1 -OneFile
#
# По умолчанию собирается папка dist\Trivium\ (быстрый запуск, без распаковки
# во временную папку). Флаг -OneFile даёт один dist\Trivium.exe, но такой файл
# при каждом запуске распаковывается в %TEMP% и чаще ловит предупреждения.
param(
    [string]$Python = "python",
    [switch]$OneFile
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "Python:" (& $Python --version 2>&1)

& $Python -m pip install --upgrade --quiet pyinstaller
& $Python -m pip install --upgrade --quiet PySide6

if ($OneFile) {
    $env:TRIVIUM_ONEFILE = "1"
    & $Python -m PyInstaller --noconfirm --clean Trivium.spec
    Remove-Item Env:\TRIVIUM_ONEFILE
    if (-not (Test-Path "dist\Trivium.exe")) { throw "Сборка не дала dist\Trivium.exe" }
    $mb = [math]::Round((Get-Item "dist\Trivium.exe").Length / 1MB, 1)
    Write-Host ""
    Write-Host "Готово: dist\Trivium.exe ($mb МБ)"
} else {
    & $Python -m PyInstaller --noconfirm --clean Trivium.spec
    if (-not (Test-Path "dist\Trivium\Trivium.exe")) { throw "Сборка не дала dist\Trivium\Trivium.exe" }

    if (Test-Path "dist\Trivium-Windows.zip") { Remove-Item "dist\Trivium-Windows.zip" -Force }
    Compress-Archive -Path "dist\Trivium\*" -DestinationPath "dist\Trivium-Windows.zip" -CompressionLevel Optimal

    $mb = [math]::Round((Get-Item "dist\Trivium-Windows.zip").Length / 1MB, 1)
    Write-Host ""
    Write-Host "Готово: dist\Trivium\Trivium.exe (папка) и dist\Trivium-Windows.zip ($mb МБ)"
}
