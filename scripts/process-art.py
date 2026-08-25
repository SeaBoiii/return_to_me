"""Deterministic local post-processing for generated visual-novel artwork.

The legacy ``split-sheet`` and ``background`` commands are intentionally kept
small and backwards compatible. The named ``jc`` and ``school-years`` batches
share the same deterministic normalisation primitives. School Years output is
candidate-only by default: it is written below ``art/candidates`` and never to
``art/sources`` or ``public``.
"""

from __future__ import annotations

import argparse
from collections import deque
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter


MASTER_SIZE = (1024, 1536)
DEPLOYED_SIZE = (768, 1152)
SCENE_MASTER_SIZE = (2048, 1152)
MASTER_BASELINE = 1532  # bbox bottom (exclusive): four transparent pixels remain.
MASTER_MAX_WIDTH = 992


@dataclass(frozen=True)
class SpriteSheet:
    source: str
    family: str
    columns: int
    names: tuple[str | None, ...]
    target_height: int


@dataclass(frozen=True)
class SpriteAsset:
    """One independently generated chroma-key sprite candidate."""

    source: str
    family: str
    name: str
    deployed_height: int

    @property
    def master_height(self) -> int:
        return round(self.deployed_height * MASTER_SIZE[1] / DEPLOYED_SIZE[1])


@dataclass(frozen=True)
class SceneAsset:
    """One background or CG and the root from which its source is resolved."""

    asset_id: str
    category: str
    source_group: str


@dataclass(frozen=True)
class ArtBatch:
    """Stable physical inventory for an independently processed art release."""

    name: str
    sprites: tuple[SpriteAsset, ...]
    scenes: tuple[SceneAsset, ...]
    sprite_sheets: tuple[SpriteSheet, ...] = ()


JC_SPRITE_SHEETS = (
    SpriteSheet(
        "aleem-jc-expression-master.png",
        "aleem-jc",
        4,
        (
            "neutral",
            "smile",
            "nervous",
            "uncertain",
            "hurt",
            "focused",
            "tired",
            "relieved",
        ),
        1400,
    ),
    SpriteSheet(
        "syafiqa-expression-master.png",
        "syafiqa",
        3,
        ("neutral", "smile", "amused", "sleepy", "attentive", "gentle-firm"),
        1331,
    ),
    SpriteSheet(
        "mei-lin-jc-expression-master.png",
        "mei-lin-jc",
        3,
        ("neutral", "focused", "supportive", "amused", "disappointed", None),
        1148,
    ),
    SpriteSheet(
        "aleem-zoo-expression-master.png",
        "aleem-casual",
        2,
        ("neutral", "smile", "frustrated", "patient"),
        1400,
    ),
    SpriteSheet(
        "mei-lin-zoo-expression-master.png",
        "mei-lin-casual",
        2,
        ("guarded", None, "animated", "neutral"),
        1148,
    ),
)


JC_SCENES = (
    ("bg-hdb-dining", "backgrounds"),
    ("bg-jc-walkway", "backgrounds"),
    ("bg-jc-classroom", "backgrounds"),
    ("bg-bus-interior-morning", "backgrounds"),
    ("bg-bus-interior-evening", "backgrounds"),
    ("bg-jc-study-area", "backgrounds"),
    ("bg-a-level-results", "backgrounds"),
    ("bg-zoo-path", "backgrounds"),
    ("bg-zoo-shelter", "backgrounds"),
    ("cg-shared-earpiece", "cg"),
    ("cg-syafiqa-sighting", "cg"),
    ("cg-zoo-distance", "cg"),
)


def _sprite_assets(
    family: str,
    names: tuple[str, ...],
    deployed_height: int,
) -> tuple[SpriteAsset, ...]:
    return tuple(
        SpriteAsset(
            source=f"{family}/{name}.png",
            family=family,
            name=name,
            deployed_height=deployed_height,
        )
        for name in names
    )


SCHOOL_YEARS_SPRITES = (
    *_sprite_assets(
        "aleem-p6",
        ("neutral", "smile", "cheerful", "surprised", "nervous", "reflective"),
        900,
    ),
    *_sprite_assets(
        "alya",
        ("neutral", "smile", "playful", "shy", "hopeful"),
        930,
    ),
    *_sprite_assets(
        "aleem-young-home",
        ("neutral", "smile", "waiting", "startled", "hurt"),
        900,
    ),
    *_sprite_assets(
        "alya-young-home",
        ("startled", "apologetic", "sad"),
        930,
    ),
    *_sprite_assets(
        "aleem-sec",
        (
            "neutral",
            "nervous",
            "smile",
            "embarrassed",
            "confused",
            "defensive",
            "guilty",
            "tired",
            "devastated",
        ),
        1020,
    ),
    *_sprite_assets(
        "aleem-home",
        ("focused", "proud", "distracted", "overwhelmed", "regretful", "numb"),
        1020,
    ),
    *_sprite_assets(
        "hana",
        (
            "neutral",
            "curious",
            "shy",
            "smile",
            "supportive",
            "concerned",
            "disappointed",
            "distant",
            "apologetic",
        ),
        1000,
    ),
    *_sprite_assets(
        "faris",
        ("neutral", "teasing", "encouraging", "confident"),
        850,
    ),
)

SCHOOL_YEARS_RETAINED_BACKGROUNDS = (
    "bg-primary-classroom",
    "bg-primary-corridor",
    "bg-graduation-gate",
    "bg-bus-stop",
    "bg-bedroom-2009",
    "bg-boys-classroom",
    "bg-language-classroom",
    "bg-language-courtyard",
    "bg-bedroom-pc-day",
    "bg-bedroom-pc-night",
    "bg-exam-hall",
    "bg-dark-bedroom",
)

SCHOOL_YEARS_CANDIDATE_BACKGROUNDS = (
    "bg-primary-canteen",
    "bg-bedroom-2009-warm",
    "bg-alya-bedroom-2010",
    "bg-boys-school-corridor",
    "bg-boys-classroom-overcast",
    "bg-language-classroom-late",
    "bg-language-corridor-rain",
    "bg-results-hall",
)

SCHOOL_YEARS_CGS = (
    "cg-wrong-message",
    "cg-first-confession",
    "cg-graduation-promise",
    "cg-server-night",
    "cg-results",
    "cg-faris-wingman",
    "cg-hana-breakup",
    "cg-o-level-exam",
)

JC_BATCH = ArtBatch(
    name="jc",
    sprites=(),
    sprite_sheets=JC_SPRITE_SHEETS,
    scenes=tuple(SceneAsset(asset_id, category, "retained") for asset_id, category in JC_SCENES),
)

SCHOOL_YEARS_BATCH = ArtBatch(
    name="school-years",
    sprites=SCHOOL_YEARS_SPRITES,
    scenes=(
        *(
            SceneAsset(asset_id, "backgrounds", "retained")
            for asset_id in SCHOOL_YEARS_RETAINED_BACKGROUNDS
        ),
        *(
            SceneAsset(asset_id, "backgrounds", "candidate")
            for asset_id in SCHOOL_YEARS_CANDIDATE_BACKGROUNDS
        ),
        *(SceneAsset(asset_id, "cg", "candidate") for asset_id in SCHOOL_YEARS_CGS),
    ),
)

ART_BATCHES = {batch.name: batch for batch in (JC_BATCH, SCHOOL_YEARS_BATCH)}

if len(SCHOOL_YEARS_BATCH.sprites) != 47:
    raise AssertionError("School Years sprite inventory must contain exactly 47 entries")
if len(SCHOOL_YEARS_BATCH.scenes) != 28:
    raise AssertionError("School Years scene inventory must contain 20 backgrounds and 8 CGs")


def split_sheet(source: Path, destination: Path, names: list[str], columns: int) -> None:
    """Legacy lossless sheet splitter (kept for the original art workflow)."""

    image = Image.open(source).convert("RGBA")
    rows = (len(names) + columns - 1) // columns
    cell_width = image.width // columns
    cell_height = image.height // rows
    destination.mkdir(parents=True, exist_ok=True)

    for index, name in enumerate(names):
        column = index % columns
        row = index // columns
        left = column * cell_width
        top = row * cell_height
        cell = image.crop((left, top, left + cell_width, top + cell_height))
        output = destination / f"{name}.webp"
        cell.save(output, "WEBP", lossless=True, method=6)
        print(f"Wrote {output} ({cell.width}x{cell.height})")


def background(source: Path, destination: Path) -> None:
    """Crop an image centrally to 16:9 and encode a 1600x900 WebP."""

    image = Image.open(source).convert("RGB")
    target_ratio = 16 / 9
    source_ratio = image.width / image.height
    if source_ratio > target_ratio:
        width = round(image.height * target_ratio)
        left = (image.width - width) // 2
        image = image.crop((left, 0, left + width, image.height))
    elif source_ratio < target_ratio:
        height = round(image.width / target_ratio)
        top = (image.height - height) // 2
        image = image.crop((0, top, image.width, top + height))
    image = image.resize((1600, 900), Image.Resampling.LANCZOS)
    destination.parent.mkdir(parents=True, exist_ok=True)
    image.save(destination, "WEBP", quality=86, method=6)
    print(f"Wrote {destination} (1600x900)")


def normalize_scene_image(image: Image.Image) -> Image.Image:
    """Return a centrally cropped 2048x1152 RGB scene master."""

    image = image.convert("RGB")
    target_ratio = SCENE_MASTER_SIZE[0] / SCENE_MASTER_SIZE[1]
    source_ratio = image.width / image.height
    if source_ratio > target_ratio:
        width = round(image.height * target_ratio)
        left = (image.width - width) // 2
        image = image.crop((left, 0, left + width, image.height))
    elif source_ratio < target_ratio:
        height = round(image.width / target_ratio)
        top = (image.height - height) // 2
        image = image.crop((0, top, image.width, top + height))
    if image.size != SCENE_MASTER_SIZE:
        image = image.resize(SCENE_MASTER_SIZE, Image.Resampling.LANCZOS)
    return image


def normalize_scene_master(source: Path) -> None:
    """Normalise a generated JC scene source in place to the 2048x1152 master."""

    image = Image.open(source).convert("RGB")
    if image.size == SCENE_MASTER_SIZE:
        return
    image = normalize_scene_image(image)
    image.save(source, "PNG", optimize=True)
    print(f"Normalised {source} ({SCENE_MASTER_SIZE[0]}x{SCENE_MASTER_SIZE[1]})")


def _hsv(rgb: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Vectorised RGB-to-HSV; hue is returned in degrees."""

    values = rgb.astype(np.float32) / 255.0
    red, green, blue = values[..., 0], values[..., 1], values[..., 2]
    maximum = values.max(axis=2)
    minimum = values.min(axis=2)
    delta = maximum - minimum
    saturation = np.divide(
        delta,
        maximum,
        out=np.zeros_like(delta),
        where=maximum > 0,
    )
    hue = np.zeros_like(maximum)
    nonzero = delta > 1e-6
    red_max = nonzero & (maximum == red)
    green_max = nonzero & (maximum == green)
    blue_max = nonzero & (maximum == blue)
    hue[red_max] = 60 * np.mod((green[red_max] - blue[red_max]) / delta[red_max], 6)
    hue[green_max] = 60 * (((blue[green_max] - red[green_max]) / delta[green_max]) + 2)
    hue[blue_max] = 60 * (((red[blue_max] - green[blue_max]) / delta[blue_max]) + 4)
    return hue, saturation, maximum


def _border_samples(rgb: np.ndarray, thickness: int = 3) -> np.ndarray:
    return np.concatenate(
        (
            rgb[:thickness, :, :].reshape(-1, 3),
            rgb[-thickness:, :, :].reshape(-1, 3),
            rgb[:, :thickness, :].reshape(-1, 3),
            rgb[:, -thickness:, :].reshape(-1, 3),
        )
    )


def _connected_mask(candidate: np.ndarray, seeds: np.ndarray) -> np.ndarray:
    """Return candidate pixels four-connected to a strict border seed."""

    height, width = candidate.shape
    connected = np.zeros((height, width), dtype=np.uint8)
    queue: deque[tuple[int, int]] = deque()

    border_seed = candidate & seeds
    for x in np.flatnonzero(border_seed[0]):
        connected[0, x] = 1
        queue.append((0, int(x)))
    if height > 1:
        for x in np.flatnonzero(border_seed[-1]):
            connected[-1, x] = 1
            queue.append((height - 1, int(x)))
    for y in range(1, height - 1):
        if border_seed[y, 0]:
            connected[y, 0] = 1
            queue.append((y, 0))
        if width > 1 and border_seed[y, -1]:
            connected[y, -1] = 1
            queue.append((y, width - 1))

    while queue:
        y, x = queue.popleft()
        if y and candidate[y - 1, x] and not connected[y - 1, x]:
            connected[y - 1, x] = 1
            queue.append((y - 1, x))
        if y + 1 < height and candidate[y + 1, x] and not connected[y + 1, x]:
            connected[y + 1, x] = 1
            queue.append((y + 1, x))
        if x and candidate[y, x - 1] and not connected[y, x - 1]:
            connected[y, x - 1] = 1
            queue.append((y, x - 1))
        if x + 1 < width and candidate[y, x + 1] and not connected[y, x + 1]:
            connected[y, x + 1] = 1
            queue.append((y, x + 1))

    return connected.astype(bool)


def _largest_component(mask: np.ndarray) -> np.ndarray:
    """Keep the largest four-connected component in a boolean mask."""

    height, width = mask.shape
    seen = np.zeros(mask.shape, dtype=np.uint8)
    largest: list[tuple[int, int]] = []
    for start_y, start_x in zip(*np.nonzero(mask)):
        if seen[start_y, start_x]:
            continue
        queue: deque[tuple[int, int]] = deque([(int(start_y), int(start_x))])
        seen[start_y, start_x] = 1
        component: list[tuple[int, int]] = []
        while queue:
            y, x = queue.popleft()
            component.append((y, x))
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
        if len(component) > len(largest):
            largest = component

    output = np.zeros(mask.shape, dtype=bool)
    if largest:
        ys, xs = zip(*largest)
        output[np.asarray(ys), np.asarray(xs)] = True
    return output


def _bleed_edge_colours(
    rgb: np.ndarray,
    alpha: np.ndarray,
    connected_background: np.ndarray,
    key_candidate: np.ndarray,
) -> np.ndarray:
    """Replace contaminated fringe RGB with nearby clean foreground colours."""

    output = rgb.astype(np.float32)
    near_background = np.asarray(
        Image.fromarray((connected_background * 255).astype(np.uint8), mode="L").filter(
            ImageFilter.MaxFilter(9)
        )
    ) > 0
    replace = (alpha > 0) & ((alpha < 250) | (near_background & key_candidate))
    known = (alpha >= 250) & ~replace
    filled = output.copy()

    # The matte feather is only a few pixels wide. Repeated eight-neighbour
    # expansion supplies stable, non-key RGB underneath partially transparent
    # edge pixels without altering protected interior colours.
    for _ in range(8):
        target = replace & ~known
        if not target.any():
            break
        colour_sum = np.zeros_like(filled)
        neighbour_count = np.zeros(alpha.shape, dtype=np.float32)
        for dy, dx in (
            (-1, -1),
            (-1, 0),
            (-1, 1),
            (0, -1),
            (0, 1),
            (1, -1),
            (1, 0),
            (1, 1),
        ):
            shifted_known = np.roll(known, (dy, dx), axis=(0, 1))
            shifted_colour = np.roll(filled, (dy, dx), axis=(0, 1))
            if dy < 0:
                shifted_known[dy:, :] = False
            elif dy > 0:
                shifted_known[:dy, :] = False
            if dx < 0:
                shifted_known[:, dx:] = False
            elif dx > 0:
                shifted_known[:, :dx] = False
            colour_sum += shifted_colour * shifted_known[..., None]
            neighbour_count += shifted_known
        newly_known = target & (neighbour_count > 0)
        filled[newly_known] = colour_sum[newly_known] / neighbour_count[newly_known, None]
        known |= newly_known

    output[replace & known] = filled[replace & known]
    output[alpha == 0] = 0
    return np.clip(output, 0, 255).astype(np.uint8)


def chroma_matte(image: Image.Image) -> Image.Image:
    """Remove a magenta or green screen while preserving enclosed detail.

    A robust median of the outer border identifies the key. Tolerant removal is
    limited to pixels connected to strict key seeds; exact-key pockets enclosed
    by an arm or loose hair are also removed. This protects merely similar
    interior colours while retaining transparent holes in a pose. The resulting
    edge is feathered by roughly one pixel and its RGB is bled from clean
    foreground to prevent magenta/green halos on light or dark stages.
    """

    rgb = np.asarray(image.convert("RGB"), dtype=np.uint8)
    border = _border_samples(rgb)
    key = np.median(border, axis=0).astype(np.float32)
    key_image = np.uint8(np.clip(key, 0, 255)).reshape((1, 1, 3))
    key_hue, key_saturation, _ = _hsv(key_image)
    hue, saturation, value = _hsv(rgb)
    hue_distance = np.minimum(
        np.abs(hue - float(key_hue[0, 0])),
        360 - np.abs(hue - float(key_hue[0, 0])),
    )
    colour_distance = np.linalg.norm(rgb.astype(np.float32) - key, axis=2)

    red = rgb[..., 0].astype(np.int16)
    green = rgb[..., 1].astype(np.int16)
    blue = rgb[..., 2].astype(np.int16)
    green_key = key[1] > key[0] + 30 and key[1] > key[2] + 30
    if green_key:
        channel_shape = (green - red > 24) & (green - blue > 18)
    else:
        channel_shape = (red - green > 28) & (blue - green > 18)

    strict = (colour_distance <= 72) | (
        channel_shape
        & (hue_distance <= 20)
        & (saturation >= max(0.38, float(key_saturation[0, 0]) * 0.58))
        & (value >= 0.18)
    )
    tolerant = channel_shape & (hue_distance <= 52) & (saturation >= 0.32) & (value >= 0.12)
    tolerant |= colour_distance <= 108
    connected_background = _connected_mask(tolerant, strict)
    # Poses can completely enclose visible chroma (for example, the triangle
    # between an arm and torso), making it unreachable from the outer border.
    # Only strict matches seed those pockets; a short tolerant grow then clears
    # their antialiased perimeter without globally keying similar costume hues.
    connected_background |= strict
    for _ in range(4):
        expanded = np.asarray(
            Image.fromarray((connected_background * 255).astype(np.uint8), mode="L").filter(
                ImageFilter.MaxFilter(3)
            )
        ) > 0
        connected_background |= tolerant & expanded

    foreground_mask = _largest_component(~connected_background)
    foreground = Image.fromarray((foreground_mask * 255).astype(np.uint8), mode="L")
    # A restrained feather softens the generated antialias edge without
    # erasing fine hair or glasses. Tiny values are cleared deterministically.
    alpha = np.asarray(foreground.filter(ImageFilter.GaussianBlur(0.85))).copy()
    alpha[alpha < 5] = 0
    alpha[alpha > 250] = 255
    cleaned_rgb = _bleed_edge_colours(rgb, alpha, connected_background, tolerant)
    return Image.fromarray(np.dstack((cleaned_rgb, alpha)), mode="RGBA")


def _visible_bbox(image: Image.Image, threshold: int = 8) -> tuple[int, int, int, int]:
    alpha = np.asarray(image.getchannel("A"))
    ys, xs = np.nonzero(alpha >= threshold)
    if not len(xs):
        raise ValueError("Chroma matting produced an empty sprite")
    return int(xs.min()), int(ys.min()), int(xs.max() + 1), int(ys.max() + 1)


def normalize_sprite(image: Image.Image, target_height: int) -> Image.Image:
    """Place a matted sprite on the common 1024x1536 production canvas."""

    bbox = _visible_bbox(image)
    subject = image.crop(bbox)
    scale = target_height / subject.height
    if round(subject.width * scale) > MASTER_MAX_WIDTH:
        scale = MASTER_MAX_WIDTH / subject.width
    width = max(1, round(subject.width * scale))
    height = max(1, round(subject.height * scale))
    # Resize premultiplied RGBA so hidden key colour cannot leak back into the
    # feather through straight-alpha interpolation.
    subject = subject.convert("RGBa").resize((width, height), Image.Resampling.LANCZOS).convert("RGBA")

    canvas = Image.new("RGBA", MASTER_SIZE, (0, 0, 0, 0))
    x = (MASTER_SIZE[0] - width) // 2
    y = MASTER_BASELINE - height
    if y < 0:
        raise ValueError(f"Normalised sprite height {height} exceeds the master canvas")
    canvas.alpha_composite(subject, (x, y))
    pixels = np.asarray(canvas).copy()
    red = pixels[..., 0].astype(np.int16)
    green = pixels[..., 1].astype(np.int16)
    blue = pixels[..., 2].astype(np.int16)
    alpha = pixels[..., 3]
    strong_key = (
        (np.minimum(red, blue) - green > 35) & (red > 100) & (blue > 80)
    ) | (
        (np.minimum(green - red, green - blue) > 50) & (green > 100)
    )
    saturated_key_edge = strong_key | ((alpha < 96) & (
        ((red - green > 28) & (blue - green > 16) & (red > 80) & (blue > 60))
        | ((green - red > 35) & (green - blue > 28) & (green > 80))
    ))
    pixels[saturated_key_edge, 3] = 0
    kept = _largest_component(pixels[..., 3] >= 5)
    pixels[~kept] = 0
    pixels[pixels[..., 3] == 0, :3] = 0
    return Image.fromarray(pixels, mode="RGBA")


def _save_sprite(
    image: Image.Image,
    family: str,
    name: str,
    target_height: int,
    master_root: Path,
    deployed_root: Path,
) -> None:
    matted = chroma_matte(image)
    master = normalize_sprite(matted, target_height)
    master_path = master_root / family / f"{name}-master.png"
    deployed_path = deployed_root / family / f"{name}.webp"
    master_path.parent.mkdir(parents=True, exist_ok=True)
    deployed_path.parent.mkdir(parents=True, exist_ok=True)
    master.save(master_path, "PNG", optimize=True)
    deployed = master.convert("RGBa").resize(DEPLOYED_SIZE, Image.Resampling.LANCZOS).convert("RGBA")
    deployed_pixels = np.asarray(deployed).copy()
    red = deployed_pixels[..., 0].astype(np.int16)
    green = deployed_pixels[..., 1].astype(np.int16)
    blue = deployed_pixels[..., 2].astype(np.int16)
    alpha = deployed_pixels[..., 3]
    strong_key = (
        (np.minimum(red, blue) - green > 35) & (red > 100) & (blue > 80)
    ) | (
        (np.minimum(green - red, green - blue) > 50) & (green > 100)
    )
    saturated_key_edge = strong_key | ((alpha < 96) & (
        ((red - green > 28) & (blue - green > 16) & (red > 80) & (blue > 60))
        | ((green - red > 35) & (green - blue > 28) & (green > 80))
    ))
    deployed_pixels[saturated_key_edge, 3] = 0
    kept = _largest_component(deployed_pixels[..., 3] >= 5)
    deployed_pixels[~kept] = 0
    deployed_pixels[deployed_pixels[..., 3] == 0, :3] = 0
    deployed = Image.fromarray(deployed_pixels, mode="RGBA")
    deployed.save(deployed_path, "WEBP", lossless=True, method=6)

    master_bbox = _visible_bbox(master)
    deployed_bbox = _visible_bbox(deployed)
    print(
        f"Wrote {master_path} ({MASTER_SIZE[0]}x{MASTER_SIZE[1]}, "
        f"visible {master_bbox[2] - master_bbox[0]}x{master_bbox[3] - master_bbox[1]})"
    )
    print(
        f"Wrote {deployed_path} ({DEPLOYED_SIZE[0]}x{DEPLOYED_SIZE[1]}, "
        f"visible {deployed_bbox[2] - deployed_bbox[0]}x{deployed_bbox[3] - deployed_bbox[1]})"
    )


def process_jc_sprites(source_root: Path, master_root: Path, deployed_root: Path) -> None:
    """Process the approved five-sheet JC batch and Mei Lin smile correction."""

    expected = [source_root / sheet.source for sheet in JC_BATCH.sprite_sheets]
    expected.append(source_root / "mei-lin-zoo-relaxed-master.png")
    missing = [path for path in expected if not path.is_file()]
    if missing:
        joined = "\n  ".join(str(path) for path in missing)
        raise FileNotFoundError(f"JC sprite sources are missing:\n  {joined}")

    count = 0
    for spec in JC_BATCH.sprite_sheets:
        source = Image.open(source_root / spec.source).convert("RGB")
        rows = (len(spec.names) + spec.columns - 1) // spec.columns
        cell_width = source.width // spec.columns
        cell_height = source.height // rows
        for index, name in enumerate(spec.names):
            if name is None:
                continue
            column = index % spec.columns
            row = index // spec.columns
            cell = source.crop(
                (
                    column * cell_width,
                    row * cell_height,
                    (column + 1) * cell_width,
                    (row + 1) * cell_height,
                )
            )
            _save_sprite(
                cell,
                spec.family,
                name,
                spec.target_height,
                master_root,
                deployed_root,
            )
            count += 1

    relaxed = Image.open(source_root / "mei-lin-zoo-relaxed-master.png").convert("RGB")
    # The corrected source is a full-body portrait. Keep both hands while
    # removing the lower-leg area so its face/torso scale matches the approved
    # three-quarter casual sheet variants on the shared stature canvas.
    relaxed = relaxed.crop((0, 0, relaxed.width, round(relaxed.height * 0.75)))
    _save_sprite(
        relaxed,
        "mei-lin-casual",
        "smile",
        1148,
        master_root,
        deployed_root,
    )
    count += 1
    if count != 27:
        raise AssertionError(f"Expected 27 JC sprites, processed {count}")
    print(f"Processed {count} JC sprites")


def process_jc_scenes(source_root: Path, deployed_root: Path, skip_missing: bool) -> None:
    missing: list[Path] = []
    processed = 0
    for asset in JC_BATCH.scenes:
        asset_id, category = asset.asset_id, asset.category
        source = source_root / f"{asset_id}-master.png"
        if not source.is_file():
            missing.append(source)
            continue
        normalize_scene_master(source)
        background(source, deployed_root / category / f"{asset_id}.webp")
        processed += 1
    if missing and not skip_missing:
        joined = "\n  ".join(str(path) for path in missing)
        raise FileNotFoundError(f"JC scene sources are missing:\n  {joined}")
    if missing:
        print(f"Skipped {len(missing)} missing JC scene masters")
    print(f"Processed {processed} JC scenes")


def process_school_years_sprites(
    source_root: Path,
    master_root: Path,
    deployed_root: Path,
) -> None:
    """Process the 47 independent School Years sprite candidates."""

    missing = [
        source_root / asset.source
        for asset in SCHOOL_YEARS_BATCH.sprites
        if not (source_root / asset.source).is_file()
    ]
    if missing:
        joined = "\n  ".join(str(path) for path in missing)
        raise FileNotFoundError(f"School Years sprite candidates are missing:\n  {joined}")

    for asset in SCHOOL_YEARS_BATCH.sprites:
        source = Image.open(source_root / asset.source).convert("RGB")
        _save_sprite(
            source,
            asset.family,
            asset.name,
            asset.master_height,
            master_root,
            deployed_root,
        )
    print(f"Processed {len(SCHOOL_YEARS_BATCH.sprites)} School Years sprites")


def _save_scene_candidate(
    source: Path,
    master_path: Path,
    deployed_path: Path,
) -> None:
    """Write a normalized scene master and its deploy-shaped candidate."""

    master = normalize_scene_image(Image.open(source))
    master_path.parent.mkdir(parents=True, exist_ok=True)
    deployed_path.parent.mkdir(parents=True, exist_ok=True)
    master.save(master_path, "PNG", optimize=True)
    master.resize((1600, 900), Image.Resampling.LANCZOS).save(
        deployed_path,
        "WEBP",
        quality=86,
        method=6,
    )
    print(f"Wrote {master_path} (2048x1152)")
    print(f"Wrote {deployed_path} (1600x900)")


def process_school_years_scenes(
    candidate_source_root: Path,
    retained_source_root: Path,
    master_root: Path,
    deployed_root: Path,
) -> None:
    """Process 20 backgrounds and eight CGs without mutating either source root."""

    resolved: list[tuple[SceneAsset, Path]] = []
    for asset in SCHOOL_YEARS_BATCH.scenes:
        if asset.source_group == "retained":
            source = retained_source_root / f"{asset.asset_id}-master.png"
        elif asset.source_group == "candidate":
            source = candidate_source_root / asset.category / f"{asset.asset_id}.png"
        else:
            raise AssertionError(
                f"Unknown source group {asset.source_group!r} for {asset.asset_id}"
            )
        resolved.append((asset, source))

    missing = [source for _, source in resolved if not source.is_file()]
    if missing:
        joined = "\n  ".join(str(path) for path in missing)
        raise FileNotFoundError(f"School Years scene candidates are missing:\n  {joined}")

    for asset, source in resolved:
        _save_scene_candidate(
            source,
            master_root / asset.category / f"{asset.asset_id}-master.png",
            deployed_root / asset.category / f"{asset.asset_id}.webp",
        )
    print(f"Processed {len(SCHOOL_YEARS_BATCH.scenes)} School Years scenes")


def process_school_years_batch(
    candidate_root: Path,
    retained_source_root: Path,
    processed_root: Path,
) -> None:
    """Build the complete candidate-only School Years approval batch."""

    master_root = processed_root / "masters"
    deployed_root = processed_root / "deploy" / "assets" / "art"
    process_school_years_sprites(
        candidate_root / "characters",
        master_root / "characters",
        deployed_root / "characters",
    )
    process_school_years_scenes(
        candidate_root / "scenes",
        retained_source_root,
        master_root,
        deployed_root,
    )


def _assert_transparent_corners(image: Image.Image, path: Path) -> None:
    alpha = image.getchannel("A")
    corners = (
        alpha.getpixel((0, 0)),
        alpha.getpixel((image.width - 1, 0)),
        alpha.getpixel((0, image.height - 1)),
        alpha.getpixel((image.width - 1, image.height - 1)),
    )
    if any(corners):
        raise AssertionError(f"{path} does not have transparent corners: {corners}")


def _component_sizes(mask: np.ndarray) -> list[int]:
    """Return four-connected component sizes, largest first."""

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


def _assert_clean_matte(image: Image.Image, path: Path) -> None:
    """Reject residual key fields and detached opaque cell fragments."""

    rgba = np.asarray(image.convert("RGBA"))
    red = rgba[..., 0].astype(np.int16)
    green = rgba[..., 1].astype(np.int16)
    blue = rgba[..., 2].astype(np.int16)
    alpha = rgba[..., 3]
    visible = alpha >= 16
    magenta_residue = (
        visible
        & (np.minimum(red, blue) - green > 35)
        & (red > 100)
        & (blue > 80)
    )
    green_residue = (
        visible
        & (np.minimum(green - red, green - blue) > 50)
        & (green > 100)
    )
    residue = magenta_residue | green_residue
    residue_sizes = _component_sizes(residue)
    residue_total = int(residue.sum())
    residue_largest = residue_sizes[0] if residue_sizes else 0
    # A handful of isolated edge pixels can legitimately match this broad
    # colour test (skin highlights and small accessories). A chroma rectangle
    # is orders of magnitude larger, so both limits retain a generous margin.
    if residue_total > 600 or residue_largest > 96:
        raise AssertionError(
            f"{path} retains chroma-key colour: {residue_total} pixels, "
            f"largest component {residue_largest}"
        )

    visible_sizes = _component_sizes(visible)
    detached_total = sum(visible_sizes[1:])
    detached_largest = visible_sizes[1] if len(visible_sizes) > 1 else 0
    if detached_total > 256 or detached_largest > 64:
        raise AssertionError(
            f"{path} has detached alpha remnants: {detached_total} pixels, "
            f"largest component {detached_largest}"
        )


def validate_jc_art(master_root: Path, deployed_root: Path, scene_source_root: Path) -> None:
    """Validate dimensions, alpha, baseline, stature ratios, and scene files."""

    expected_sprites: list[tuple[str, str, int]] = []
    for spec in JC_BATCH.sprite_sheets:
        expected_sprites.extend(
            (spec.family, name, spec.target_height) for name in spec.names if name is not None
        )
    expected_sprites.append(("mei-lin-casual", "smile", 1148))
    if len(expected_sprites) != 27:
        raise AssertionError("JC sprite inventory must contain exactly 27 entries")

    for family, name, target_height in expected_sprites:
        master_path = master_root / family / f"{name}-master.png"
        deployed_path = deployed_root / family / f"{name}.webp"
        for path, expected_size in ((master_path, MASTER_SIZE), (deployed_path, DEPLOYED_SIZE)):
            if not path.is_file():
                raise FileNotFoundError(path)
            image = Image.open(path)
            if image.size != expected_size:
                raise AssertionError(f"{path} is {image.size}; expected {expected_size}")
            if "A" not in image.getbands():
                raise AssertionError(f"{path} has no alpha channel")
            _assert_transparent_corners(image, path)
            _assert_clean_matte(image, path)

        master = Image.open(master_path).convert("RGBA")
        deployed = Image.open(deployed_path).convert("RGBA")
        master_bbox = _visible_bbox(master, threshold=16)
        deployed_bbox = _visible_bbox(deployed, threshold=16)
        master_height = master_bbox[3] - master_bbox[1]
        deployed_height = deployed_bbox[3] - deployed_bbox[1]
        # Wide poses may be constrained by the common horizontal safe margin.
        if master_height > target_height + 3:
            raise AssertionError(f"{master_path} visible height {master_height} exceeds {target_height}")
        expected_deployed = round(master_height * DEPLOYED_SIZE[1] / MASTER_SIZE[1])
        if abs(deployed_height - expected_deployed) > 3:
            raise AssertionError(
                f"{deployed_path} visible height {deployed_height}; expected about {expected_deployed}"
            )
        if not 1527 <= master_bbox[3] <= 1533:
            raise AssertionError(f"{master_path} baseline is {master_bbox[3]}; expected 1532+/-5")
        if not 1144 <= deployed_bbox[3] <= 1151:
            raise AssertionError(f"{deployed_path} baseline is {deployed_bbox[3]}; expected 1148+/-4")

    scene_root = deployed_root.parent
    for asset in JC_BATCH.scenes:
        asset_id, category = asset.asset_id, asset.category
        master_path = scene_source_root / f"{asset_id}-master.png"
        if not master_path.is_file():
            raise FileNotFoundError(master_path)
        master_image = Image.open(master_path)
        if master_image.size != SCENE_MASTER_SIZE:
            raise AssertionError(
                f"{master_path} is {master_image.size}; expected {SCENE_MASTER_SIZE}"
            )
        path = scene_root / category / f"{asset_id}.webp"
        if not path.is_file():
            raise FileNotFoundError(path)
        image = Image.open(path)
        if image.size != (1600, 900):
            raise AssertionError(f"{path} is {image.size}; expected (1600, 900)")
        if path.stat().st_size >= 8 * 1024 * 1024:
            raise AssertionError(f"{path} exceeds the 8 MiB asset limit")
    print("JC art validation passed: 27 sprites and 12 scenes")


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


def _assert_magenta_source(path: Path) -> None:
    image = Image.open(path).convert("RGB")
    if image.width < 768 or image.height < 1024:
        raise AssertionError(f"{path} is too small for a production sprite source: {image.size}")
    key = np.median(_border_samples(np.asarray(image, dtype=np.uint8)), axis=0)
    if not (key[0] >= 175 and key[2] >= 150 and key[1] <= 105):
        raise AssertionError(
            f"{path} does not have the approved magenta border key; median RGB is "
            f"({key[0]:.0f}, {key[1]:.0f}, {key[2]:.0f})"
        )


def _inspect_school_years_sprite(
    path: Path,
    expected_size: tuple[int, int],
    expected_height: int,
    expected_baseline: int,
    expected_centre: int,
    height_tolerance: int,
    centre_tolerance: int,
    expected_format: str,
) -> int:
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

    alpha_extrema = image.getchannel("A").getextrema()
    if alpha_extrema[0] != 0 or alpha_extrema[1] != 255:
        raise AssertionError(
            f"{path} must contain both fully transparent and fully opaque pixels; "
            f"alpha range is {alpha_extrema}"
        )
    _assert_transparent_corners(image, path)
    _assert_clean_matte(image, path)
    bbox = _visible_bbox(image, threshold=16)
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
    if abs(centre - expected_centre) > centre_tolerance:
        raise AssertionError(
            f"{path} alpha-box centre is {centre:.1f}; expected "
            f"{expected_centre}+/-{centre_tolerance}"
        )
    max_width = expected_size[0] - round(expected_size[0] / 32)
    if right - left > max_width:
        raise AssertionError(
            f"{path} visible width {right - left} exceeds safe width {max_width}"
        )
    return visible_height


def _inspect_school_years_scene(
    path: Path,
    expected_size: tuple[int, int],
    expected_format: str,
    enforce_precache_limit: bool,
) -> None:
    if not path.is_file():
        raise FileNotFoundError(path)
    if enforce_precache_limit and path.stat().st_size >= 8 * 1024 * 1024:
        raise AssertionError(f"{path} exceeds the 8 MiB per-file precache limit")
    with Image.open(path) as image:
        image.load()
        if image.format != expected_format:
            raise AssertionError(f"{path} is {image.format}; expected {expected_format}")
        if image.size != expected_size:
            raise AssertionError(f"{path} is {image.size}; expected {expected_size}")


def _inspect_retained_scene_source(path: Path) -> None:
    """Check a legacy scene input without rewriting its historical dimensions."""

    if not path.is_file():
        raise FileNotFoundError(path)
    with Image.open(path) as image:
        image.load()
        if image.format != "PNG":
            raise AssertionError(f"{path} is {image.format}; expected PNG")
        if image.width < 1600 or image.height < 900:
            raise AssertionError(
                f"{path} is {image.size}; retained source must be at least 1600x900"
            )


def validate_school_years_art(
    candidate_root: Path,
    retained_source_root: Path,
    processed_root: Path,
) -> None:
    """Validate the complete candidate-only 47/20/8 School Years batch."""

    character_source_root = candidate_root / "characters"
    candidate_scene_root = candidate_root / "scenes"
    master_root = processed_root / "masters"
    deployed_root = processed_root / "deploy" / "assets" / "art"

    expected_sprite_sources = {asset.source for asset in SCHOOL_YEARS_BATCH.sprites}
    expected_candidate_backgrounds = {
        f"{asset.asset_id}.png"
        for asset in SCHOOL_YEARS_BATCH.scenes
        if asset.category == "backgrounds" and asset.source_group == "candidate"
    }
    expected_candidate_cgs = {
        f"{asset.asset_id}.png"
        for asset in SCHOOL_YEARS_BATCH.scenes
        if asset.category == "cg" and asset.source_group == "candidate"
    }
    expected_master_sprites = {
        f"{asset.family}/{asset.name}-master.png" for asset in SCHOOL_YEARS_BATCH.sprites
    }
    expected_deployed_sprites = {
        f"{asset.family}/{asset.name}.webp" for asset in SCHOOL_YEARS_BATCH.sprites
    }
    expected_master_backgrounds = {
        f"{asset.asset_id}-master.png"
        for asset in SCHOOL_YEARS_BATCH.scenes
        if asset.category == "backgrounds"
    }
    expected_master_cgs = {
        f"{asset.asset_id}-master.png"
        for asset in SCHOOL_YEARS_BATCH.scenes
        if asset.category == "cg"
    }
    expected_deployed_backgrounds = {
        f"{asset.asset_id}.webp"
        for asset in SCHOOL_YEARS_BATCH.scenes
        if asset.category == "backgrounds"
    }
    expected_deployed_cgs = {
        f"{asset.asset_id}.webp"
        for asset in SCHOOL_YEARS_BATCH.scenes
        if asset.category == "cg"
    }

    _assert_exact_inventory(
        character_source_root,
        expected_sprite_sources,
        (".png",),
        "School Years sprite candidate",
    )
    _assert_exact_inventory(
        candidate_scene_root / "backgrounds",
        expected_candidate_backgrounds,
        (".png",),
        "School Years generated background candidate",
    )
    _assert_exact_inventory(
        candidate_scene_root / "cg",
        expected_candidate_cgs,
        (".png",),
        "School Years generated CG candidate",
    )
    _assert_exact_inventory(
        master_root / "characters",
        expected_master_sprites,
        (".png",),
        "School Years normalized sprite master",
    )
    _assert_exact_inventory(
        deployed_root / "characters",
        expected_deployed_sprites,
        (".webp", ".png"),
        "School Years deploy-shaped sprite candidate",
    )
    _assert_exact_inventory(
        master_root / "backgrounds",
        expected_master_backgrounds,
        (".png",),
        "School Years background master",
    )
    _assert_exact_inventory(
        master_root / "cg",
        expected_master_cgs,
        (".png",),
        "School Years CG master",
    )
    _assert_exact_inventory(
        deployed_root / "backgrounds",
        expected_deployed_backgrounds,
        (".webp", ".png"),
        "School Years deploy-shaped background candidate",
    )
    _assert_exact_inventory(
        deployed_root / "cg",
        expected_deployed_cgs,
        (".webp", ".png"),
        "School Years deploy-shaped CG candidate",
    )

    for asset in SCHOOL_YEARS_BATCH.sprites:
        source_path = character_source_root / asset.source
        _assert_magenta_source(source_path)

    heights_by_family: dict[str, list[int]] = {}
    for asset in SCHOOL_YEARS_BATCH.sprites:
        master_path = (
            master_root / "characters" / asset.family / f"{asset.name}-master.png"
        )
        deployed_path = (
            deployed_root / "characters" / asset.family / f"{asset.name}.webp"
        )
        _inspect_school_years_sprite(
            master_path,
            MASTER_SIZE,
            asset.master_height,
            MASTER_BASELINE,
            MASTER_SIZE[0] // 2,
            10,
            20,
            "PNG",
        )
        deployed_height = _inspect_school_years_sprite(
            deployed_path,
            DEPLOYED_SIZE,
            asset.deployed_height,
            1148,
            DEPLOYED_SIZE[0] // 2,
            8,
            16,
            "WEBP",
        )
        if deployed_path.stat().st_size >= 8 * 1024 * 1024:
            raise AssertionError(
                f"{deployed_path} exceeds the 8 MiB per-file precache limit"
            )
        heights_by_family.setdefault(asset.family, []).append(deployed_height)

    median_heights = {
        family: float(np.median(values)) for family, values in heights_by_family.items()
    }
    expected_order = (
        "aleem-sec",
        "aleem-home",
        "hana",
        "alya",
        "alya-young-home",
        "aleem-p6",
        "aleem-young-home",
        "faris",
    )
    expected_targets = {
        family: next(
            asset.deployed_height
            for asset in SCHOOL_YEARS_BATCH.sprites
            if asset.family == family
        )
        for family in expected_order
    }
    for taller, shorter in zip(expected_order, expected_order[1:]):
        taller_target = expected_targets[taller]
        shorter_target = expected_targets[shorter]
        if taller_target == shorter_target:
            if abs(median_heights[taller] - median_heights[shorter]) > 8:
                raise AssertionError(
                    f"Equal-stature families {taller} and {shorter} differ by more than 8 px"
                )
        elif median_heights[taller] <= median_heights[shorter]:
            raise AssertionError(
                f"Relative stature failed: {taller} ({median_heights[taller]:.1f}) "
                f"must be taller than {shorter} ({median_heights[shorter]:.1f})"
            )

    for asset in SCHOOL_YEARS_BATCH.scenes:
        if asset.source_group == "retained":
            retained_path = retained_source_root / f"{asset.asset_id}-master.png"
            _inspect_retained_scene_source(retained_path)
        master_path = master_root / asset.category / f"{asset.asset_id}-master.png"
        deployed_path = deployed_root / asset.category / f"{asset.asset_id}.webp"
        _inspect_school_years_scene(master_path, SCENE_MASTER_SIZE, "PNG", False)
        _inspect_school_years_scene(deployed_path, (1600, 900), "WEBP", True)

    print(
        "School Years art validation passed: 47 sprites, 20 backgrounds, "
        "8 CGs, 75 normalized masters, and 75 deploy-shaped candidates."
    )


def _path_argument(parser: argparse.ArgumentParser, flag: str, default: str) -> None:
    parser.add_argument(flag, type=Path, default=Path(default))


def main() -> None:
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(dest="command", required=True)

    sheet_parser = subparsers.add_parser("split-sheet")
    sheet_parser.add_argument("--source", type=Path, required=True)
    sheet_parser.add_argument("--destination", type=Path, required=True)
    sheet_parser.add_argument("--names", nargs="+", required=True)
    sheet_parser.add_argument("--columns", type=int, default=3)

    background_parser = subparsers.add_parser("background")
    background_parser.add_argument("--source", type=Path, required=True)
    background_parser.add_argument("--destination", type=Path, required=True)

    sprites_parser = subparsers.add_parser("jc-sprites")
    _path_argument(sprites_parser, "--source-root", "art/sources/characters")
    _path_argument(sprites_parser, "--master-root", "art/sources/characters/normalized")
    _path_argument(sprites_parser, "--deployed-root", "public/assets/art/characters")

    scenes_parser = subparsers.add_parser("jc-scenes")
    _path_argument(scenes_parser, "--source-root", "art/sources")
    _path_argument(scenes_parser, "--deployed-root", "public/assets/art")
    scenes_parser.add_argument("--skip-missing", action="store_true")

    validate_parser = subparsers.add_parser("validate-jc")
    _path_argument(validate_parser, "--master-root", "art/sources/characters/normalized")
    _path_argument(validate_parser, "--deployed-root", "public/assets/art/characters")
    _path_argument(validate_parser, "--scene-source-root", "art/sources")

    school_sprites_parser = subparsers.add_parser("school-years-sprites")
    _path_argument(
        school_sprites_parser,
        "--source-root",
        "art/candidates/school-years-refresh/characters",
    )
    _path_argument(
        school_sprites_parser,
        "--master-root",
        "art/candidates/school-years-refresh/processed/masters/characters",
    )
    _path_argument(
        school_sprites_parser,
        "--deployed-root",
        "art/candidates/school-years-refresh/processed/deploy/assets/art/characters",
    )

    school_scenes_parser = subparsers.add_parser("school-years-scenes")
    _path_argument(
        school_scenes_parser,
        "--candidate-source-root",
        "art/candidates/school-years-refresh/scenes",
    )
    _path_argument(school_scenes_parser, "--retained-source-root", "art/sources")
    _path_argument(
        school_scenes_parser,
        "--master-root",
        "art/candidates/school-years-refresh/processed/masters",
    )
    _path_argument(
        school_scenes_parser,
        "--deployed-root",
        "art/candidates/school-years-refresh/processed/deploy/assets/art",
    )

    school_batch_parser = subparsers.add_parser("school-years")
    _path_argument(
        school_batch_parser,
        "--candidate-root",
        "art/candidates/school-years-refresh",
    )
    _path_argument(school_batch_parser, "--retained-source-root", "art/sources")
    _path_argument(
        school_batch_parser,
        "--processed-root",
        "art/candidates/school-years-refresh/processed",
    )

    school_validate_parser = subparsers.add_parser("validate-school-years")
    _path_argument(
        school_validate_parser,
        "--candidate-root",
        "art/candidates/school-years-refresh",
    )
    _path_argument(school_validate_parser, "--retained-source-root", "art/sources")
    _path_argument(
        school_validate_parser,
        "--processed-root",
        "art/candidates/school-years-refresh/processed",
    )

    args = parser.parse_args()
    if args.command == "split-sheet":
        split_sheet(args.source, args.destination, args.names, args.columns)
    elif args.command == "background":
        background(args.source, args.destination)
    elif args.command == "jc-sprites":
        process_jc_sprites(args.source_root, args.master_root, args.deployed_root)
    elif args.command == "jc-scenes":
        process_jc_scenes(args.source_root, args.deployed_root, args.skip_missing)
    elif args.command == "validate-jc":
        validate_jc_art(args.master_root, args.deployed_root, args.scene_source_root)
    elif args.command == "school-years-sprites":
        process_school_years_sprites(args.source_root, args.master_root, args.deployed_root)
    elif args.command == "school-years-scenes":
        process_school_years_scenes(
            args.candidate_source_root,
            args.retained_source_root,
            args.master_root,
            args.deployed_root,
        )
    elif args.command == "school-years":
        process_school_years_batch(
            args.candidate_root,
            args.retained_source_root,
            args.processed_root,
        )
    else:
        validate_school_years_art(
            args.candidate_root,
            args.retained_source_root,
            args.processed_root,
        )


if __name__ == "__main__":
    main()
