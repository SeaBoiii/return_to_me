"""Physical validation for the candidate-only Chapters 1-2 art refresh.

The inventory and geometry rules live beside the processor so the generation
and validation commands cannot silently drift. This wrapper intentionally
targets ``art/candidates/school-years-refresh/processed``; it never reads from
or writes to the deployable ``public`` tree.
"""

from __future__ import annotations

import argparse
import importlib.util
from pathlib import Path
import sys
from types import ModuleType


ROOT = Path(__file__).resolve().parents[1]


def load_pipeline() -> ModuleType:
    path = ROOT / "scripts" / "process-art.py"
    spec = importlib.util.spec_from_file_location("return_to_me_process_art", path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load art pipeline from {path}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--candidate-root",
        type=Path,
        default=ROOT / "art" / "candidates" / "school-years-refresh",
    )
    parser.add_argument(
        "--retained-source-root",
        type=Path,
        default=ROOT / "art" / "sources",
    )
    parser.add_argument(
        "--processed-root",
        type=Path,
        default=(
            ROOT
            / "art"
            / "candidates"
            / "school-years-refresh"
            / "processed"
        ),
    )
    args = parser.parse_args()

    try:
        pipeline = load_pipeline()
        pipeline.validate_school_years_art(
            args.candidate_root,
            args.retained_source_root,
            args.processed_root,
        )
    except (AssertionError, FileNotFoundError, OSError, ValueError) as error:
        print("School Years art physical validation failed:", file=sys.stderr)
        print(f"- {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
