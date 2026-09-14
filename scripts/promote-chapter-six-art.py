"""Promote the approved Chapter 6 candidate outputs.

Promotion is intentionally a separate, explicit step after contact-sheet and
tone approval.  The flag makes accidental invocation fail closed.
"""

from __future__ import annotations

import argparse
from pathlib import Path

from chapter_six_art import (
    DEFAULT_CANDIDATE_ROOT,
    DEFAULT_PROCESSED_ROOT,
    promote_chapter_six_art,
)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--approved",
        action="store_true",
        help="Confirm that proof, character/environment, contact-sheet, and tone reviews passed.",
    )
    parser.add_argument("--candidate-root", type=Path, default=DEFAULT_CANDIDATE_ROOT)
    parser.add_argument("--processed-root", type=Path, default=DEFAULT_PROCESSED_ROOT)
    args = parser.parse_args()
    if not args.approved:
        parser.error("promotion requires --approved after all manual review gates pass")
    try:
        promote_chapter_six_art(args.candidate_root, args.processed_root)
    except (AssertionError, FileNotFoundError, OSError, ValueError) as error:
        print("Chapter 6 art promotion failed:")
        print(f"- {error}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
