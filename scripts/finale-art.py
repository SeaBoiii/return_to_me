"""Process and physically review the independently generated finale batch.

The shared JSON inventory is also consumed by the TypeScript asset manifest.
Existing school/JC inventories and generation masters are never rewritten.
"""

from __future__ import annotations

import argparse
import importlib.util
import json
from pathlib import Path
import sys

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "art/sources/finale"
NORMALIZED = RAW / "normalized"
PUBLIC = ROOT / "public/assets/art"
QA = ROOT / "art/qa/finale"
INVENTORY = json.loads((ROOT / "src/story/finale-art.json").read_text(encoding="utf-8"))
LIMIT = 8 * 1024 * 1024

spec = importlib.util.spec_from_file_location("art_processing", ROOT / "scripts/process-art.py")
assert spec is not None and spec.loader is not None
processing = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = processing
spec.loader.exec_module(processing)


def sprite_entries():
    for family in INVENTORY["families"]:
        for expression in family["expressions"]:
            yield family, expression, f"{family['id']}-{expression}"


def check_source(source: Path, sprite: bool) -> None:
    with Image.open(source) as opened:
        opened.verify()
    if not sprite:
        return
    with Image.open(source) as opened:
        rgba = opened.convert("RGBA")
        if rgba.getchannel("A").getextrema()[0] == 0:
            return
        corners = [rgba.getpixel(point) for point in (
            (0, 0), (rgba.width - 1, 0), (0, rgba.height - 1),
            (rgba.width - 1, rgba.height - 1),
        )]
        if not all(r > 180 and b > 140 and g < 100 for r, g, b, _ in corners):
            raise ValueError(f"{source}: expected real alpha or a magenta key field; reject painted transparency")


def process(only_present: bool) -> None:
    entries = [
        (RAW / "sprites" / f"{asset_id}-master.png", True)
        for _, _, asset_id in sprite_entries()
    ] + [(RAW / "scenes" / f"{scene['id']}-master.png", False) for scene in INVENTORY["scenes"]]
    missing = [str(path.relative_to(ROOT)) for path, _ in entries if not path.is_file()]
    if missing and not only_present:
        raise FileNotFoundError("Missing generation masters:\n" + "\n".join(missing))
    for path, is_sprite in entries:
        if path.is_file():
            check_source(path, is_sprite)

    for family, expression, asset_id in sprite_entries():
        source = RAW / "sprites" / f"{asset_id}-master.png"
        if not source.is_file():
            continue
        image = Image.open(source).convert("RGBA")
        target_height = round(family["height"] * 4 / 3)
        if image.getchannel("A").getextrema()[0] == 0:
            # Preserve genuine generator alpha rather than treating it as RGB.
            bbox = image.getchannel("A").getbbox()
            assert bbox is not None
            subject = image.crop(bbox)
            scale = min(target_height / subject.height, 992 / subject.width)
            subject = subject.convert("RGBa").resize(
                (round(subject.width * scale), round(subject.height * scale)), Image.Resampling.LANCZOS
            ).convert("RGBA")
            master = Image.new("RGBA", (1024, 1536))
            master.alpha_composite(subject, ((1024 - subject.width) // 2, 1532 - subject.height))
            master_path = NORMALIZED / "characters" / family["id"] / f"{expression}-master.png"
            deployed = PUBLIC / "characters" / family["id"] / f"{expression}.webp"
            master_path.parent.mkdir(parents=True, exist_ok=True)
            deployed.parent.mkdir(parents=True, exist_ok=True)
            master.save(master_path, "PNG", optimize=True)
            master.convert("RGBa").resize((768, 1152), Image.Resampling.LANCZOS).convert("RGBA").save(
                deployed, "WEBP", lossless=True, method=6
            )
        else:
            processing._save_sprite(
                image.convert("RGB"), family["id"], expression, target_height,
                NORMALIZED / "characters", PUBLIC / "characters",
            )
    for scene in INVENTORY["scenes"]:
        source = RAW / "scenes" / f"{scene['id']}-master.png"
        if not source.is_file():
            continue
        category = "cg" if scene["kind"] == "cg" else "backgrounds"
        processing._save_scene_candidate(
            source, NORMALIZED / category / f"{scene['id']}-master.png",
            PUBLIC / category / f"{scene['id']}.webp",
        )


def checked_image(path: Path, size: tuple[int, int], sprite: bool = False) -> Image.Image:
    if not 0 < path.stat().st_size < LIMIT:
        raise ValueError(f"{path}: file must be nonempty and below the 8 MiB precache limit")
    with Image.open(path) as opened:
        if opened.size != size:
            raise ValueError(f"{path}: size {opened.size}, expected {size}")
        if sprite and "A" not in opened.getbands():
            raise ValueError(f"{path}: missing alpha channel")
        image = opened.convert("RGBA")
    if sprite:
        alpha = image.getchannel("A")
        if alpha.getextrema() != (0, 255):
            raise ValueError(f"{path}: incomplete transparency range")
        if any(alpha.getpixel(point) for point in ((0, 0), (size[0] - 1, 0), (0, size[1] - 1), (size[0] - 1, size[1] - 1))):
            raise ValueError(f"{path}: opaque sprite corner")
    return image


def validate() -> None:
    entries = list(sprite_entries())
    assert len(entries) == 7 and len(INVENTORY["scenes"]) == 7
    for family, expression, asset_id in entries:
        check_source(RAW / "sprites" / f"{asset_id}-master.png", True)
        master = checked_image(NORMALIZED / "characters" / family["id"] / f"{expression}-master.png", (1024, 1536), True)
        deployed = checked_image(PUBLIC / "characters" / family["id"] / f"{expression}.webp", (768, 1152), True)
        for image, target, baseline in ((master, round(family["height"] * 4 / 3), 1532), (deployed, family["height"], 1149)):
            bbox = image.getchannel("A").point(lambda value: 255 if value >= 16 else 0).getbbox()
            if bbox is None or abs(bbox[3] - bbox[1] - target) > 4 or abs(bbox[3] - baseline) > 3:
                raise ValueError(f"{asset_id}: inconsistent height or baseline {bbox}; expected height {target}, baseline {baseline}")
            if abs((bbox[0] + bbox[2]) / 2 - image.width / 2) > 3:
                raise ValueError(f"{asset_id}: sprite is not centered")
    for scene in INVENTORY["scenes"]:
        category = "cg" if scene["kind"] == "cg" else "backgrounds"
        check_source(RAW / "scenes" / f"{scene['id']}-master.png", False)
        checked_image(NORMALIZED / category / f"{scene['id']}-master.png", (2048, 1152))
        checked_image(PUBLIC / category / f"{scene['id']}.webp", (1600, 900))
    print("Finale art passed: 7 sprites, 4 backgrounds, 3 CGs; dimensions, alpha, stature, alignment and per-file precache limit.")


def qa() -> None:
    QA.mkdir(parents=True, exist_ok=True)
    for family in INVENTORY["families"]:
        sheet = Image.new("RGB", (300 * len(family["expressions"]), 490), "#eee9e0")
        draw = ImageDraw.Draw(sheet)
        for index, expression in enumerate(family["expressions"]):
            path = PUBLIC / "characters" / family["id"] / f"{expression}.webp"
            if not path.is_file():
                continue
            draw.rectangle((index * 300 + 150, 0, index * 300 + 299, 449), fill="#23313e")
            sprite = Image.open(path).convert("RGBA")
            sprite.thumbnail((300, 450), Image.Resampling.LANCZOS)
            sheet.paste(sprite, (index * 300 + (300 - sprite.width) // 2, 0), sprite)
            draw.text((index * 300 + 8, 462), expression, fill="#17212b")
        sheet.save(QA / f"{family['id']}.jpg", quality=91)
    scenes = Image.new("RGB", (1200, 250 * ((len(INVENTORY["scenes"]) + 2) // 3)), "#eee9e0")
    draw = ImageDraw.Draw(scenes)
    for index, scene in enumerate(INVENTORY["scenes"]):
        category = "cg" if scene["kind"] == "cg" else "backgrounds"
        path = PUBLIC / category / f"{scene['id']}.webp"
        if not path.is_file():
            continue
        x, y = (index % 3) * 400, (index // 3) * 250
        thumbnail = Image.open(path).convert("RGB").resize((400, 225), Image.Resampling.LANCZOS)
        scenes.paste(thumbnail, (x, y))
        draw.text((x + 5, y + 230), scene["id"], fill="#17212b")
    scenes.save(QA / "scenes.jpg", quality=91)
    print(f"Review sheets written to {QA.relative_to(ROOT)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=("process", "validate", "qa", "check"))
    parser.add_argument("--only-present", action="store_true", help="Process a partial batch during production; final validation still requires every asset")
    args = parser.parse_args()
    if args.command in ("process", "check"):
        process(args.only_present)
    if args.command in ("validate", "check"):
        validate()
    if args.command in ("qa", "check"):
        qa()
