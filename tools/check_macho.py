# -*- coding: utf-8 -*-
"""Проверяет, что macOS-сборка универсальная (x86_64 + arm64)."""
import struct
import sys
import zipfile
from pathlib import Path

ZIP = Path(sys.argv[1])
CPU = {0x01000007: "x86_64", 0x0100000C: "arm64", 0x00000007: "i386", 0x0000000C: "arm"}
MAGIC = {0xCAFEBABE, 0xCAFEBABF, 0xBEBAFECA, 0xBEBAFECF}


def archs(data: bytes) -> list[str]:
    magic = struct.unpack(">I", data[:4])[0]
    if magic == 0xCAFEBABF:  # fat64
        count = struct.unpack(">I", data[4:8])[0]
        out = []
        off = 8
        for _ in range(count):
            cputype = struct.unpack(">I", data[off:off + 4])[0]
            out.append(CPU.get(cputype, hex(cputype)))
            off += 32
        return out
    if magic == 0xCAFEBABE:  # fat32
        count = struct.unpack(">I", data[4:8])[0]
        out = []
        off = 8
        for _ in range(count):
            cputype = struct.unpack(">I", data[off:off + 4])[0]
            out.append(CPU.get(cputype, hex(cputype)))
            off += 20
        return out
    if magic == 0xBEBAFECA:  # fat32, little-endian header
        count = struct.unpack("<I", data[4:8])[0]
        out = []
        off = 8
        for _ in range(count):
            cputype = struct.unpack("<I", data[off:off + 4])[0]
            out.append(CPU.get(cputype, hex(cputype)))
            off += 20
        return out
    # обычный (тонкий) Mach-O
    m = struct.unpack("<I", data[:4])[0]
    if m in (0xFEEDFACF, 0xFEEDFACE):
        cputype = struct.unpack("<I", data[4:8])[0]
        return [CPU.get(cputype, hex(cputype))]
    return ["не Mach-O"]


with zipfile.ZipFile(ZIP) as z:
    names = z.namelist()
    targets = [n for n in names if n.endswith("/Contents/MacOS/Trivium")]
    if not targets:
        print("не найден исполняемый файл приложения")
        sys.exit(1)

    exe = targets[0]
    with z.open(exe) as f:
        data = f.read(4096)
    found = archs(data)
    print(f"{exe}: {', '.join(found)}")

    # ещё пара библиотек Qt — на случай, если universal только лаунчер
    libs = [n for n in names if n.endswith("QtCore") and "Versions" in n]
    for lib in libs[:1]:
        with z.open(lib) as f:
            print(f"{lib}: {', '.join(archs(f.read(4096)))}")

    ok = set(found) >= {"x86_64", "arm64"}
    print("ИТОГ:", "универсальная сборка" if ok else "ТОЛЬКО ОДНА АРХИТЕКТУРА")
    sys.exit(0 if ok else 2)
