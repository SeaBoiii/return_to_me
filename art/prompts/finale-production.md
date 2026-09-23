# Final chapter: Nurulain

The final chapter of **Return to Me** continues from Mariam's introduction of
Nurulain through their first messages, Yakiniku date, growing friendship,
Kazakhstan trip, restaurant meeting with her parents, and mutual confession
beside the Kallang River. The epilogue ends with their engagement and ongoing
wedding preparation. It does not depict a wedding that has already happened.

## Art inventory

The shared `src/story/finale-art.json` inventory drives runtime asset metadata
and `scripts/finale-art.py`. This independent batch adds **14 deployed assets**:
seven Nurulain expressions, four backgrounds, and three CGs. They total
2,853,784 bytes (approximately 2.72 MiB); the largest is 240,354 bytes.

Nurulain's expressions are neutral, curious, amused, guarded, anxious, warm,
and moved. Her design follows the author's description, with golden-brown skin matching Aleem,
a warm dusty-rose full hijab covering her hair, neck, and chest, an opaque
baggy beige tunic with wrist-length sleeves, and a loose dark taupe long
skirt. Her deployed visible stature is 947 px beside Aleem at 1050 px,
representing the supplied 165 cm / 183 cm relationship.

Backgrounds establish Yakiniku, a generic Kazakhstan accommodation lounge,
the parents' restaurant, and the Kallang River pier at sunset. The CGs show
the four-person parents' meeting, the couple's sunset confession, and their
wedding preparation. The mother has a fuller build and warm round face in
modest hijab; the father is a slim Malay uncle in a collared shirt. Neither
parent requires a sprite family.

Existing adult-bedroom, city-cafe, waterfront-night, and airport-departure
art supports transitions. Aleem retains his established adult identity and
existing sprites: cream overshirt and teal T-shirt for casual scenes, green
collared shirt for the parents' meeting. Earlier assets are preserved.

## Generation and provenance

All new artwork was generated on 23 September 2026 using OpenAI's built-in
image generator, one call per asset or correction. The exact model is not
exposed by the tool. Prompts, reference roles, original output paths, and
generation records are retained in:

- [Nurulain sprite prompts](finale-sprites.md)
- [Background and CG prompts](finale-scenes.md)
- `art/sources/finale/sprites` and `art/sources/finale/scenes`

The first genuine-alpha request produced a visible halo, and the amused
variant also needed a background correction. Rejected outputs and their
exact metadata remain in `art/sources/finale/rejected`. Selected opaque
magenta sources use the established border-connected alpha matting and
edge cleanup. Subsequent expressions preserve the new neutral identity.

The restaurant interiors and Kallang scene are illustrative settings, not
claims about an exact venue or architectural survey. The Kazakhstan lounge
does not add a city, itinerary, landmark, or seasonal claim. Generated artwork
and derivatives remain all-rights-reserved project material.

## Reproducible processing

Run `npm run art:finale:check` to process, validate, and create contact sheets.
The `:process`, `:validate`, and `:qa` commands can also run separately.
The processor uses Pillow and NumPy through the existing `process-art.py`
helpers and only rewrites assets named in the finale inventory.

Normalized sprite masters are 1024×1536 RGBA PNG; deployed sprites are
768×1152 lossless WebP. Stature and horizontal centering are calibrated to a
shared baseline near 1532 px in masters and 1149 px in deployed files, with
small tolerances for antialiasing. Genuine source alpha is preserved when
usable; opaque flat-magenta sources use established matting.

The seven original scene PNGs are 1672×941. The processor normalizes them
to 2048×1152 scene masters and exports 1600×900 WebP. Every deployed file
must be nonempty and below the 8 MiB per-file PWA precache limit. The new
chapter's assets use preload group `chapter-11`; wedding planning uses
`epilogue`. Existing portrait CG presentation preserves each full scene.

## Art verification

On 23 September 2026, processing and physical validation passed for all
14 assets: file decoding, dimensions, alpha range, transparent corners,
stature, baseline, centering, and per-file precache size. Contact sheets in
`art/qa/finale` were generated and visually reviewed. The seven Nurulain
expressions retain identity, proportions, modest wardrobe, and clear
expression changes. Light and dark backgrounds show clean edges without
remaining magenta, checkerboards, or broad halos. Scene and CG masters were
also inspected individually for continuity, anatomy, lighting, and faces
clear of the dialogue area.

## Story and compatibility

The final story revision is `school-years-6.0.0`, with 803 nodes, 14 chapter
entries, 22 speaking identities, and 25 reflective choices. **A New Book**
uses internal chapter ID `chapter-11` and 93 nodes. Its three choices about
reciprocity, patience, and openness each rejoin before the next fixed event.
Readable routes contain approximately 3,300 words including choice text;
**Still Being Written** contains 287 narrated words before the final card.
The complete story has 25,126 line words and narrative digest `50f834b6`.

The v5-to-v6 migration resumes old introduction/continuation saves at
`ch11-001`, removing obsolete epilogue progress while preserving earlier
choices and replay positions. Readers who reached the old ending gain
access to the final chapter. Older migration chains retain their first unread
expansion. Story ID, storage keys, save schema, and installation identity
remain stable. Production voice entries and packs remain empty; all 775
voice-eligible lines are playable as subtitles.

## Browser review

The actual production app was captured at 1440×900 and 390×664 on
23 September 2026. All 14 screenshots in `art/qa/finale/screenshots` passed
automated image-decoding, overflow, choice-visibility, and CG-framing checks,
then desktop and mobile visual review. The review covers Mariam's
introduction, Yakiniku, a reflective choice, the parents' dinner, the sunset
confession, wedding planning, and the final card. Dialogue and choices are
readable, character identities and relative stature are consistent, and CG
faces remain visible above dialogue. The final card intentionally overlays
the background illustration.

To reproduce the captures, build and preview with
`BASE_PATH=/return-to-me-test/` on port 4173, then run
`npx tsx scripts/capture-finale-qa.ts` in another terminal. A different local
preview URL can be supplied as the first argument. The script also writes
`report.json` with scene IDs, decoded images, and layout outcomes.

## Automated verification

`npm run check` passed on 23 September 2026: ESLint, TypeScript, content
validation, all 165 unit tests across 15 files, the production build, and
57 browser tests. Three project-specific cases were intentionally skipped:
mobile touch and intrusive-thought checks in the desktop project, and the
full-route audit in the mobile project. The desktop full-route audit reaches
all 14 chapter entries and 25 reflective choices. Browser coverage includes
v5 continuation, older migration chains, completed-ending reload, all three
new CGs on portrait screens, and offline retrieval of the expanded artwork
and final ending. Geometry checks await the scene entrance animation and
reveal the full line before measuring the illustrated composition.

`npm run validate:deploy` also passed for the subtitles-only edition.
The PWA build precaches 233 entries; story validation resolves all 803 nodes
and 220 art assets. No runtime speech service, external account, or publishing
step is required to read the completed story.

This record documents implementation review; it does not assert publication
or the author's separate factual/tone approval in the release checklist.
