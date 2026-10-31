# -*- coding: utf-8 -*-
"""Пакет системы судейства «Тривиум»."""

from .scoring import BLOCKS, evaluate, spec  # noqa: F401

__all__ = ["BLOCKS", "evaluate", "spec"]
