# Umrah expansion: Peace, Then a Name

Return to Me: Before Nurul, story revision `school-years-5.0.0`.
This independent batch supports displayed Chapters 10–11, **The Same Girl**
and **What I Could Finally Put Down**, and the brief **A Name** epilogue.
Internal chapter IDs are `chapter-9` and `chapter-10`; earlier IDs and the
existing epilogue IDs are retained.

## Narrative and continuity

The expansion follows the author's confirmed Makkah-then-Madinah order in
January 2026. Nadiah is the returning NS girlfriend. Kak Mariam and Abang Yusuf
are fictional pseudonyms for the married couple. Their ordinary kindness
precedes any introduction offer. Imran remains Aleem's travelling companion.

The Jabal Nur climb starts with five companions and leaves Aleem and Nadiah
together as their pace changes. The other three remain unnamed. On Jabal
Rahmah, Aleem recalls the tradition associating the place with Adam and Hawa's
reunion and wonders whether their encounter might be a sign.
[Saudipedia's account](https://saudipedia.com/en/jabal-al-rahmah) presents that
association as occurring in some narratives; the story preserves it as a
tradition Aleem knows. Neither climb adds cave entry or a detailed ritual
sequence.

In Masjidil Nabawi, Aleem's small private doa reconstructs its meaning without
claiming exact remembered words. A breath escaping and his shoulders easing
express the release he remembers. Nadiah's perceived hesitation and longing
remain his inference about an attachment elsewhere. He quietly stops pursuing
a reunion while remaining kind. No messages, admission, other man's identity,
or confrontation are invented.

Four three-option choices change immediate dialogue or reflection and rejoin
before the next fixed event:

| Choice | Reconvergence |
| --- | --- |
| What to share on Jabal Nur, `ch9-choice-sharing` | `ch9-sharing-join` |
| What the Jabal Rahmah coincidence might mean, `ch9-choice-sign` | `ch9-sign-join` |
| What to release after prayer, `ch10-choice-release` | `ch10-release-join` |
| Understanding his quiet decision, `ch10-choice-boundary` | `ch10-boundary-join` |

Readable routes contain 2,343–2,349 words in Chapter 10 and 1,791–1,793 words
in Chapter 11. Across branches, the chapters contain 2,490 and 1,945 authored
words respectively. The complete story has 13 chapter entries, 707 nodes,
22 choices, and 19 speaking identities. Narrative snapshot: `00793920`.

The final spoken line is Mariam's **“Her name is Nurulain.”** Only the
continuation card follows. Nurulain has no sprite or speaking identity; there
is no acceptance, contact exchange, photograph, message, or meeting.

## Art inventory and provenance

The shared `src/story/umrah-art.json` inventory drives both runtime metadata
and `scripts/umrah-art.py`. It contains 16 sprites, seven backgrounds, and
three CGs. The existing arrival background and Imran sprites are reused.
The 26 deployed files total 7,051,150 bytes (approximately 6.72 MiB); the
largest is 357,042 bytes. The complete runtime inventory now contains 206 art
assets.

| Sprite family | Expressions | Visible deployed height |
| --- | --- | --- |
| Aleem in his established travel outfit | neutral, surprised, warm, reflective, relieved, resolved | 1,050 px |
| Contemporary Nadiah in hijab and modest travel clothing | neutral, warm, amused, hesitant, wistful | 977 px |
| Kak Mariam | neutral, warm, encouraging | 956 px |
| Abang Yusuf | neutral, warm | 1,029 px |

Backgrounds cover the shared group area, Makkah mosque courtyard, Jabal Nur
ascent and resting point, Jabal Rahmah, Madinah courtyard, and Masjidil Nabawi
interior. The three CGs depict Aleem and Nadiah on each climb and Aleem's
private prayer and release.

OpenAI's built-in image generator is used for every selected generation;
the exact model is not exposed by the tool. Exact prompts, dates, source
locations, and reference roles are recorded in:

- [Aleem's six expressions](umrah-aleem-sprites.md)
- [Nadiah, Mariam, and Yusuf](umrah-support-sprites.md)
- [Seven backgrounds and three illustrations](umrah-scenes.md)

Aleem and Nadiah retain their existing fictional identities, aged into the
January 2026 scenes. Mariam and Yusuf have distinct fictional adult designs.
The soft, semi-realistic cel-shaded style follows the established artwork.
No new art depicts Nurulain. Generated art and derivatives remain
all-rights-reserved project material.

## Reproducible processing

Raw generation masters and metadata live in `art/sources/umrah`. The
`normalized` subdirectory contains 1024×1536 RGBA sprite masters and
2048×1152 scene masters. Deployed sprites in `public/assets/art/characters`
are 768×1152 lossless WebP; backgrounds and CGs are 1600×900 WebP.

Unusable checkerboard and halo transparency attempts are retained in
`art/sources/umrah/rejected`. Selected magenta sources use the existing
border-connected matting, edge treatment, and spill cleanup. Genuine source
alpha is preserved when usable. Sprite stature is calibrated on a common
baseline near 1,149 px in the deployed canvas, with a small tolerance for
antialiased edges. Every deployed file must be nonempty and below the
8 MiB per-file PWA precache limit.

Run `npm run art:umrah:check` to process, validate, and create contact sheets.
The `:process`, `:validate`, and `:qa` commands can also run separately. This
pipeline only rewrites the Umrah inventory. Review sheets are stored in
`art/qa/umrah`; browser captures belong in its `screenshots` directory.
The complete 26-asset batch passed physical validation on 15 September 2026:
dimensions, alpha, transparent corners, relative stature, common baseline,
centering, and the per-file precache limit.

## Save and playback compatibility

The v4→v5 migration is appended to the existing registry. Old arrival
epilogue saves resume at `ch9-001`; obsolete epilogue history, seen nodes,
choices, and unlocks are cleared. Earlier replay positions and choices remain
intact, with the new chapter unlocked when the old arrival was reached.

Chaining preserves the original destinations: first edition → Chapter 3;
JC edition → National Service; NS-only v3 → Almost Us; adulthood v3 and merged
v4 arrival saves → The Same Girl. Story ID, storage keys, installation
identity, engine, and save schema remain unchanged.

Mariam and Yusuf have voice-profile declarations, and Aleem's and Nadiah's
directions cover these scenes. Playback remains subtitle-only with no
production voice clips. Publication and audio production are outside this
expansion.

## Verification record

On 15 September 2026, `npm run check` passed lint, typechecking, story/content
validation, all 136 unit tests across 15 files, the production build, and
49 browser tests. Three project-specific browser cases were intentionally
skipped: touch-flow and intrusive-thought mobile layout in the desktop
project, and the desktop full-route audit in the mobile project. Content
validation counted 707 nodes, 206 art assets, and 682
voice-eligible subtitle lines, with zero production voice clips. The PWA
build precaches 219 entries.

Coverage includes all four branch reconvergences, route word budgets,
chronology and remembered milestones, inferred longing and quiet withdrawal,
the exact final name reveal, and the single continuation ending. Save tests
cover unfinished, completed, epilogue, and replay positions through every
supported revision chain. Browser tests include desktop/mobile CG framing,
the complete story route, old arrival-save upgrades, replay preservation,
the name-to-continuation sequence and reload, and offline art retrieval with
a saved Madinah resume.

All four sprite contact sheets and the scene overview passed visual review
on 15 September. Identity, wardrobe, expression distinctions, stature,
visible hands, and light/dark alpha edges are consistent. No residual
magenta, checkerboard, or broad halo appears in the processed cutouts.
The three illustrations preserve the characters' faces above the dialogue
area; the prayer image uses ordinary light and a relaxed posture.

On 16 September 2026, `npm run validate:deploy` passed for the subtitle-only
edition. Fourteen [browser screenshots](../qa/umrah/screenshots) at 1440×900
and 390×664 were captured and visually reviewed: the reunion, the married
couple, both mountain CGs, the prayer CG, a reflective choice, and the final
name reveal. All images decoded, and no horizontal overflow occurred.
Dialogue and all three choice options remain readable; faces and the main
illustrated action remain clear of the dialogue panel. The established
portrait CG treatment preserves the complete wide composition. Non-speaking
characters' reduced opacity is intentional runtime styling, separate from
the reviewed sprite alpha edges.

`git diff --check` also passed. No product code changes were needed after the
successful automated suite or visual review.

This record documents implementation review; it does not assert publication
or the author's separate factual approval in the release checklist.
