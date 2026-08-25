"""Build the candidate-only final-approval contact sheets for Chapters 1-2."""

from __future__ import annotations

import argparse
import importlib.util
import math
from pathlib import Path
import sys
from types import ModuleType
from typing import Any, Callable

from PIL import Image, ImageDraw, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[1]
BLACK = (8, 10, 14)
WHITE = (250, 250, 247)
TEAL = (18, 82, 86)
INK = (25, 30, 38)
PAPER = (238, 241, 242)


def load_pipeline() -> ModuleType:
    path = ROOT / "scripts" / "process-art.py"
    spec = importlib.util.spec_from_file_location("return_to_me_process_art_qa", path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load art pipeline from {path}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = (
        "C:/Windows/Fonts/seguisb.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf",
    )
    for candidate in candidates:
        try:
            return ImageFont.truetype(candidate, size)
        except OSError:
            continue
    return ImageFont.load_default()


def checkerboard(size: tuple[int, int], tile: int = 18) -> Image.Image:
    image = Image.new("RGB", size, (226, 229, 231))
    draw = ImageDraw.Draw(image)
    alternate = (196, 202, 205)
    for y in range(0, size[1], tile):
        for x in range(0, size[0], tile):
            if (x // tile + y // tile) % 2:
                draw.rectangle((x, y, x + tile - 1, y + tile - 1), fill=alternate)
    return image


def title_bar(image: Image.Image, title: str, subtitle: str = "") -> int:
    draw = ImageDraw.Draw(image)
    draw.rectangle((0, 0, image.width, 78), fill=(31, 39, 49))
    draw.text((24, 13), title, fill=(255, 255, 255), font=font(28, True))
    if subtitle:
        draw.text((24, 49), subtitle, fill=(193, 215, 216), font=font(14))
    return 78


def save_sheet(image: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.suffix.lower() in {".jpg", ".jpeg"}:
        image.convert("RGB").save(path, "JPEG", quality=92, subsampling=0, optimize=True)
    else:
        image.save(path, "PNG", optimize=True)
    print(f"Wrote {path} ({image.width}x{image.height})")


def fit_rgba(image: Image.Image, box: tuple[int, int]) -> Image.Image:
    return ImageOps.contain(image.convert("RGBA"), box, Image.Resampling.LANCZOS)


def sprite_label(asset: Any) -> str:
    return f"{asset.family} / {asset.name}"


def build_sprite_overview(
    assets: tuple[Any, ...],
    sprite_root: Path,
    output: Path,
    title: str,
    background: tuple[int, int, int] | None,
) -> None:
    columns = 8
    cell_width, cell_height = 240, 360
    rows = math.ceil(len(assets) / columns)
    image = Image.new("RGB", (columns * cell_width, 78 + rows * cell_height), PAPER)
    title_bar(image, title, "47 aligned 768x1152 deploy-shaped RGBA candidates")
    draw = ImageDraw.Draw(image)
    label_font = font(14, True)
    detail_font = font(12)

    for index, asset in enumerate(assets):
        column, row = index % columns, index // columns
        x, y = column * cell_width, 78 + row * cell_height
        card = (
            checkerboard((cell_width - 12, cell_height - 12), 14)
            if background is None
            else Image.new("RGB", (cell_width - 12, cell_height - 12), background)
        )
        sprite = Image.open(sprite_root / asset.family / f"{asset.name}.webp").convert("RGBA")
        fitted = fit_rgba(sprite, (cell_width - 26, cell_height - 74))
        card.paste(
            fitted,
            ((card.width - fitted.width) // 2, card.height - 60 - fitted.height),
            fitted,
        )
        card_draw = ImageDraw.Draw(card)
        text_colour = (245, 245, 245) if background in {BLACK, TEAL} else INK
        card_draw.rectangle((0, card.height - 58, card.width, card.height), fill=(31, 39, 49))
        card_draw.text((7, card.height - 53), sprite_label(asset), fill=(255, 255, 255), font=label_font)
        card_draw.text(
            (7, card.height - 29),
            f"target {asset.deployed_height}px",
            fill=(193, 215, 216),
            font=detail_font,
        )
        image.paste(card, (x + 6, y + 6))
        draw.rectangle((x + 5, y + 5, x + cell_width - 6, y + cell_height - 6), outline=text_colour)
    save_sheet(image, output)


def build_scene_overview(
    assets: tuple[Any, ...],
    scene_root: Path,
    output: Path,
    title: str,
    columns: int,
) -> None:
    cell_width, cell_height = 410, 275
    rows = math.ceil(len(assets) / columns)
    image = Image.new("RGB", (columns * cell_width, 78 + rows * cell_height), PAPER)
    title_bar(image, title, f"{len(assets)} normalized 1600x900 deploy-shaped candidates")
    label_font = font(15, True)
    for index, asset in enumerate(assets):
        column, row = index % columns, index // columns
        x, y = column * cell_width, 78 + row * cell_height
        scene = Image.open(scene_root / asset.category / f"{asset.asset_id}.webp").convert("RGB")
        scene = ImageOps.fit(scene, (390, 219), Image.Resampling.LANCZOS)
        image.paste(scene, (x + 10, y + 10))
        draw = ImageDraw.Draw(image)
        draw.rectangle((x + 10, y + 229, x + 400, y + 263), fill=(31, 39, 49))
        draw.text((x + 18, y + 237), asset.asset_id, fill=(255, 255, 255), font=label_font)
    save_sheet(image, output)


def select_asset(assets: tuple[Any, ...], family: str, name: str) -> Any:
    return next(asset for asset in assets if asset.family == family and asset.name == name)


def build_stature_lineup(assets: tuple[Any, ...], sprite_root: Path, output: Path) -> None:
    selections = (
        ("aleem-p6", "neutral"),
        ("alya", "neutral"),
        ("aleem-young-home", "neutral"),
        ("alya-young-home", "apologetic"),
        ("aleem-sec", "neutral"),
        ("aleem-home", "focused"),
        ("hana", "neutral"),
        ("faris", "neutral"),
    )
    selected = tuple(select_asset(assets, *key) for key in selections)
    slot_width = 300
    canvas = Image.new("RGB", (slot_width * len(selected), 790), (28, 89, 91))
    title_bar(
        canvas,
        "School Years stature and baseline lineup",
        "All sprites share one scale; cyan rule marks deployed baseline y=1148 before display scaling",
    )
    draw = ImageDraw.Draw(canvas)
    baseline = 660
    draw.line((0, baseline, canvas.width, baseline), fill=(116, 235, 230), width=3)
    scale = 0.49
    full_size = (round(768 * scale), round(1152 * scale))
    source_baseline = round(1148 * scale)
    for index, asset in enumerate(selected):
        sprite = Image.open(sprite_root / asset.family / f"{asset.name}.webp").convert("RGBA")
        sprite = sprite.resize(full_size, Image.Resampling.LANCZOS)
        x = index * slot_width + (slot_width - sprite.width) // 2
        y = baseline - source_baseline
        canvas.paste(sprite, (x, y), sprite)
        label = f"{asset.family}\n{asset.name} · {asset.deployed_height}px"
        draw.multiline_text(
            (index * slot_width + slot_width // 2, baseline + 22),
            label,
            fill=(255, 255, 255),
            font=font(15, True),
            anchor="ma",
            align="center",
            spacing=5,
        )
    save_sheet(canvas, output)


def visible_crop(
    image: Image.Image,
    top_fraction: float,
    bottom_fraction: float,
    horizontal_padding: float = 0.08,
) -> Image.Image:
    image = image.convert("RGBA")
    bbox = image.getchannel("A").getbbox()
    if bbox is None:
        raise ValueError("Empty sprite while building QA crop")
    left, top, right, bottom = bbox
    height = bottom - top
    width = right - left
    crop_top = top + round(height * top_fraction)
    crop_bottom = top + round(height * bottom_fraction)
    padding = round(width * horizontal_padding)
    return image.crop(
        (
            max(0, left - padding),
            max(0, crop_top),
            min(image.width, right + padding),
            min(image.height, crop_bottom),
        )
    )


def build_detail_sheet(
    entries: tuple[tuple[Any, float, float], ...],
    master_root: Path,
    output: Path,
    title: str,
    subtitle: str,
    columns: int = 4,
) -> None:
    cell_width, cell_height = 430, 390
    rows = math.ceil(len(entries) / columns)
    image = Image.new("RGB", (columns * cell_width, 78 + rows * cell_height), PAPER)
    title_bar(image, title, subtitle)
    for index, (asset, top_fraction, bottom_fraction) in enumerate(entries):
        column, row = index % columns, index // columns
        x, y = column * cell_width, 78 + row * cell_height
        card = checkerboard((410, 370), 14)
        master_path = master_root / asset.family / f"{asset.name}-master.png"
        crop = visible_crop(Image.open(master_path), top_fraction, bottom_fraction)
        crop = fit_rgba(crop, (390, 316))
        card.paste(crop, ((card.width - crop.width) // 2, 6 + (316 - crop.height) // 2), crop)
        card_draw = ImageDraw.Draw(card)
        card_draw.rectangle((0, 326, card.width, card.height), fill=(31, 39, 49))
        card_draw.text((10, 337), sprite_label(asset), fill=(255, 255, 255), font=font(16, True))
        image.paste(card, (x + 10, y + 10))
    save_sheet(image, output)


def build_alpha_edge_sheet(
    assets: tuple[Any, ...],
    master_root: Path,
    output: Path,
) -> None:
    columns = 4
    cell_width, cell_height = 520, 455
    rows = math.ceil(len(assets) / columns)
    image = Image.new("RGB", (columns * cell_width, 78 + rows * cell_height), PAPER)
    title_bar(
        image,
        "Alpha-edge close review",
        "Identical hair/glasses silhouette crops on checkerboard, black, white, and teal",
    )
    backgrounds: tuple[tuple[str, tuple[int, int, int] | None], ...] = (
        ("checker", None),
        ("black", BLACK),
        ("white", WHITE),
        ("teal", TEAL),
    )
    for index, asset in enumerate(assets):
        column, row = index % columns, index // columns
        card_x, card_y = column * cell_width + 8, 78 + row * cell_height + 8
        master = Image.open(master_root / asset.family / f"{asset.name}-master.png")
        crop = visible_crop(master, 0.0, 0.72, 0.12)
        for panel_index, (name, colour) in enumerate(backgrounds):
            panel_x = card_x + (panel_index % 2) * 252
            panel_y = card_y + (panel_index // 2) * 185
            panel = (
                checkerboard((244, 177), 10)
                if colour is None
                else Image.new("RGB", (244, 177), colour)
            )
            fitted = fit_rgba(crop, (232, 150))
            panel.paste(fitted, ((244 - fitted.width) // 2, 4 + (150 - fitted.height) // 2), fitted)
            ImageDraw.Draw(panel).text((6, 156), name, fill=(220, 220, 220) if colour in {BLACK, TEAL} else INK, font=font(12, True))
            image.paste(panel, (panel_x, panel_y))
        ImageDraw.Draw(image).text(
            (card_x + 4, card_y + 377),
            sprite_label(asset),
            fill=INK,
            font=font(16, True),
        )
    save_sheet(image, output)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--candidate-root",
        type=Path,
        default=ROOT / "art" / "candidates" / "school-years-refresh",
    )
    args = parser.parse_args()
    candidate_root = args.candidate_root
    processed_root = candidate_root / "processed"
    deployed_root = processed_root / "deploy" / "assets" / "art"
    master_root = processed_root / "masters" / "characters"
    qa_root = candidate_root / "qa"

    pipeline = load_pipeline()
    assets = pipeline.SCHOOL_YEARS_BATCH.sprites
    scenes = pipeline.SCHOOL_YEARS_BATCH.scenes
    backgrounds = tuple(asset for asset in scenes if asset.category == "backgrounds")
    cgs = tuple(asset for asset in scenes if asset.category == "cg")

    missing = [
        deployed_root / "characters" / asset.family / f"{asset.name}.webp"
        for asset in assets
        if not (deployed_root / "characters" / asset.family / f"{asset.name}.webp").is_file()
    ]
    if missing:
        raise FileNotFoundError(
            "Run `python -B scripts/process-art.py school-years` first; missing "
            + ", ".join(str(path) for path in missing[:3])
        )

    build_sprite_overview(
        assets,
        deployed_root / "characters",
        qa_root / "01-sprites-overview.jpg",
        "School Years full sprite overview",
        None,
    )
    build_scene_overview(
        backgrounds,
        deployed_root,
        qa_root / "02-backgrounds-overview.jpg",
        "School Years background overview",
        4,
    )
    build_scene_overview(
        cgs,
        deployed_root,
        qa_root / "03-cgs-overview.jpg",
        "School Years CG overview",
        4,
    )
    for filename, title, colour in (
        ("04-sprites-black.png", "Sprite composite · black", BLACK),
        ("05-sprites-white.png", "Sprite composite · white", WHITE),
        ("06-sprites-teal.png", "Sprite composite · teal", TEAL),
    ):
        build_sprite_overview(
            assets,
            deployed_root / "characters",
            qa_root / filename,
            title,
            colour,
        )
    build_stature_lineup(
        assets,
        deployed_root / "characters",
        qa_root / "07-stature-lineup.png",
    )

    braids = tuple(
        (asset, 0.0, 0.82)
        for asset in assets
        if asset.family in {"alya", "alya-young-home"}
    )
    build_detail_sheet(
        braids,
        master_root,
        qa_root / "08-close-braids.png",
        "Braids close review",
        "All Alya school/home variants · continuity, joins, silhouette, and matte",
    )

    hair = tuple(
        (asset, 0.0, 0.78 if asset.family == "hana" else 0.58)
        for asset in assets
        if asset.family in {"hana", "faris"}
    )
    build_detail_sheet(
        hair,
        master_root,
        qa_root / "09-close-long-fluffy-hair.png",
        "Long and fluffy hair close review",
        "Hana and Faris · identity continuity, strand edges, and silhouette",
    )

    glasses_keys = (
        ("aleem-p6", "neutral"),
        ("aleem-p6", "surprised"),
        ("aleem-young-home", "neutral"),
        ("aleem-young-home", "hurt"),
        ("aleem-sec", "neutral"),
        ("aleem-sec", "embarrassed"),
        ("aleem-sec", "devastated"),
        ("aleem-home", "focused"),
        ("aleem-home", "numb"),
        ("hana", "neutral"),
        ("hana", "concerned"),
        ("hana", "apologetic"),
        ("faris", "neutral"),
        ("faris", "teasing"),
    )
    glasses = tuple((select_asset(assets, *key), 0.0, 0.38) for key in glasses_keys)
    build_detail_sheet(
        glasses,
        master_root,
        qa_root / "10-close-glasses.png",
        "Glasses close review",
        "Frame geometry, lens continuity, eye alignment, and identity",
    )

    hand_keys = (
        ("aleem-p6", "nervous"),
        ("aleem-p6", "cheerful"),
        ("aleem-young-home", "startled"),
        ("aleem-young-home", "hurt"),
        ("alya", "playful"),
        ("alya", "shy"),
        ("alya-young-home", "apologetic"),
        ("aleem-sec", "nervous"),
        ("aleem-sec", "defensive"),
        ("aleem-sec", "devastated"),
        ("aleem-home", "proud"),
        ("aleem-home", "overwhelmed"),
        ("hana", "supportive"),
        ("hana", "apologetic"),
        ("faris", "teasing"),
        ("faris", "confident"),
    )
    hands = tuple((select_asset(assets, *key), 0.24, 1.0) for key in hand_keys)
    build_detail_sheet(
        hands,
        master_root,
        qa_root / "11-close-hands.png",
        "Hands and pose close review",
        "Representative expressive poses · anatomy, joins, and cropped boundaries",
    )

    alpha_keys = (
        ("aleem-p6", "cheerful"),
        ("alya", "playful"),
        ("aleem-young-home", "hurt"),
        ("alya-young-home", "apologetic"),
        ("aleem-sec", "embarrassed"),
        ("aleem-home", "overwhelmed"),
        ("hana", "concerned"),
        ("faris", "teasing"),
    )
    build_alpha_edge_sheet(
        tuple(select_asset(assets, *key) for key in alpha_keys),
        master_root,
        qa_root / "12-close-alpha-edges.png",
    )
    print(f"Generated 12 final-approval QA sheets in {qa_root}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
