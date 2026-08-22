#!/usr/bin/env python3
"""Build Attend TEST_MANUAL.pdf from the hand-written LaTeX source."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BUILD = ROOT / "docs/latex/testing-manual/build.sh"


def main() -> int:
    if not BUILD.exists():
        print(f"Missing build script: {BUILD}", file=sys.stderr)
        return 1
    subprocess.run(["bash", str(BUILD)], check=True)
    pdf = ROOT / "docs/testing/TEST_MANUAL.pdf"
    if pdf.exists():
        print(f"PDF: {pdf} ({pdf.stat().st_size // 1024} KB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
