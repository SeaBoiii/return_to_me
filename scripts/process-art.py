"""Deterministic local post-processing for generated visual-novel artwork."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def split_sheet(source: Path, destination: Path, names: list[str], columns: int) -> None:
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

    args = parser.parse_args()
    if args.command == "split-sheet":
        split_sheet(args.source, args.destination, args.names, args.columns)
    else:
        background(args.source, args.destination)


if __name__ == "__main__":
    main()
