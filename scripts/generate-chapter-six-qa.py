"""Build Chapter 6 candidate-only art contact sheets for human approval."""

from __future__ import annotations

import argparse
import importlib.util
import math
from pathlib import Path
import sys
from types import ModuleType
from typing import Any

from PIL import Image, ImageDraw, ImageOps

from chapter_six_art import (
    CHAPTER_SIX_BACKGROUNDS,
    CHAPTER_SIX_CGS,
    CHAPTER_SIX_SCENES,
    CHAPTER_SIX_SPRITES,
    DEFAULT_CANDIDATE_ROOT,
)


ROOT = Path(__file__).resolve().parents[1]
BLACK = (8, 10, 14)
WHITE = (250, 250, 247)
TEAL = (18, 82, 86)
PAPER = (238, 241, 242)


def load_qa_helpers() -> ModuleType:
    path = ROOT / "scripts" / "generate-school-years-qa.py"
    spec = importlib.util.spec_from_file_location("return_to_me_art_qa_helpers", path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load shared QA helpers from {path}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def build_sprite_overview(
    qa: ModuleType,
    assets: tuple[Any, ...],
    sprite_root: Path,
    output: Path,
    title: str,
    background: tuple[int, int, int] | None,
) -> None:
    columns = 6
    cell_width, cell_height = 270, 390
    rows = math.ceil(len(assets) / columns)
    image = Image.new("RGB", (columns * cell_width, 78 + rows * cell_height), PAPER)
    qa.title_bar(
        image,
        title,
        f"{len(assets)} aligned 768x1152 deploy-shaped RGBA candidates",
    )
    for index, asset in enumerate(assets):
        column, row = index % columns, index // columns
        x, y = column * cell_width, 78 + row * cell_height
        card = (
            qa.checkerboard((cell_width - 12, cell_height - 12), 14)
            if background is None
            else Image.new("RGB", (cell_width - 12, cell_height - 12), background)
        )
        sprite = Image.open(
            sprite_root / asset.family / f"{asset.name}.webp"
        ).convert("RGBA")
        fitted = qa.fit_rgba(sprite, (cell_width - 28, cell_height - 78))
        card.paste(
            fitted,
            ((card.width - fitted.width) // 2, card.height - 62 - fitted.height),
            fitted,
        )
        draw = ImageDraw.Draw(card)
        draw.rectangle((0, card.height - 60, card.width, card.height), fill=(31, 39, 49))
        draw.text(
            (8, card.height - 54),
            f"{asset.family} / {asset.name}",
            fill=(255, 255, 255),
            font=qa.font(14, True),
        )
        draw.text(
            (8, card.height - 30),
            f"visible target {asset.deployed_height}px",
            fill=(193, 215, 216),
            font=qa.font(12),
        )
        image.paste(card, (x + 6, y + 6))
    qa.save_sheet(image, output)


def select_asset(family: str, name: str) -> Any:
    return next(
        asset
        for asset in CHAPTER_SIX_SPRITES
        if asset.family == family and asset.name == name
    )


def build_lineup(qa: ModuleType, sprite_root: Path, output: Path) -> None:
    selections = (
        select_asset("aleem-ns", "neutral"),
        select_asset("aleem-raya", "shy-smile"),
        select_asset("aleem-uni", "neutral"),
        select_asset("nadiah", "neutral"),
    )
    slot_width = 360
    canvas = Image.new("RGB", (slot_width * len(selections), 800), TEAL)
    qa.title_bar(
        canvas,
        "Chapter 6 identity, outfit, and stature lineup",
        "Aleem continuity across NS, Hari Raya, and university; Nadiah is wholly fictional",
    )
    draw = ImageDraw.Draw(canvas)
    baseline = 672
    draw.line((0, baseline, canvas.width, baseline), fill=(116, 235, 230), width=3)
    scale = 0.5
    for index, asset in enumerate(selections):
        sprite = Image.open(
            sprite_root / asset.family / f"{asset.name}.webp"
        ).convert("RGBA")
        sprite = sprite.resize(
            (round(sprite.width * scale), round(sprite.height * scale)),
            Image.Resampling.LANCZOS,
        )
        alpha_box = sprite.getchannel("A").getbbox()
        if alpha_box is None:
            raise ValueError(f"Empty sprite: {asset.asset_id}")
        x = index * slot_width + (slot_width - sprite.width) // 2
        y = baseline - alpha_box[3]
        canvas.paste(sprite, (x, y), sprite)
        draw.text(
            (index * slot_width + slot_width // 2, baseline + 26),
            f"{asset.family}\n{asset.name}",
            fill=(255, 255, 255),
            font=qa.font(16, True),
            anchor="ma",
            align="center",
            spacing=5,
        )
    qa.save_sheet(canvas, output)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--candidate-root",
        type=Path,
        default=DEFAULT_CANDIDATE_ROOT,
    )
    args = parser.parse_args()
    candidate_root = args.candidate_root
    processed_root = candidate_root / "processed"
    deployed_root = processed_root / "deploy" / "assets" / "art"
    master_root = processed_root / "masters" / "characters"
    qa_root = candidate_root / "qa"

    required = [
        deployed_root / "characters" / asset.family / f"{asset.name}.webp"
        for asset in CHAPTER_SIX_SPRITES
    ]
    required.extend(
        deployed_root / asset.category / f"{asset.asset_id}.webp"
        for asset in CHAPTER_SIX_SCENES
    )
    missing = [path for path in required if not path.is_file()]
    if missing:
        raise FileNotFoundError(
            "Run `npm run art:chapter-six:process` first; missing "
            + ", ".join(str(path) for path in missing[:3])
        )

    qa = load_qa_helpers()
    backgrounds = tuple(
        asset for asset in CHAPTER_SIX_SCENES if asset.asset_id in CHAPTER_SIX_BACKGROUNDS
    )
    cgs = tuple(asset for asset in CHAPTER_SIX_SCENES if asset.asset_id in CHAPTER_SIX_CGS)

    build_sprite_overview(
        qa,
        CHAPTER_SIX_SPRITES,
        deployed_root / "characters",
        qa_root / "01-sprites-overview.jpg",
        "Chapter 6 full sprite overview",
        None,
    )
    qa.build_scene_overview(
        backgrounds,
        deployed_root,
        qa_root / "02-backgrounds-overview.jpg",
        "Chapter 6 background overview",
        3,
    )
    qa.build_scene_overview(
        cgs,
        deployed_root,
        qa_root / "03-cgs-overview.jpg",
        "Chapter 6 CG overview",
        3,
    )
    for filename, title, colour in (
        ("04-sprites-black.png", "Chapter 6 sprites - black composite", BLACK),
        ("05-sprites-white.png", "Chapter 6 sprites - white composite", WHITE),
        ("06-sprites-teal.png", "Chapter 6 sprites - teal composite", TEAL),
    ):
        build_sprite_overview(
            qa,
            CHAPTER_SIX_SPRITES,
            deployed_root / "characters",
            qa_root / filename,
            title,
            colour,
        )
    build_lineup(
        qa,
        deployed_root / "characters",
        qa_root / "07-identity-outfit-lineup.png",
    )

    aleem_details = tuple(
        (asset, 0.0, 0.42)
        for asset in CHAPTER_SIX_SPRITES
        if asset.family.startswith("aleem-")
    )
    qa.build_detail_sheet(
        aleem_details,
        master_root,
        qa_root / "08-aleem-face-glasses-continuity.png",
        "Aleem face and glasses continuity",
        "Identity, age, expression, glasses geometry, and outfit boundaries",
        columns=5,
    )
    nadiah_details = tuple(
        (asset, 0.0, 0.62)
        for asset in CHAPTER_SIX_SPRITES
        if asset.family == "nadiah"
    )
    qa.build_detail_sheet(
        nadiah_details,
        master_root,
        qa_root / "09-nadiah-hijab-expression-continuity.png",
        "Nadiah identity, hijab, and expression continuity",
        "Wholly fictional design; modest styling; no villain framing",
        columns=5,
    )
    print(f"Chapter 6 QA package written to {qa_root}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
