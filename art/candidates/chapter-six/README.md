# Chapter 6 candidate art batch

This directory is the isolated approval workspace for **The Story I Wasn't
In** and **The Doorway**. Nothing here is deployable merely because it exists.
The locked School Years inventory and pipeline are not changed by this batch.

**Batch status (25 August 2026):** all 26 inputs passed deterministic processing
and validation, all nine QA sheets were reviewed at full size, and the approved
outputs were promoted to the canonical and public trees through the guarded
`--approved` command. Future source changes must repeat the workflow below.

## Fixed inventory

The production contract contains exactly 26 assets:

- Five backgrounds in `scenes/backgrounds`: `bg-raya-living-room-2016`,
  `bg-ns-camp-gate`, `bg-ns-bunk-night`,
  `bg-university-lecture-theatre`, and `bg-university-corridor`.
- Three CGs in `scenes/cg`: `cg-raya-first-sight`,
  `cg-relationship-montage`, and `cg-close-friends-reveal`.
- Eighteen source sprites in `characters/<family>/<expression>.png`:
  six `aleem-ns`, two `aleem-raya`, five `aleem-uni`, and five `nadiah`.

The historical `chapter-six` batch now supplies the combined story's
`chapter-ns` segment. Its source, normalized-master, candidate, and QA names
remain unchanged for provenance. Promotion maps the five blue-outfit
`aleem-uni` candidates to runtime IDs `aleem-uni-arrival-<expression>` and
`public/assets/art/characters/aleem-uni-arrival/`. The second-year green-outfit
`aleem-uni` family belongs to the later university chapter and is never
overwritten by this batch.

The existing `bg-hdb-dining`, `bg-dark-bedroom`, and `bg-dawn-window` remain
canonical retained assets used by the chapter; they are intentionally outside
this candidate inventory and are never reprocessed here.

The character processor accepts either genuine source alpha or the project's
approved vivid-magenta border key. Green-screen sources are not approved for
this batch because Aleem's NS clothing and Nadiah's palette contain green and
teal. Generated scenes must be PNG files at least 1600x900. Generated sprite
sources must be PNG files at least 768x900. As with the existing art pipeline,
the processing environment requires Python with Pillow and NumPy installed.

## Approval workflow

1. Review the identity, outfit, environment, and CG proofs. Nadiah must remain
   a wholly fictional person with no real-person likeness.
2. Place only the approved raw inputs in the fixed paths above.
3. Run `npm run art:chapter-six:process`. This writes normalized masters and
   deploy-shaped WebPs only below `processed/`; it does not mutate canonical
   sources or `public`.
4. Run `npm run art:chapter-six:validate`. The validator rejects missing and
   orphaned raster files, wrong dimensions or formats, bad alpha/corners,
   matte fringes, detached fragments, inconsistent baselines or centering,
   and files above the precache limit.
5. Run `npm run art:chapter-six:qa` and review every sheet in `qa/` at full
   size. `npm run art:chapter-six:check` performs steps 3-5 in order.
6. Complete the Chapter 6 manuscript/tone and art gates in
   `RELEASE_CHECKLIST.md`.
7. Only after explicit approval, run `npm run art:chapter-six:promote`. The
   promotion command validates again, then copies exactly these 26 outputs to
   `art/sources` and `public/assets/art`.

The QA package includes full sprite and scene overviews, light/dark/teal alpha
composites, an Aleem identity/outfit lineup, face-and-glasses close review,
and a dedicated Nadiah identity/hijab/expression review.

## Mandatory visual and tone gates

- The Army settings are generic: no real badge, unit insignia, formation
  identifier, weapon focus, readable signage, or national emblem.
- USS is represented only as an unbranded generic theme park. No copied
  Instagram interface, logo, handle, notification, or readable generated text
  appears in pixels.
- Nadiah's only non-hijab appearance is in `cg-close-friends-reveal`. Styling,
  lighting, and pose remain neutral. The image assigns no motive for her
  clothing choice and does not treat hijab as a moral barometer.
- The other man in the reveal remains unnamed, distant, and unidentifiable.
  His ethnicity is not a visual cause or moral signal.
- The university lecture theatre looks ordinary, diverse, and welcoming.
  Red markers and thought fragments are runtime HTML representing Aleem's
  subjective perception; they are never baked into the crowd artwork.
- No artwork diagnoses Aleem, depicts self-harm, or makes the university crowd
  objectively threatening.

Canonical prompt summaries and generation provenance live in
`art/prompts/provenance.md`.
