# Mobile portrait artwork

This independent batch adds twelve newly composed portrait CGs for the mobile scene-above-dialogue layout. All 220 original artwork files remain byte-for-byte unchanged, including every desktop CG, background and approved character sprite. No backgrounds were generated.

The built-in `image_gen.imagegen` tool generated one scene per request, using the original scene as the primary action/style reference and approved character sprites as identity references. Every target and character reference was visually inspected before generation. Native generated PNGs are retained in `sources/`; exact prompts, reference roles, tool output paths and selection decisions are in `records/` and collected in [prompts.md](prompts.md). Thirteen calls produced twelve selected images and one retained rejected zoo attempt whose prompt named the wrong companion. The selected zoo image uses Mei Lin's correct approved casual sprite.

## Runtime inventory

- Twelve new opaque WebPs: `public/assets/art/portrait/<canonical-cg-id>.webp`, each **960×1200 (4:5)**, quality 86/method 6, individually below the 8 MiB offline ceiling.
- All **79 scene IDs** individually reviewed: **22 CGs** and **57 backgrounds**. The other ten CGs and all backgrounds reuse their original 1600×900 image bytes.
- [inventory.json](inventory.json) records each original path, mobile path, normalized focal point, protected bounds, reuse/generation strategy and a concrete composition review note.
- `src/story/mobileArt.ts` exports `mobileArtOverrides` and `createMobileArtOverrides(baseUrl)`. Paths use `appPathname`, including explicit nested application bases. The canonical art manifest merges these overrides; image selection and crop/contain decisions belong to the renderer.

Protected bounds describe what must survive a crop, not a mandatory rectangular crop. They include important faces and story props or gestures. The requested central region x8–92%, y20–80% was a composition target; actual reviewed bounds are recorded when a selected illustration extends beyond it. The montage, phone reveal, Raya clothing/snack composition and several paired landscape CGs therefore need contain on shallow screens. Decorative sky, plants, architecture edges and nonessential legs can crop when the protected area fits. Background bounds emphasize setting-defining landmarks instead of requiring the full landscape in every viewport.

The shared-earpiece CG protects both faces, earphone leads and phone. The three-person Jia Wen scene protects the couple's joined hands and Aleem's separate reaction. The parents' dinner protects all four faces. The Kallang scene protects both faces and conversational/lap hands. Wedding planning protects both faces, the writing hand and open notebook. The close-friends image deliberately preserves the original story detail that Nadiah is without hijab in the phone photograph; her identity reference does not override that action. The Syafiqa sighting preserves the approved original's two-person composition, including its existing limitation that the other boy mentioned in narration is outside the depicted scene.

## Processing and checks

```sh
python -B scripts/mobile-art.py process
python -B scripts/mobile-art.py validate
python -B scripts/mobile-art.py qa
python -B scripts/mobile-art.py check
```

`process` only exports this new batch and regenerates its TypeScript metadata and hash manifest. It rejects landscape masters instead of cropping them into fake portraits. Near 4:5 native rounding is normalized by a subpixel edge fit before resizing; no identity, pose or painted detail is edited by the processor. Native sources are retained unmodified.

`validate` checks exact 12-output coverage, all 79 metadata entries, normalized nonempty bounds, safe paths, generation provenance, native aspect ratio, output dimensions/format/size, current source/reference/output hashes, and the 220-file preservation baseline. `check` also regenerates contact sheets and runs six regression guards, including rejection of landscape masters, transparency, invalid bounds and escaping paths. The scene list snapshot and original-art baseline are independent review records; application tests validate the current canonical manifest integration.

`manifest.json` records source, reference, generation-record and output SHA-256 values and byte counts, including the retained rejected attempt. `qa/contact-sheets.json` hashes the labeled review sheets. Green rectangles are protected areas, not UI crops. `qa/visual-review.json` records the final human-visible composition inspection. Sprite comparison is retained as `qa/sprite-framing.jpg`; the primary-school Aleem/Alya difference is inherited canvas framing and is handled by stage sizing, not by modifying either original sprite.

## Offline integration

Both original and mobile URLs must participate in canonical content hashes, chapter artwork dependencies, size accounting and optional artwork downloads. Reused URLs must be deduplicated. The manifest's 12 new files add approximately 1.89 MiB to the unique art set. A portrait must never reference a Codex-generated source path at runtime. Keep the originals available for desktop, artwork history and mobile fallback; use the generated 4:5 asset only where the runtime chooses the mobile variant.

Final browser screenshots, chapter-pack caching and offline orientation switching are verified by the application's integration QA, separately from this image-production check. This record describes technical and visual inspection; it does not claim separate author approval of unseen generated images.
