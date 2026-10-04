"""Deterministic export and audit for the independent mobile portrait batch.

Generation is performed with image_gen.imagegen, never by this processor.
Only new portrait WebPs, this batch's manifest/module, and QA proofs are written.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
BATCH = ROOT / "art/mobile-portrait"
INVENTORY = BATCH / "inventory.json"
MANIFEST = BATCH / "manifest.json"
MODULE = ROOT / "src/story/mobileArt.ts"
MAX_BYTES = 8 * 1024 * 1024


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path, value):
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")


def file_record(path):
    return {"path": path.relative_to(ROOT).as_posix(), "bytes": path.stat().st_size,
            "sha256": hashlib.sha256(path.read_bytes()).hexdigest()}


def resolve_asset(path):
    result = (ROOT / path).resolve()
    if not result.is_relative_to(ROOT) or ".." in Path(path).parts:
        raise ValueError(f"Asset path escapes workspace: {path}")
    return result


def check_bounds(bounds):
    if set(bounds) != {"x", "y", "width", "height"}:
        raise ValueError(f"Invalid bounds fields: {bounds}")
    if any(not isinstance(v, (int, float)) or isinstance(v, bool) or not math.isfinite(v) for v in bounds.values()):
        raise ValueError(f"Bounds must contain finite numbers: {bounds}")
    x, y, w, h = (bounds[k] for k in ("x", "y", "width", "height"))
    if x < 0 or y < 0 or w <= 0 or h <= 0 or x + w > 1.0000001 or y + h > 1.0000001:
        raise ValueError(f"Protected bounds outside image: {bounds}")


def validate_inventory(inventory):
    scenes = inventory["scenes"]
    canonical = read_json(BATCH / "canonical-scenes.json")
    if len(scenes) != 79 or len({s["id"] for s in scenes}) != 79:
        raise ValueError("Expected exactly 79 uniquely reviewed canonical scenes")
    if {s["id"] for s in scenes} != {s["id"] for s in canonical}:
        raise ValueError("Reviewed scene IDs differ from the canonical snapshot")
    if sum(s["kind"] == "background" for s in scenes) != 57:
        raise ValueError("Expected all 57 backgrounds")
    ids = inventory["portrait_ids"]
    if len(ids) != 12 or len(set(ids)) != 12:
        raise ValueError("Expected 12 distinct portrait adaptations")
    original = {s["id"]: s for s in canonical}
    for scene in scenes:
        if scene["original_path"] != original[scene["id"]]["path"]:
            raise ValueError(f"Original path changed: {scene['id']}")
        check_bounds(scene["original_bounds"])
        check_bounds(scene["protected_bounds"])
        focus = scene["focal_point"]
        if set(focus) != {"x", "y"} or any(not math.isfinite(v) or not 0 <= v <= 1 for v in focus.values()):
            raise ValueError(f"Invalid focus: {scene['id']}")
        if not scene["review_note"].strip():
            raise ValueError(f"Missing individual review: {scene['id']}")
        for key in ("original_path", "mobile_path"):
            resolve_asset(scene[key])
        if scene["id"] in ids:
            expected = f"public/assets/art/portrait/{scene['id']}.webp"
            if scene["mobile_path"] != expected or (scene["width"], scene["height"]) != (960, 1200):
                raise ValueError(f"Invalid portrait output: {scene['id']}")
        elif scene["mobile_path"] != scene["original_path"] or (scene["width"], scene["height"]) != (1600, 900):
            raise ValueError(f"Reuse must preserve the original image: {scene['id']}")


def check_originals():
    baseline = read_json(BATCH / "original-art-baseline.json")
    if len(baseline) != 220:
        raise ValueError("Expected the 220-file original-art baseline")
    for name, expected in baseline.items():
        actual = file_record(resolve_asset(name))
        if actual["sha256"] != expected["sha256"] or actual["bytes"] != expected["bytes"]:
            raise ValueError(f"Original art changed: {name}")


def normalize_portrait(image):
    if abs(image.width / image.height - 0.8) > 0.01:
        raise ValueError(f"Master is not composed at 4:5: {image.size}")
    if image.mode == "RGBA" and image.getchannel("A").getextrema() != (255, 255):
        raise ValueError("Scene master unexpectedly contains transparency")
    # Native outputs differ from exact 4:5 by fractions of a pixel. Fit removes
    # only that rounding edge; it must never turn a landscape image into a portrait.
    return ImageOps.fit(image.convert("RGB"), (960, 1200), Image.Resampling.LANCZOS)


def render_module(inventory):
    table = {}
    for scene in inventory["scenes"]:
        table[scene["id"]] = {
            "originalBounds": scene["original_bounds"],
            "mobilePath": scene["mobile_path"].removeprefix("public/"),
            "width": scene["width"], "height": scene["height"],
            "focus": scene["focal_point"], "bounds": scene["protected_bounds"],
        }
    return '''// Generated by scripts/mobile-art.py from the individually reviewed inventory.
// Desktop image URLs and bytes remain unchanged. All coordinates are normalized.
import type { AssetFocalPoint, AssetProtectedBounds, MobileAssetVariant } from "../engine/types";
import { appPathname } from "../pwa/basePath";

export interface MobileArtOverride {
  readonly mobile?: MobileAssetVariant;
  readonly protectedBounds?: AssetProtectedBounds;
  readonly focalPoint?: AssetFocalPoint;
}

interface ReviewedScene {
  readonly originalBounds: AssetProtectedBounds;
  readonly mobilePath: string;
  readonly width: number;
  readonly height: number;
  readonly focus: AssetFocalPoint;
  readonly bounds: AssetProtectedBounds;
}

const reviewedScenes: Readonly<Record<string, ReviewedScene>> = ''' + json.dumps(table, indent=2) + ''';

const defaultBaseUrl = (): string =>
  (import.meta as ImportMeta & { readonly env?: { readonly BASE_URL?: string } }).env?.BASE_URL || "/";

export const createMobileArtOverrides = (baseUrl = defaultBaseUrl()): Readonly<Record<string, MobileArtOverride>> =>
  Object.fromEntries(Object.entries(reviewedScenes).map(([id, scene]) => [id, {
    protectedBounds: scene.originalBounds,
    mobile: { url: appPathname(scene.mobilePath, baseUrl), width: scene.width, height: scene.height,
      focalPoint: scene.focus, protectedBounds: scene.bounds },
  }]));

export const mobileArtOverrides = createMobileArtOverrides();
'''


def build_manifest(inventory):
    portraits = []
    for asset_id in inventory["portrait_ids"]:
        record_path = BATCH / "records" / f"{asset_id}.json"
        record = read_json(record_path)
        if record["asset_id"] != asset_id or record["tool"] != "image_gen.imagegen" or not record["selected"]:
            raise ValueError(f"Invalid generation provenance: {asset_id}")
        if len(record["referenced_image_paths"]) != len(record["reference_roles"]) or not record["prompt"].strip():
            raise ValueError(f"Incomplete prompt/reference record: {asset_id}")
        source = resolve_asset(record["source_path"])
        output = ROOT / "public/assets/art/portrait" / f"{asset_id}.webp"
        with Image.open(source) as opened:
            normalize_portrait(opened)
            source_size = list(opened.size)
        with Image.open(output) as opened:
            if opened.size != (960, 1200) or opened.format != "WEBP" or opened.mode != "RGB":
                raise ValueError(f"Invalid deployed portrait: {asset_id}")
        if not 0 < output.stat().st_size < MAX_BYTES:
            raise ValueError(f"Portrait exceeds offline asset ceiling: {asset_id}")
        portraits.append({"id": asset_id, "source": file_record(source), "source_dimensions": source_size,
                          "output": file_record(output), "generation_record": file_record(record_path),
                          "references": [file_record(resolve_asset(p)) for p in record["referenced_image_paths"]]})
    rejected = []
    for record_path in sorted((BATCH / "records").glob("*-rejected.json")):
        record = read_json(record_path)
        if record["selected"] or not record.get("rejection_reason"):
            raise ValueError(f"Invalid rejected-attempt record: {record_path.name}")
        rejected.append({"generation_record": file_record(record_path),
                         "source": file_record(resolve_asset(record["source_path"])),
                         "references": [file_record(resolve_asset(p)) for p in record["referenced_image_paths"]]})
    return {"schema_version": 1, "processor": "scripts/mobile-art.py", "export": inventory["export"],
            "reviewed_scene_count": len(inventory["scenes"]), "inventory": file_record(INVENTORY),
            "original_baseline": file_record(BATCH / "original-art-baseline.json"),
            "canonical_snapshot": file_record(BATCH / "canonical-scenes.json"),
            "mobile_module": file_record(MODULE), "portrait_count": len(portraits),
            "total_portrait_bytes": sum(p["output"]["bytes"] for p in portraits), "portraits": portraits,
            "retained_rejected_attempts": rejected}


def process(inventory):
    validate_inventory(inventory)
    check_originals()
    for asset_id in inventory["portrait_ids"]:
        record = read_json(BATCH / "records" / f"{asset_id}.json")
        with Image.open(resolve_asset(record["source_path"])) as opened:
            image = normalize_portrait(opened)
        output = ROOT / "public/assets/art/portrait" / f"{asset_id}.webp"
        output.parent.mkdir(parents=True, exist_ok=True)
        image.save(output, format="WEBP", quality=inventory["export"]["webp_quality"], method=6)
    MODULE.write_text(render_module(inventory), encoding="utf-8", newline="\n")
    write_json(MANIFEST, build_manifest(inventory))
    check_originals()


def validate(inventory):
    validate_inventory(inventory)
    check_originals()
    expected_files = {f"{i}.webp" for i in inventory["portrait_ids"]}
    if {p.name for p in (ROOT / "public/assets/art/portrait").glob("*.webp")} != expected_files:
        raise ValueError("Portrait output directory does not contain the exact approved batch")
    if MODULE.read_text(encoding="utf-8") != render_module(inventory):
        raise ValueError("Mobile metadata module is stale; run process")
    expected = build_manifest(inventory)
    if read_json(MANIFEST) != expected:
        raise ValueError("Portrait manifest differs from current bytes/provenance; run process")
    return expected


def font(size):
    for name in ("C:/Windows/Fonts/arial.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"):
        if Path(name).is_file():
            return ImageFont.truetype(name, size)
    return ImageFont.load_default()


def qa(inventory):
    folder = BATCH / "qa"
    folder.mkdir(exist_ok=True)
    groups = [("background", [s for s in inventory["scenes"] if s["kind"] == "background"]),
              ("cg", [s for s in inventory["scenes"] if s["kind"] == "cg"])]
    files = []
    for kind, scenes in groups:
        for page in range(math.ceil(len(scenes) / 12)):
            batch = scenes[page * 12:(page + 1) * 12]
            sheet = Image.new("RGB", (1440, math.ceil(len(batch) / 3) * 302), "#e8e0d5")
            draw = ImageDraw.Draw(sheet)
            for i, scene in enumerate(batch):
                image = Image.open(resolve_asset(scene["original_path"])).convert("RGB").resize((480, 270))
                bounds = scene["original_bounds"]
                d = ImageDraw.Draw(image)
                d.rectangle((bounds["x"] * 480, bounds["y"] * 270,
                             (bounds["x"] + bounds["width"]) * 480,
                             (bounds["y"] + bounds["height"]) * 270), outline="#7dffb0", width=2)
                x, y = (i % 3) * 480, (i // 3) * 302
                sheet.paste(image, (x, y))
                draw.text((x + 8, y + 276), scene["id"], fill="#211a14", font=font(16))
            target = folder / f"reviewed-{kind}-{page + 1}.jpg"
            sheet.save(target, quality=93)
            files.append(file_record(target))
    portraits = [s for s in inventory["scenes"] if s["id"] in inventory["portrait_ids"]]
    for page in range(3):
        sheet = Image.new("RGB", (1280, 435), "#e8e0d5")
        draw = ImageDraw.Draw(sheet)
        for i, scene in enumerate(portraits[page * 4:(page + 1) * 4]):
            image = Image.open(resolve_asset(scene["mobile_path"])).convert("RGB").resize((320, 400))
            b = scene["protected_bounds"]
            d = ImageDraw.Draw(image)
            d.rectangle((b["x"] * 320, b["y"] * 400, (b["x"] + b["width"]) * 320,
                         (b["y"] + b["height"]) * 400), outline="#7dffb0", width=2)
            sheet.paste(image, (i * 320, 0))
            draw.text((i * 320 + 5, 407), scene["id"], fill="#211a14", font=font(14))
        target = folder / f"portraits-{page + 1}.jpg"
        sheet.save(target, quality=94)
        files.append(file_record(target))
    write_json(folder / "contact-sheets.json", {"scene_count": 79, "portrait_count": 12, "files": files})


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=("process", "validate", "qa", "check"))
    command = parser.parse_args().command
    inventory = read_json(INVENTORY)
    if command == "process":
        process(inventory)
    if command in ("process", "validate", "qa", "check"):
        manifest = validate(inventory)
    if command in ("qa", "check"):
        qa(inventory)
    if command == "check":
        subprocess.run([sys.executable, "-B", str(ROOT / "scripts/test-mobile-art.py")], check=True)
    print(f"Mobile art {command}: 12 portraits, 79 reviewed scenes, {manifest['total_portrait_bytes']:,} new bytes; all 220 original files unchanged")


if __name__ == "__main__":
    main()
