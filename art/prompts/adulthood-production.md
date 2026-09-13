# Adulthood expansion production and review

Return to Me: Before Nurul, story revision `school-years-3.0.0`.
Artwork generated with OpenAI's built-in image generator on 10–11 September
2026; exact image model unspecified. Final visual review: 13 September 2026.
Generated art and derivatives are all-rights-reserved project material.

## Delivered inventory

The shared manifest at `src/story/adulthood-art.json` contains 26 sprites,
11 backgrounds, and two CGs. Runtime asset declarations and the physical
processor consume the same inventory. All 39 assets are deployed below
`public/assets/art`; raw generations and normalized masters remain below
`art/sources/adulthood`. The 39 deployed files total 10,160,486 bytes
(approximately 9.69 MiB); the largest is 346,618 bytes.

| Sprite family | Expressions | Visible deployed height |
| --- | --- | --- |
| University Aleem | neutral, smile, amused, nervous, jealous, hurt | 1050 px |
| Working Aleem | neutral, smile, nervous, hurt, drained | 1050 px |
| Travelling Aleem | tired, tentative, hopeful | 1050 px |
| Jia Wen | neutral, smile, amused, surprised, concerned | 861 px |
| Claire | neutral, smile, amused, firm, reflective | 977 px |
| Imran | neutral, encouraging | 1029 px |

See [sprite prompts and identity references](adulthood-sprites.md) and
[scene prompts and source paths](adulthood-scenes.md). New characters are
fictional adult portrayals. Aleem retains his established complexion, face,
hair, glasses and lean build across university, working and travel outfits.

## Processing

- Sprite masters are 1024×1536 RGBA PNG; deployed sprites are transparent
  768×1152 lossless WebP, sharing a bottom baseline near 1149 px. Target
  visible heights have a small tolerance for antialiased edges.
- Scene masters are normalized to 2048×1152 PNG and deployed at 1600×900 WebP.
- Initial RGB checkerboard outputs were rejected. Selected flat-magenta
  portraits use the existing border-connected matting and spill cleanup;
  genuine source alpha, if supplied, is retained instead of flattened.
- Raw sources are preserved. Reprocessing affects only the adulthood
  inventory. Every deployed file must be nonempty and below 8 MiB, the PWA's
  per-file precache limit.

Reproduce with `npm run art:adulthood:check`, or run the `:process`,
`:validate`, and `:qa` commands separately. Final physical validation passed
for all 39 assets: dimensions, alpha, transparent corners, relative stature,
common baseline, centering, and per-file size.

## Visual review

All six sprite contact sheets and the complete scene sheet were inspected
on light and dark backgrounds in `art/qa/adulthood`. Character identities,
expression changes, outfit continuity, hair/glasses edges and anatomy passed.
Jia Wen remains visibly shorter than Aleem. Claire's rejection expression is
gentle and firm. Aleem's jealous pose has one hand naturally in a pocket.

Fourteen browser screenshots in `art/qa/adulthood/screenshots` cover university
companionship, the boyfriend discovery, the USS confession, working life,
Claire's rejection, a reflective choice, and arrival, at 1280×800 and 390×844.
Sprites and text remain legible. The application's existing resting-speaker
opacity is intentional and separate from the sprites' alpha quality.

Portrait review exposed cropping of characters in the wide CGs. Portrait
screens now show the complete 16:9 illustration above the dialogue over a
subdued version of the same background. The boyfriend's handholding and all
three faces are visible; the confession preserves the distance between Aleem
and Jia Wen. Desktop composition is retained. The browser suite includes a
regression for both CGs.

The final arrival scene is a generic airport concourse. No city visiting order,
pilgrimage rituals, prayer scene, answered-prayer reveal, or meeting with Nurul
is depicted. Further events belong to the next chapter.

## Earlier asset repair

Content validation also found 32 earlier-chapter WebPs already referenced by
the committed manifest but absent from `public`. They were copied from their
existing counterparts in
`art/candidates/school-years-refresh/processed/deploy/assets/art`, preserving
all present public assets. Every restored file matches its candidate SHA-256;
the existing school-years physical validator passed before the copy. No
earlier artwork was regenerated for this repair.

Restored groups: seven backgrounds, five CGs, and 20 sprites. Their provenance
remains the [school-years refresh record](../candidates/school-years-refresh/README.md).
This repair makes the existing chapter graph buildable alongside the new
expansion.

## Final verification

On 13 September 2026, `npm run check` passed lint, typechecking, story/content
validation, all 84 unit tests, the production build, and 32 browser tests.
Two platform-specific browser cases were intentionally skipped. Browser
coverage includes save migration and replay, the complete chapter route,
both new CG compositions on desktop and mobile, and offline retrieval of all
39 adulthood assets with a saved arrival resume.

`npm run validate:deploy` passed with 502 story nodes, 154 registered art
assets, and 484 subtitle lines. No voice clips are present. The adulthood
physical art validation also passed for all 39 new files.

This record documents implementation review; it does not assert publication
or the author's separate factual approval in the release checklist.
