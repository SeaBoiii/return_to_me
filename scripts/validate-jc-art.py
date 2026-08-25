"""Physical checks for the deployed JC expansion art batch.

This complements the TypeScript manifest/graph validator. It intentionally does
not attempt subjective identity, anatomy, tone, or forbidden-text review.
Run it after ``scripts/process-art.py`` has produced the complete JC batch:

    python scripts/validate-jc-art.py
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import sys

from PIL import Image, UnidentifiedImageError


ROOT = Path(__file__).resolve().parents[1]
PUBLIC_ART = ROOT / "public" / "assets" / "art"
MAX_PRECACHE_BYTES = 8 * 1024 * 1024
SPRITE_SIZE = (768, 1152)
SCENE_SIZE = (1600, 900)


@dataclass(frozen=True)
class SpriteFamily:
    directory: str
    expressions: tuple[str, ...]
    target_height: int


SPRITE_FAMILIES = (
    SpriteFamily(
        "aleem-jc",
        (
            "neutral",
            "smile",
            "nervous",
            "uncertain",
            "focused",
            "tired",
            "hurt",
            "relieved",
        ),
        1050,
    ),
    SpriteFamily(
        "syafiqa",
        ("neutral", "smile", "amused", "sleepy", "attentive", "gentle-firm"),
        998,
    ),
    SpriteFamily(
        "mei-lin-jc",
        ("neutral", "supportive", "focused", "amused", "disappointed"),
        861,
    ),
    SpriteFamily(
        "aleem-casual",
        ("neutral", "smile", "patient", "frustrated"),
        1050,
    ),
    SpriteFamily(
        "mei-lin-casual",
        ("neutral", "smile", "animated", "guarded"),
        861,
    ),
)

BACKGROUNDS = (
    "bg-hdb-dining",
    "bg-jc-walkway",
    "bg-jc-classroom",
    "bg-bus-interior-morning",
    "bg-bus-interior-evening",
    "bg-jc-study-area",
    "bg-a-level-results",
    "bg-zoo-path",
    "bg-zoo-shelter",
)

CGS = ("cg-shared-earpiece", "cg-syafiqa-sighting", "cg-zoo-distance")

CHARACTER_SOURCES = (
    "aleem-jc-expression-master.png",
    "syafiqa-expression-master.png",
    "mei-lin-jc-expression-master.png",
    "aleem-zoo-expression-master.png",
    "mei-lin-zoo-expression-master.png",
    "mei-lin-zoo-relaxed-master.png",
)


def open_image(path: Path, errors: list[str]) -> Image.Image | None:
    try:
        image = Image.open(path)
        image.load()
        return image
    except (OSError, UnidentifiedImageError) as error:
        errors.append(f"cannot decode {path.relative_to(ROOT)}: {error}")
        return None


def inspect_size(
    path: Path,
    expected: tuple[int, int],
    errors: list[str],
    *,
    enforce_precache_limit: bool = True,
) -> None:
    if enforce_precache_limit and path.stat().st_size >= MAX_PRECACHE_BYTES:
        errors.append(
            f"{path.relative_to(ROOT)} is {path.stat().st_size} bytes; "
            f"expected less than {MAX_PRECACHE_BYTES}"
        )

    image = open_image(path, errors)
    if image is None:
        return
    with image:
        if image.size != expected:
            errors.append(
                f"{path.relative_to(ROOT)} is {image.size[0]}x{image.size[1]}; "
                f"expected {expected[0]}x{expected[1]}"
            )


def inspect_sprite(
    path: Path,
    target_height: int,
    errors: list[str],
    *,
    expected_size: tuple[int, int] = SPRITE_SIZE,
    expected_baseline: int = 1148,
    expected_centre: int = 384,
    height_tolerance: int = 24,
    centre_tolerance: int = 28,
    enforce_precache_limit: bool = True,
) -> None:
    inspect_size(
        path,
        expected_size,
        errors,
        enforce_precache_limit=enforce_precache_limit,
    )

    image = open_image(path, errors)
    if image is None:
        return
    with image:
        rgba = image.convert("RGBA")
        alpha = rgba.getchannel("A")
        alpha_extrema = alpha.getextrema()

        if alpha_extrema[0] != 0 or alpha_extrema[1] == 0:
            errors.append(
                f"{path.relative_to(ROOT)} lacks both transparent and visible pixels"
            )
            return

        corners = (
            alpha.getpixel((0, 0)),
            alpha.getpixel((expected_size[0] - 1, 0)),
            alpha.getpixel((0, expected_size[1] - 1)),
            alpha.getpixel((expected_size[0] - 1, expected_size[1] - 1)),
        )
        if any(corner != 0 for corner in corners):
            errors.append(f"{path.relative_to(ROOT)} has a nontransparent corner")

        bbox = alpha.getbbox()
        if bbox is None:
            errors.append(f"{path.relative_to(ROOT)} has an empty alpha bounding box")
            return

        left, top, right, bottom = bbox
        visible_height = bottom - top
        if abs(visible_height - target_height) > height_tolerance:
            errors.append(
                f"{path.relative_to(ROOT)} visible height is {visible_height}; "
                f"expected {target_height}±{height_tolerance}"
            )
        if abs(bottom - expected_baseline) > 4:
            errors.append(
                f"{path.relative_to(ROOT)} baseline is {bottom}; "
                f"expected {expected_baseline}±4"
            )
        horizontal_centre = (left + right) / 2
        if abs(horizontal_centre - expected_centre) > centre_tolerance:
            errors.append(
                f"{path.relative_to(ROOT)} alpha-box centre is "
                f"{horizontal_centre:.1f}; expected "
                f"{expected_centre}±{centre_tolerance}"
            )


def require(path: Path, errors: list[str]) -> bool:
    if path.is_file():
        return True
    errors.append(f"missing {path.relative_to(ROOT)}")
    return False


def main() -> int:
    errors: list[str] = []

    source_directory = ROOT / "art" / "sources" / "characters"
    for filename in CHARACTER_SOURCES:
        source_path = source_directory / filename
        if require(source_path, errors):
            image = open_image(source_path, errors)
            if image is None:
                continue
            with image:
                if image.format != "PNG":
                    errors.append(
                        f"{source_path.relative_to(ROOT)} is {image.format}; expected PNG"
                    )

    scene_source_ids = (*BACKGROUNDS, *CGS)
    for asset_id in scene_source_ids:
        source_path = ROOT / "art" / "sources" / f"{asset_id}-master.png"
        if not require(source_path, errors):
            continue
        image = open_image(source_path, errors)
        if image is None:
            continue
        with image:
            if image.format != "PNG":
                errors.append(
                    f"{source_path.relative_to(ROOT)} is {image.format}; expected PNG"
                )
            if image.size != (2048, 1152):
                errors.append(
                    f"{source_path.relative_to(ROOT)} is "
                    f"{image.size[0]}x{image.size[1]}; expected a 2048x1152 master"
                )

    for family in SPRITE_FAMILIES:
        for expression in family.expressions:
            normalized_path = (
                source_directory
                / "normalized"
                / family.directory
                / f"{expression}-master.png"
            )
            if require(normalized_path, errors):
                inspect_sprite(
                    normalized_path,
                    round(family.target_height * 4 / 3),
                    errors,
                    expected_size=(1024, 1536),
                    expected_baseline=1532,
                    expected_centre=512,
                    height_tolerance=32,
                    centre_tolerance=38,
                    enforce_precache_limit=False,
                )

            sprite_path = (
                PUBLIC_ART
                / "characters"
                / family.directory
                / f"{expression}.webp"
            )
            if require(sprite_path, errors):
                inspect_sprite(sprite_path, family.target_height, errors)

    for asset_id in BACKGROUNDS:
        path = PUBLIC_ART / "backgrounds" / f"{asset_id}.webp"
        if require(path, errors):
            inspect_size(path, SCENE_SIZE, errors)

    for asset_id in CGS:
        path = PUBLIC_ART / "cg" / f"{asset_id}.webp"
        if require(path, errors):
            inspect_size(path, SCENE_SIZE, errors)

    if errors:
        print("JC art physical validation failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print(
        "JC art physical validation passed: 27 sprites, 9 backgrounds, "
        "3 CGs, 27 normalized sprite masters, and 18 generation sources."
    )
    print(
        "Manual identity, anatomy, edge-composite, forbidden-text, and tone QA "
        "is recorded separately in art/prompts/jc-production.md."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
