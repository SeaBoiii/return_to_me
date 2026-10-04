"""Regression checks for portrait export guards, not the generation implementation."""
import importlib.util
from pathlib import Path
import unittest

from PIL import Image

spec = importlib.util.spec_from_file_location("mobile_art", Path(__file__).with_name("mobile-art.py"))
art = importlib.util.module_from_spec(spec)
spec.loader.exec_module(art)


class MobileArtSafetyTests(unittest.TestCase):
    def test_landscape_master_is_rejected_instead_of_cropped(self):
        with self.assertRaises(ValueError):
            art.normalize_portrait(Image.new("RGB", (1600, 900)))

    def test_native_rounding_is_normalized_without_stretching(self):
        output = art.normalize_portrait(Image.new("RGB", (1122, 1402), "#725544"))
        self.assertEqual(output.size, (960, 1200))
        self.assertEqual(output.getpixel((480, 600)), (114, 85, 68))

    def test_invisible_scene_pixels_are_rejected(self):
        with self.assertRaises(ValueError):
            art.normalize_portrait(Image.new("RGBA", (960, 1200), (0, 0, 0, 0)))

    def test_outside_empty_and_nan_bounds_are_rejected(self):
        for b in ({"x": .8, "y": .1, "width": .3, "height": .4},
                  {"x": .2, "y": .1, "width": 0, "height": .4},
                  {"x": float("nan"), "y": .1, "width": .3, "height": .4}):
            with self.subTest(bounds=b), self.assertRaises(ValueError):
                art.check_bounds(b)

    def test_workspace_escape_is_rejected(self):
        with self.assertRaises(ValueError):
            art.resolve_asset("../outside.webp")

    def test_manifest_integrity_and_all_original_bytes(self):
        result = art.validate(art.read_json(art.INVENTORY))
        self.assertEqual(result["portrait_count"], 12)
        self.assertEqual(result["reviewed_scene_count"], 79)


if __name__ == "__main__":
    unittest.main()
