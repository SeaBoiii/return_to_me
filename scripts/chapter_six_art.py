"""Deterministic, candidate-only Chapter 6 art processing contract.

This module deliberately does not extend ``SCHOOL_YEARS_BATCH`` in
``process-art.py``.  The approved Chapters 1-2 inventory remains locked while
the Before Nurul art moves through its own proof, processing, validation, QA,
and promotion gates.
"""

from __future__ import annotations

from collections import deque
from dataclasses import dataclass
import importlib.util
from pathlib import Path
import shutil
import sys
from types import ModuleType

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CANDIDATE_ROOT = ROOT / "art" / "candidates" / "chapter-six"
DEFAULT_PROCESSED_ROOT = DEFAULT_CANDIDATE_ROOT / "processed"
MASTER_SIZE = (1024, 1536)
DEPLOYED_SIZE = (768, 1152)
SCENE_MASTER_SIZE = (2048, 1152)
MASTER_BASELINE = 1532
MASTER_MAX_WIDTH = 992
DEPLOYED_BASELINE = 1149
PRECACHE_FILE_LIMIT = 8 * 1024 * 1024


@dataclass(frozen=True)
class ChapterSixSprite:
    family: str
    name: str
    deployed_height: int

    @property
    def asset_id(self) -> str:
        return f"{self.family}-{self.name}"

    @property
    def source(self) -> str:
        return f"{self.family}/{self.name}.png"

    @property
    def master_height(self) -> int:
        return round(self.deployed_height * MASTER_SIZE[1] / DEPLOYED_SIZE[1])


@dataclass(frozen=True)
class ChapterSixScene:
    asset_id: str
    category: str


def _sprites(
    family: str,
    names: tuple[str, ...],
    deployed_height: int,
) -> tuple[ChapterSixSprite, ...]:
    return tuple(ChapterSixSprite(family, name, deployed_height) for name in names)


CHAPTER_SIX_SPRITES = (
    *_sprites(
        "aleem-ns",
        ("neutral", "proud", "warm", "stunned", "hurt", "numb"),
        1050,
    ),
    *_sprites("aleem-raya", ("awed", "shy-smile"), 1050),
    *_sprites(
        "aleem-uni",
        ("neutral", "guarded", "frozen", "overwhelmed", "breathless"),
        1050,
    ),
    *_sprites(
        "nadiah",
        ("neutral", "warm", "amused", "thoughtful", "guarded"),
        1010,
    ),
)

CHAPTER_SIX_BACKGROUNDS = (
    "bg-raya-living-room-2016",
    "bg-ns-camp-gate",
    "bg-ns-bunk-night",
    "bg-university-lecture-theatre",
    "bg-university-corridor",
)

CHAPTER_SIX_CGS = (
    "cg-raya-first-sight",
    "cg-relationship-montage",
    "cg-close-friends-reveal",
)

CHAPTER_SIX_SCENES = (
    *(ChapterSixScene(asset_id, "backgrounds") for asset_id in CHAPTER_SIX_BACKGROUNDS),
    *(ChapterSixScene(asset_id, "cg") for asset_id in CHAPTER_SIX_CGS),
)

if len(CHAPTER_SIX_SPRITES) != 18:
    raise AssertionError("Chapter 6 sprite inventory must contain exactly 18 entries")
if len(CHAPTER_SIX_SCENES) != 8:
    raise AssertionError("Chapter 6 scene inventory must contain five backgrounds and three CGs")
if len({asset.asset_id for asset in CHAPTER_SIX_SPRITES}) != 18:
    raise AssertionError("Chapter 6 sprite IDs must be unique")
if len({asset.asset_id for asset in CHAPTER_SIX_SCENES}) != 8:
    raise AssertionError("Chapter 6 scene IDs must be unique")


def load_shared_pipeline() -> ModuleType:
    """Load the established normalization helpers without changing its batches."""

    path = ROOT / "scripts" / "process-art.py"
    spec = importlib.util.spec_from_file_location("return_to_me_shared_art", path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load shared art helpers from {path}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def _clear_hidden_rgb(image: Image.Image) -> Image.Image:
    pixels = np.asarray(image.convert("RGBA"), dtype=np.uint8).copy()
    pixels[pixels[..., 3] == 0, :3] = 0
    return Image.fromarray(pixels, mode="RGBA")


def _has_source_alpha(image: Image.Image) -> bool:
    minimum, maximum = image.convert("RGBA").getchannel("A").getextrema()
    if maximum == 0:
        raise ValueError("Sprite source is completely transparent")
    return minimum < 255


def _normalize_alpha_sprite(image: Image.Image, target_height: int) -> Image.Image:
    """Place an already-matted sprite on the shared production canvas.

    This mirrors the established geometry while preserving genuine alpha and
    legitimate olive/teal clothing colours that must never be treated as a
    chroma key.
    """

    alpha = np.asarray(image.getchannel("A"), dtype=np.uint8)
    ys, xs = np.nonzero(alpha >= 8)
    if not len(xs):
        raise ValueError("Sprite matting produced an empty subject")
    bbox = (int(xs.min()), int(ys.min()), int(xs.max() + 1), int(ys.max() + 1))
    subject = _clear_hidden_rgb(image.crop(bbox))
    scale = target_height / subject.height
    if round(subject.width * scale) > MASTER_MAX_WIDTH:
        scale = MASTER_MAX_WIDTH / subject.width
    width = max(1, round(subject.width * scale))
    height = max(1, round(subject.height * scale))
    subject = (
        subject.convert("RGBa")
        .resize((width, height), Image.Resampling.LANCZOS)
        .convert("RGBA")
    )
    subject = _clear_hidden_rgb(subject)
    canvas = Image.new("RGBA", MASTER_SIZE, (0, 0, 0, 0))
    x = (MASTER_SIZE[0] - width) // 2
    y = MASTER_BASELINE - height
    if y < 0:
        raise ValueError(f"Normalized sprite height {height} exceeds the master canvas")
    canvas.alpha_composite(subject, (x, y))
    return _clear_hidden_rgb(canvas)


def _prepare_sprite(source: Path, pipeline: ModuleType) -> Image.Image:
    with Image.open(source) as opened:
        opened.load()
        if opened.format != "PNG":
            raise ValueError(f"{source} is {opened.format}; expected PNG")
        if _has_source_alpha(opened):
            return _clear_hidden_rgb(opened.convert("RGBA"))
        return pipeline.chroma_matte(opened.convert("RGB"))


def _save_sprite_candidate(
    source: Path,
    asset: ChapterSixSprite,
    master_root: Path,
    deployed_root: Path,
    pipeline: ModuleType,
) -> None:
    prepared = _prepare_sprite(source, pipeline)
    master = _normalize_alpha_sprite(prepared, asset.master_height)
    master_path = master_root / asset.family / f"{asset.name}-master.png"
    deployed_path = deployed_root / asset.family / f"{asset.name}.webp"
    master_path.parent.mkdir(parents=True, exist_ok=True)
    deployed_path.parent.mkdir(parents=True, exist_ok=True)
    master.save(master_path, "PNG", optimize=True)
    deployed = (
        master.convert("RGBa")
        .resize(DEPLOYED_SIZE, Image.Resampling.LANCZOS)
        .convert("RGBA")
    )
    deployed = _clear_hidden_rgb(deployed)
    deployed.save(deployed_path, "WEBP", lossless=True, method=6)
    print(f"Wrote {master_path} ({MASTER_SIZE[0]}x{MASTER_SIZE[1]})")
    print(f"Wrote {deployed_path} ({DEPLOYED_SIZE[0]}x{DEPLOYED_SIZE[1]})")


def process_chapter_six_art(
    candidate_root: Path = DEFAULT_CANDIDATE_ROOT,
    processed_root: Path = DEFAULT_PROCESSED_ROOT,
) -> None:
    """Build Chapter 6 masters and deploy-shaped candidates without promotion."""

    pipeline = load_shared_pipeline()
    master_root = processed_root / "masters"
    deployed_root = processed_root / "deploy" / "assets" / "art"

    missing_sprites = [
        candidate_root / "characters" / asset.source
        for asset in CHAPTER_SIX_SPRITES
        if not (candidate_root / "characters" / asset.source).is_file()
    ]
    missing_scenes = [
        candidate_root / "scenes" / asset.category / f"{asset.asset_id}.png"
        for asset in CHAPTER_SIX_SCENES
        if not (
            candidate_root / "scenes" / asset.category / f"{asset.asset_id}.png"
        ).is_file()
    ]
    missing = (*missing_sprites, *missing_scenes)
    if missing:
        joined = "\n  ".join(str(path) for path in missing)
        raise FileNotFoundError(f"Chapter 6 candidate inputs are missing:\n  {joined}")

    for asset in CHAPTER_SIX_SPRITES:
        _save_sprite_candidate(
            candidate_root / "characters" / asset.source,
            asset,
            master_root / "characters",
            deployed_root / "characters",
            pipeline,
        )
    for asset in CHAPTER_SIX_SCENES:
        pipeline._save_scene_candidate(
            candidate_root / "scenes" / asset.category / f"{asset.asset_id}.png",
            master_root / asset.category / f"{asset.asset_id}-master.png",
            deployed_root / asset.category / f"{asset.asset_id}.webp",
        )
    print("Processed Chapter 6 candidate batch: 18 sprites, 5 backgrounds, and 3 CGs.")


def _relative_inventory(root: Path, suffixes: tuple[str, ...]) -> set[str]:
    if not root.is_dir():
        return set()
    return {
        path.relative_to(root).as_posix()
        for path in root.rglob("*")
        if path.is_file() and path.suffix.lower() in suffixes
    }


def _assert_exact_inventory(
    root: Path,
    expected: set[str],
    suffixes: tuple[str, ...],
    label: str,
) -> None:
    actual = _relative_inventory(root, suffixes)
    missing = sorted(expected - actual)
    unexpected = sorted(actual - expected)
    if missing or unexpected:
        details: list[str] = []
        if missing:
            details.append("missing: " + ", ".join(missing))
        if unexpected:
            details.append("unexpected/orphaned: " + ", ".join(unexpected))
        raise AssertionError(f"{label} inventory mismatch ({'; '.join(details)})")


def _border_samples(rgb: np.ndarray, thickness: int = 3) -> np.ndarray:
    return np.concatenate(
        (
            rgb[:thickness, :, :].reshape(-1, 3),
            rgb[-thickness:, :, :].reshape(-1, 3),
            rgb[:, :thickness, :].reshape(-1, 3),
            rgb[:, -thickness:, :].reshape(-1, 3),
        )
    )


def _inspect_source_sprite(path: Path) -> None:
    with Image.open(path) as opened:
        opened.load()
        if opened.format != "PNG":
            raise AssertionError(f"{path} is {opened.format}; expected PNG")
        if opened.width < 768 or opened.height < 900:
            raise AssertionError(f"{path} is too small for a sprite source: {opened.size}")
        if _has_source_alpha(opened):
            alpha = opened.convert("RGBA").getchannel("A")
            if alpha.getextrema()[1] != 255:
                raise AssertionError(f"{path} must include fully opaque subject pixels")
            corners = (
                alpha.getpixel((0, 0)),
                alpha.getpixel((opened.width - 1, 0)),
                alpha.getpixel((0, opened.height - 1)),
                alpha.getpixel((opened.width - 1, opened.height - 1)),
            )
            if any(corners):
                raise AssertionError(f"{path} alpha source has opaque corners: {corners}")
            return
        rgb = np.asarray(opened.convert("RGB"), dtype=np.uint8)
        key = np.median(_border_samples(rgb), axis=0)
        if not (key[0] >= 170 and key[2] >= 140 and key[1] <= 115):
            raise AssertionError(
                f"{path} must have genuine alpha or a vivid magenta border key; "
                f"median border RGB is ({key[0]:.0f}, {key[1]:.0f}, {key[2]:.0f})"
            )


def _component_sizes(mask: np.ndarray) -> list[int]:
    height, width = mask.shape
    seen = np.zeros(mask.shape, dtype=np.uint8)
    sizes: list[int] = []
    for start_y, start_x in zip(*np.nonzero(mask)):
        if seen[start_y, start_x]:
            continue
        queue: deque[tuple[int, int]] = deque([(int(start_y), int(start_x))])
        seen[start_y, start_x] = 1
        size = 0
        while queue:
            y, x = queue.popleft()
            size += 1
            if y and mask[y - 1, x] and not seen[y - 1, x]:
                seen[y - 1, x] = 1
                queue.append((y - 1, x))
            if y + 1 < height and mask[y + 1, x] and not seen[y + 1, x]:
                seen[y + 1, x] = 1
                queue.append((y + 1, x))
            if x and mask[y, x - 1] and not seen[y, x - 1]:
                seen[y, x - 1] = 1
                queue.append((y, x - 1))
            if x + 1 < width and mask[y, x + 1] and not seen[y, x + 1]:
                seen[y, x + 1] = 1
                queue.append((y, x + 1))
        sizes.append(size)
    return sorted(sizes, reverse=True)


def _visible_bbox(image: Image.Image, threshold: int = 16) -> tuple[int, int, int, int]:
    alpha = np.asarray(image.getchannel("A"), dtype=np.uint8)
    ys, xs = np.nonzero(alpha >= threshold)
    if not len(xs):
        raise AssertionError("Processed sprite has no visible pixels")
    return int(xs.min()), int(ys.min()), int(xs.max() + 1), int(ys.max() + 1)


def _inspect_processed_sprite(
    path: Path,
    expected_format: str,
    expected_size: tuple[int, int],
    expected_height: int,
    expected_baseline: int,
    height_tolerance: int,
    centre_tolerance: int,
) -> None:
    if not path.is_file():
        raise FileNotFoundError(path)
    with Image.open(path) as opened:
        opened.load()
        if opened.format != expected_format:
            raise AssertionError(f"{path} is {opened.format}; expected {expected_format}")
        if opened.size != expected_size:
            raise AssertionError(f"{path} is {opened.size}; expected {expected_size}")
        if "A" not in opened.getbands():
            raise AssertionError(f"{path} has no alpha channel")
        image = opened.convert("RGBA")

    alpha = np.asarray(image.getchannel("A"), dtype=np.uint8)
    if int(alpha.min()) != 0 or int(alpha.max()) != 255:
        raise AssertionError(f"{path} must contain transparent and opaque pixels")
    corners = (
        int(alpha[0, 0]),
        int(alpha[0, -1]),
        int(alpha[-1, 0]),
        int(alpha[-1, -1]),
    )
    if any(corners):
        raise AssertionError(f"{path} does not have transparent corners: {corners}")

    bbox = _visible_bbox(image)
    left, top, right, bottom = bbox
    visible_height = bottom - top
    if abs(visible_height - expected_height) > height_tolerance:
        raise AssertionError(
            f"{path} visible height is {visible_height}; expected "
            f"{expected_height}+/-{height_tolerance}"
        )
    if abs(bottom - expected_baseline) > 5:
        raise AssertionError(
            f"{path} baseline is {bottom}; expected {expected_baseline}+/-5"
        )
    centre = (left + right) / 2
    if abs(centre - expected_size[0] / 2) > centre_tolerance:
        raise AssertionError(
            f"{path} alpha-box centre is {centre:.1f}; expected "
            f"{expected_size[0] / 2:.1f}+/-{centre_tolerance}"
        )
    if right - left > expected_size[0] - round(expected_size[0] / 32):
        raise AssertionError(f"{path} exceeds the horizontal sprite safe area")

    visible_components = _component_sizes(alpha >= 16)
    detached_total = sum(visible_components[1:])
    detached_largest = visible_components[1] if len(visible_components) > 1 else 0
    if detached_total > 256 or detached_largest > 64:
        raise AssertionError(
            f"{path} has detached alpha remnants: {detached_total} pixels, "
            f"largest component {detached_largest}"
        )

    rgba = np.asarray(image, dtype=np.uint8)
    red = rgba[..., 0].astype(np.int16)
    green = rgba[..., 1].astype(np.int16)
    blue = rgba[..., 2].astype(np.int16)
    fringe = (
        (alpha > 0)
        & (alpha < 224)
        & (np.minimum(red, blue) - green > 38)
        & (red > 110)
        & (blue > 90)
    )
    if int(fringe.sum()) > 180:
        raise AssertionError(f"{path} retains a visible magenta matte fringe")
    if path.stat().st_size >= PRECACHE_FILE_LIMIT:
        raise AssertionError(f"{path} exceeds the 8 MiB per-file precache limit")


def _inspect_scene(path: Path, size: tuple[int, int], expected_format: str) -> None:
    if not path.is_file():
        raise FileNotFoundError(path)
    with Image.open(path) as opened:
        opened.load()
        if opened.format != expected_format:
            raise AssertionError(f"{path} is {opened.format}; expected {expected_format}")
        if opened.size != size:
            raise AssertionError(f"{path} is {opened.size}; expected {size}")
    if path.stat().st_size >= PRECACHE_FILE_LIMIT:
        raise AssertionError(f"{path} exceeds the 8 MiB per-file precache limit")


def validate_chapter_six_art(
    candidate_root: Path = DEFAULT_CANDIDATE_ROOT,
    processed_root: Path = DEFAULT_PROCESSED_ROOT,
) -> None:
    """Validate exact Chapter 6 inputs and all deterministic outputs."""

    sprite_source_root = candidate_root / "characters"
    scene_source_root = candidate_root / "scenes"
    master_root = processed_root / "masters"
    deployed_root = processed_root / "deploy" / "assets" / "art"

    _assert_exact_inventory(
        sprite_source_root,
        {asset.source for asset in CHAPTER_SIX_SPRITES},
        (".png",),
        "Chapter 6 sprite candidate",
    )
    _assert_exact_inventory(
        scene_source_root / "backgrounds",
        {f"{asset_id}.png" for asset_id in CHAPTER_SIX_BACKGROUNDS},
        (".png",),
        "Chapter 6 background candidate",
    )
    _assert_exact_inventory(
        scene_source_root / "cg",
        {f"{asset_id}.png" for asset_id in CHAPTER_SIX_CGS},
        (".png",),
        "Chapter 6 CG candidate",
    )
    _assert_exact_inventory(
        master_root / "characters",
        {
            f"{asset.family}/{asset.name}-master.png"
            for asset in CHAPTER_SIX_SPRITES
        },
        (".png",),
        "Chapter 6 normalized sprite master",
    )
    _assert_exact_inventory(
        deployed_root / "characters",
        {f"{asset.family}/{asset.name}.webp" for asset in CHAPTER_SIX_SPRITES},
        (".png", ".webp"),
        "Chapter 6 deploy-shaped sprite",
    )
    for category, asset_ids in (
        ("backgrounds", CHAPTER_SIX_BACKGROUNDS),
        ("cg", CHAPTER_SIX_CGS),
    ):
        _assert_exact_inventory(
            master_root / category,
            {f"{asset_id}-master.png" for asset_id in asset_ids},
            (".png",),
            f"Chapter 6 {category} master",
        )
        _assert_exact_inventory(
            deployed_root / category,
            {f"{asset_id}.webp" for asset_id in asset_ids},
            (".png", ".webp"),
            f"Chapter 6 deploy-shaped {category}",
        )

    for asset in CHAPTER_SIX_SPRITES:
        _inspect_source_sprite(sprite_source_root / asset.source)
        _inspect_processed_sprite(
            master_root / "characters" / asset.family / f"{asset.name}-master.png",
            "PNG",
            MASTER_SIZE,
            asset.master_height,
            MASTER_BASELINE,
            14,
            20,
        )
        _inspect_processed_sprite(
            deployed_root / "characters" / asset.family / f"{asset.name}.webp",
            "WEBP",
            DEPLOYED_SIZE,
            asset.deployed_height,
            DEPLOYED_BASELINE,
            12,
            16,
        )

    for asset in CHAPTER_SIX_SCENES:
        source = scene_source_root / asset.category / f"{asset.asset_id}.png"
        with Image.open(source) as opened:
            opened.load()
            if opened.format != "PNG":
                raise AssertionError(f"{source} is {opened.format}; expected PNG")
            if opened.width < 1600 or opened.height < 900:
                raise AssertionError(f"{source} is too small for a scene source: {opened.size}")
        _inspect_scene(
            master_root / asset.category / f"{asset.asset_id}-master.png",
            SCENE_MASTER_SIZE,
            "PNG",
        )
        _inspect_scene(
            deployed_root / asset.category / f"{asset.asset_id}.webp",
            (1600, 900),
            "WEBP",
        )

    print(
        "Chapter 6 art validation passed: 18 sprites, 5 backgrounds, 3 CGs, "
        "26 normalized masters, and 26 deploy-shaped candidates."
    )


def promote_chapter_six_art(
    candidate_root: Path = DEFAULT_CANDIDATE_ROOT,
    processed_root: Path = DEFAULT_PROCESSED_ROOT,
) -> None:
    """Copy only the approved Chapter 6 inventory into canonical/public trees."""

    validate_chapter_six_art(candidate_root, processed_root)
    master_root = processed_root / "masters"
    deployed_root = processed_root / "deploy" / "assets" / "art"
    canonical_sprite_root = ROOT / "art" / "sources" / "characters" / "normalized"
    public_root = ROOT / "public" / "assets" / "art"

    for asset in CHAPTER_SIX_SPRITES:
        canonical = (
            canonical_sprite_root / asset.family / f"{asset.name}-master.png"
        )
        public = public_root / "characters" / asset.family / f"{asset.name}.webp"
        canonical.parent.mkdir(parents=True, exist_ok=True)
        public.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(
            master_root / "characters" / asset.family / f"{asset.name}-master.png",
            canonical,
        )
        shutil.copy2(
            deployed_root / "characters" / asset.family / f"{asset.name}.webp",
            public,
        )
    for asset in CHAPTER_SIX_SCENES:
        canonical = ROOT / "art" / "sources" / f"{asset.asset_id}-master.png"
        public = public_root / asset.category / f"{asset.asset_id}.webp"
        public.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(
            master_root / asset.category / f"{asset.asset_id}-master.png",
            canonical,
        )
        shutil.copy2(
            deployed_root / asset.category / f"{asset.asset_id}.webp",
            public,
        )
    print("Promoted exactly 26 approved Chapter 6 assets to canonical and public trees.")
