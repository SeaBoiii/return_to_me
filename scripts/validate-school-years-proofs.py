"""Physical checks for the Chapters 1-2 first-approval proof batch.

The proof gate intentionally accepts either genuine transparency or the
approved flat-magenta fallback for character anchors. Production sprites have
stricter normalized-canvas and alpha-edge requirements after approval.
"""

from __future__ import annotations

from pathlib import Path
import sys

import numpy as np
from PIL import Image, UnidentifiedImageError


ROOT = Path(__file__).resolve().parents[1]
PROOF_ROOT = ROOT / "art" / "proofs" / "school-years-refresh"
MAX_PROOF_BYTES = 8 * 1024 * 1024

CHARACTER_PROOFS = (
    "aleem-p6-anchor.png",
    "alya-p6-anchor.png",
    "aleem-young-home-anchor.png",
    "alya-young-home-anchor.png",
    "aleem-sec-anchor.png",
    "aleem-home-anchor.png",
    "hana-anchor.png",
    "faris-anchor.png",
)

SCENE_PROOFS = (
    "bg-primary-canteen-proof.png",
    "bg-bedroom-2009-warm-proof.png",
    "bg-language-classroom-late-proof.png",
    "bg-results-hall-v2-proof.png",
)


def _open(path: Path, errors: list[str]) -> Image.Image | None:
    if not path.is_file():
        errors.append(f"missing {path.relative_to(ROOT)}")
        return None
    if path.stat().st_size >= MAX_PROOF_BYTES:
        errors.append(f"{path.relative_to(ROOT)} exceeds 8 MiB")
    try:
        image = Image.open(path)
        image.load()
        return image
    except (OSError, UnidentifiedImageError) as error:
        errors.append(f"cannot decode {path.relative_to(ROOT)}: {error}")
        return None


def _has_valid_alpha(image: Image.Image) -> bool:
    if "A" not in image.getbands():
        return False
    minimum, maximum = image.getchannel("A").getextrema()
    return minimum == 0 and maximum > 0


def _has_flat_magenta_key(image: Image.Image) -> bool:
    rgb = np.asarray(image.convert("RGB"))
    thickness = min(5, rgb.shape[0], rgb.shape[1])
    border = np.concatenate(
        (
            rgb[:thickness].reshape(-1, 3),
            rgb[-thickness:].reshape(-1, 3),
            rgb[:, :thickness].reshape(-1, 3),
            rgb[:, -thickness:].reshape(-1, 3),
        )
    )
    magenta = (
        (border[:, 0] > 180)
        & (border[:, 2] > 160)
        & (border[:, 1] < 90)
    )
    if float(magenta.mean()) < 0.85:
        return False
    keyed = border[magenta].astype(np.float32)
    median = np.median(keyed, axis=0)
    distance = np.linalg.norm(keyed - median, axis=1)
    return float(np.percentile(distance, 99)) <= 28


def _inspect_character(path: Path, errors: list[str]) -> None:
    image = _open(path, errors)
    if image is None:
        return
    with image:
        if image.format != "PNG":
            errors.append(f"{path.relative_to(ROOT)} is {image.format}; expected PNG")
        if image.height <= image.width or min(image.size) < 1024:
            errors.append(
                f"{path.relative_to(ROOT)} is {image.width}x{image.height}; "
                "expected a high-resolution portrait proof"
            )
        if not (_has_valid_alpha(image) or _has_flat_magenta_key(image)):
            errors.append(
                f"{path.relative_to(ROOT)} has neither genuine alpha nor the "
                "approved flat-magenta key"
            )


def _inspect_scene(path: Path, errors: list[str]) -> None:
    image = _open(path, errors)
    if image is None:
        return
    with image:
        if image.format != "PNG":
            errors.append(f"{path.relative_to(ROOT)} is {image.format}; expected PNG")
        ratio = image.width / image.height
        if abs(ratio - 16 / 9) > 0.005 or image.width < 1600 or image.height < 900:
            errors.append(
                f"{path.relative_to(ROOT)} is {image.width}x{image.height}; "
                "expected a high-resolution 16:9 proof"
            )


def main() -> int:
    errors: list[str] = []
    for filename in CHARACTER_PROOFS:
        _inspect_character(PROOF_ROOT / filename, errors)
    for filename in SCENE_PROOFS:
        _inspect_scene(PROOF_ROOT / filename, errors)

    records = (
        PROOF_ROOT / "chapter-1-prompts.md",
        PROOF_ROOT / "chapter-2-prompts.md",
        PROOF_ROOT / "scene-prompts.md",
    )
    for path in records:
        if not path.is_file():
            errors.append(f"missing {path.relative_to(ROOT)}")

    if errors:
        print("School Years proof validation failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print(
        "School Years first-gate proofs passed: eight character anchors, "
        "four 16:9 environments, and three prompt/QA records."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
