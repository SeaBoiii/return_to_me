# JC expansion production record

This is the canonical production brief and status record for the approved
2014–2016 art expansion. The project owner approved the revised JC Aleem,
Syafiqa, Mei Lin, and bus-interior proof batch on **25 August 2026**
(approval date: `2026-08-25`).

## Generator, ownership, and status language

- All images in this batch are generated with OpenAI's default built-in image
  generator. The tool did not expose an exact image-model name or version, so
  the model is recorded as **unspecified**.
- Generation and source-file presence do not constitute release approval.
  An asset may be called deployed or release-ready only after it has been
  processed, mapped, physically validated, and visually reviewed.
- Generated source art and processed derivatives are treated as all-rights-
  reserved project material.
- Exact raw request payloads were not exported. The normalized prompt families
  in this file are the reproducible authoring record.

## Shared production direction

Use soft, semi-realistic cel-shaded visual-novel art with crisp silhouettes,
restrained line work, natural late-teen proportions, and mobile-readable
expressions. Character treatment must be age-appropriate and nonsexual.
Singapore cues are generic and period-conscious for 2014–2016.

Every image must avoid real school or zoo names, identifiable crests, badges,
route numbers, advertisements, readable generated text, trademarks, logos,
watermarks, copied interfaces, and recognisable game assets. Results, messages,
and any other story-bearing text remain accessible HTML overlays rather than
pixels in generated art.

For 16:9 scenes, keep the lower 38% suitable for the dialogue UI, place
important action within the central 70% mobile-safe area, and preserve useful
sprite lanes near 28%, 50%, and 72% of the frame width. Schools must not be
visually ranked as strong or weak.

## Approved anchor relationships

| Production family | Identity/outfit anchor | Supporting reference | Required continuity |
| --- | --- | --- | --- |
| JC Aleem | `art/proofs/jc-expansion/aleem-jc-proof-v3-magenta.png` | Existing `aleem-sec` sheet | Same Aleem, subtly aged to 17–18; tall and skinny; short dark hair; rectangular glasses; white/charcoal/muted-teal fictional JC uniform |
| Casual Aleem | Casual pose in the approved JC Aleem anchor | JC Aleem production sheet | Same face and build; forest-green overshirt, cream T-shirt, dark navy chinos |
| Syafiqa | `art/proofs/jc-expansion/syafiqa-proof.png` | Existing Hana/Aleem sheets for rendering style only | Distinct tall Malay girl; long dark hair tied back; no glasses; same fictional JC uniform |
| JC Mei Lin | `art/proofs/jc-expansion/mei-lin-proof-v3-magenta.png` | Existing Hana/Aleem sheets for age/rendering style only | Distinct very short Chinese girl; long straight dark hair; round dark glasses; same fictional JC uniform |
| Casual Mei Lin | Casual pose in the approved Mei Lin anchor | JC Mei Lin production sheet | Same identity and very short stature; pale-yellow blouse and dark navy jeans |
| Bus scenes | `art/proofs/jc-expansion/bus-interior-proof.png` | Existing bus stop and language-classroom masters | Generic 2014 Singapore bus cues, believable geometry, no operator or route identity |
| Other JC environments | Existing language-classroom, courtyard, results-hall, dark-bedroom, and dawn masters | Approved bus proof for the expansion's rendering language | Same visual bible, fictional places, uncluttered staging, no generated story text |

Aleem, Syafiqa, and Mei Lin share a scale-calibrated transparent canvas in the
processed set. Aleem is the tallest reference, Syafiqa reads at approximately
95% of his visible height, and Mei Lin at approximately 82%. Their feet/bottom
baseline must align even when a scene renders every sprite at the same CSS
height.

## Character prompt family and cell map

The common request for each sheet was: preserve the approved identity and
outfit; create clearly separated half-body or three-quarter visual-novel poses
with the named expressions; keep face, hair, glasses, build, clothing, and
lighting consistent; show complete hair, arms, and hands; use a flat vivid
magenta key field; add no props, text, logos, badges, watermark, floor, cast
shadow, or extra people.

The generator's opaque magenta is not perfectly uniform. Production uses
border-connected, tolerant hue/colour-distance matting, a small alpha feather,
and magenta-spill cleanup. Internal subject regions must be protected so muted
teal and green clothing survives. Edges must be reviewed against white, black,
and representative in-game scenes; reject pink hair/glasses fringes, eroded
dark outlines, or ambiguous fingers.

### JC Aleem — eight expressions

Source: `art/sources/characters/aleem-jc-expression-master.png`, four columns
by two rows.

| Cell | Logical asset |
| --- | --- |
| row 1, column 1 | `aleem-jc-neutral` |
| row 1, column 2 | `aleem-jc-smile` |
| row 1, column 3 | `aleem-jc-nervous` |
| row 1, column 4 | `aleem-jc-uncertain` |
| row 2, column 1 | `aleem-jc-hurt` |
| row 2, column 2 | `aleem-jc-focused` |
| row 2, column 3 | `aleem-jc-tired` |
| row 2, column 4 | `aleem-jc-relieved` |

### Syafiqa — six expressions

Source: `art/sources/characters/syafiqa-expression-master.png`, three columns
by two rows.

| Cell | Logical asset |
| --- | --- |
| row 1, column 1 | `syafiqa-neutral` |
| row 1, column 2 | `syafiqa-smile` |
| row 1, column 3 | `syafiqa-amused` |
| row 2, column 1 | `syafiqa-sleepy` |
| row 2, column 2 | `syafiqa-attentive` |
| row 2, column 3 | `syafiqa-gentle-firm` |

### JC Mei Lin — five expressions

Source: `art/sources/characters/mei-lin-jc-expression-master.png`, three
columns by two rows. The final cell is an unused reserve and is not part of the
27-asset production set.

| Cell | Logical asset |
| --- | --- |
| row 1, column 1 | `mei-lin-jc-neutral` |
| row 1, column 2 | `mei-lin-jc-focused` |
| row 1, column 3 | `mei-lin-jc-supportive` |
| row 2, column 1 | `mei-lin-jc-amused` |
| row 2, column 2 | `mei-lin-jc-disappointed` |
| row 2, column 3 | unused reserve |

### Casual Aleem — four expressions

Source: `art/sources/characters/aleem-zoo-expression-master.png`, two columns
by two rows.

| Cell | Logical asset |
| --- | --- |
| row 1, column 1 | `aleem-casual-neutral` |
| row 1, column 2 | `aleem-casual-smile` |
| row 2, column 1 | `aleem-casual-frustrated` |
| row 2, column 2 | `aleem-casual-patient` |

### Casual Mei Lin — four expressions

Sheet source: `art/sources/characters/mei-lin-zoo-expression-master.png`, two
columns by two rows. The sheet's top-right relaxed pose was rejected because
the hands were hidden. Its replacement is the hands-visible single-pose source
`art/sources/characters/mei-lin-zoo-relaxed-master.png`.

| Source | Logical asset |
| --- | --- |
| sheet row 2, column 2 | `mei-lin-casual-neutral` |
| corrected single-pose source | `mei-lin-casual-smile` |
| sheet row 2, column 1 | `mei-lin-casual-animated` |
| sheet row 1, column 1 | `mei-lin-casual-guarded` |
| sheet row 1, column 2 | rejected; do not deploy |

## Background prompt family — nine scenes

Each background is an empty 16:9 environment in the established visual bible,
with believable Singapore-period architecture, the shared staging lanes, and
no readable or identifying content.

| Asset | Normalized production brief | Focal point |
| --- | --- | --- |
| `bg-hdb-dining` | Modest HDB dining area in subdued evening light; suggest family expectation through framing, school papers turned unreadably away, and an empty tense space rather than visible relatives or threatening imagery. | 0.58, 0.46 |
| `bg-jc-walkway` | Generic open-air JC walkway with tropical greenery, white/charcoal/muted-teal accents and early-morning light; welcoming but ordinary, with no prestige judgement. | 0.50, 0.45 |
| `bg-jc-classroom` | Unnamed JC classroom with ceiling fans, clean desks, blank boards, daylight, and three useful sprite lanes; no school identity or ranking cues. | 0.50, 0.46 |
| `bg-bus-interior-morning` | Approved bus geometry revised for believable seated/standing lanes; misty residential greenery and soft morning gold; no passengers, operator, route, advertisement, or readable sign. | 0.50, 0.46 |
| `bg-bus-interior-evening` | Identity-preserving lighting variant of the morning bus with exactly matching camera and geometry; cool blue-hour exterior and restrained warm cabin light. | 0.50, 0.46 |
| `bg-jc-study-area` | Quiet sheltered JC study area with paired tables, notebooks without readable marks, tropical daylight, and a disciplined, reciprocal-study mood. | 0.52, 0.46 |
| `bg-a-level-results` | Generic results-collection area with private papers turned blank/unreadable, hopeful but restrained daylight, and no exact grades, school identity, or visible people. | 0.50, 0.44 |
| `bg-zoo-path` | Generic tropical wildlife-park path with lush foliage, humid daylight, and wayfinding shapes too abstract to read; no zoo branding, named animals, enclosure spectacle, or crowds. | 0.50, 0.45 |
| `bg-zoo-shelter` | Shaded open-sided shelter belonging to the same generic tropical park; benches and foliage create quiet conversational distance without romance framing. | 0.52, 0.45 |

## CG prompt family — three scenes

CGs use the same 16:9 safe areas. They communicate remembered emotional beats,
while all factual text remains outside the image.

### cg-shared-earpiece

JC Aleem and Syafiqa sit side-by-side on the morning bus, tired and naturally
relaxed, sharing one period-plausible wired audio device with one earbud each.
They may be dozing but are not embracing. Keep the moment tender but ambiguous:
closeness does not promise romance. No device logo, screen text, song title, or
lyrics.

The first production render placed their heads too close together. The accepted
revision adds a clearly visible head-and-body gap so they doze independently
while still sharing the wired earpieces.

### cg-syafiqa-sighting

Aleem is in the foreground of the JC walkway, registering hurt and surprise.
Syafiqa is farther away and oriented toward an entirely offscreen,
unidentifiable boy. Show no face or body for him and no explicit romantic
contact. The image depicts only what Aleem saw, not the later-confirmed meaning
or a judgement of Syafiqa.

### cg-zoo-distance

Casual Aleem and Mei Lin occupy the shaded zoo space with visible emotional
distance after a long day. Mei Lin is guarded rather than cruel; Aleem contains
his frustration rather than confronting her. Daniel is absent. Preserve the
ambiguity that Aleem inferred a boundary which Mei Lin never confirmed.

The first production render drifted from the approved casual outfits. The
accepted revision restores Aleem's forest-green overshirt and cream T-shirt and
Mei Lin's pale-yellow blouse, preserving both identity anchors.

## Physical processing and QA contract

- Native scene and CG generations are normalized to exact 2048×1152 PNG
  masters, then exported as 1600×900 WebP.
- New character cutouts are first written as aligned 1024×1536 transparent PNG
  masters below `art/sources/characters/normalized/<family>`, then exported at
  768×1152 as RGBA WebP. Deployed target visible heights are approximately
  1050 px for Aleem, 998 px for Syafiqa, and 861 px for Mei Lin, with a common
  baseline near y=1148 and horizontal centre near x=384.
- Every deployed sprite must have genuine alpha and transparent corners.
- Every mapped file must exist below `public/assets/art`, remain under the PWA's
  8 MiB precache ceiling, and match the dimensions declared in the art
  manifest.
- Visual review must confirm identity, expression, age, outfit, relative
  stature, hand anatomy, clean edges, mobile-safe composition, story tone, and
  the absence of forbidden text/identifiers/branding.

## Batch inventory and verification status

The authorized batch contains **27 sprites, nine backgrounds, and three CGs**.
The five expression-sheet source files, corrected Mei Lin source, 27 normalized
sprite masters, nine 2048×1152 background masters, three 2048×1152 CG masters,
and all 39 deployed WebPs are present as of 25 August 2026.

`python -B scripts/validate-jc-art.py` passes for source/deployed dimensions,
decoding, sprite alpha, transparent corners, visible-height ratios, baselines,
centering, and the 8 MiB deployed-file limit. The focused
`src/art/manifest.test.ts` suite passes three tests for exact logical coverage,
nested-base URLs, metadata, and engine validation.

Final manual QA passed on 25 August 2026 after the two CG corrections above.
The reviewer inspected all 27 sprites against black, white, and teal contact
sheets, high-resolution risky hands and matte edges, and the refreshed
12-scene/CG contact sheet in `art/qa/jc-production`. Identity, anatomy,
relative stature, alpha edges, mobile/dialogue-safe framing, forbidden
text/branding constraints, and narrative tone were accepted. The complete JC
art batch is release-ready.
