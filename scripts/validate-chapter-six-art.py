"""Validate the exact isolated Chapter 6 art inventory and geometry."""

from __future__ import annotations

import argparse
from pathlib import Path

from chapter_six_art import (
    DEFAULT_CANDIDATE_ROOT,
    DEFAULT_PROCESSED_ROOT,
    validate_chapter_six_art,
)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--candidate-root", type=Path, default=DEFAULT_CANDIDATE_ROOT)
    parser.add_argument("--processed-root", type=Path, default=DEFAULT_PROCESSED_ROOT)
    args = parser.parse_args()
    try:
        validate_chapter_six_art(args.candidate_root, args.processed_root)
    except (AssertionError, FileNotFoundError, OSError, ValueError) as error:
        print("Chapter 6 art physical validation failed:")
        print(f"- {error}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
