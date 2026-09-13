# Return to Me Art Bible and Provenance

This document records the production lineage for the artwork deployed in
**Return to Me: Before Nurul**. It is an authoring record, not a claim that
the fictionalised characters are complete portraits of real people.

## Generator and rights

- Generated on 24 July 2026 with OpenAI's built-in image generation tool. The
  tool did not expose an exact image-model name or version, so the model is
  recorded as **unspecified**.
- The Primary 6 Aleem/Alya proof established the visual direction first.
  Remaining character sheets, backgrounds, and CGs followed the same written
  bible.
- Generated narrative art and its processed variants are treated as
  all-rights-reserved project material. They must not be used to imply
  endorsement by a real person or school.

### JC expansion proof and production batch

- Four approval proofs were generated on 25 August 2026 with OpenAI's built-in
  image generation tool: JC Aleem, Syafiqa, Mei Lin, and a 2014 bus interior.
- The existing Aleem and Hana character sheets supplied identity/style
  references; the existing bus stop and language classroom supplied
  environment-style references.
- Full normalized proof prompts, reference relationships, proof paths, and QA
  findings are recorded in
  [the JC expansion proof record](../proofs/jc-expansion/README.md).
- After the first QA pass, Aleem and Mei Lin received identity-preserving
  revisions. The selected anchors are
  `aleem-jc-proof-v3-magenta.png` and
  `mei-lin-proof-v3-magenta.png`; both passed the second identity/outfit QA.
- Built-in true-alpha requests produced unusable opaque results and were
  excluded. The selected revisions use a non-green magenta key to protect the
  green/teal clothing, but still require tolerant matting and spill cleanup
  before any derived sprite can be deployed.
- The project owner approved the revised proof batch on 25 August 2026. The
  approved production inventory, source-cell mappings, normalized scene/CG
  briefs, processing contract, and current verification status are recorded in
  [the JC production record](jc-production.md).
- Five approved expression-sheet sources, a corrected hands-visible Mei Lin
  relaxed-pose source, nine background masters, and three CG masters have been
  generated. All 27 normalized sprite masters and 39 deployed JC assets pass
  the physical-file validator and focused manifest test. Final manual visual
  and tone QA passed on 25 August 2026; the JC production batch is
  release-ready.
- Before that final pass, the shared-earpiece CG was revised to keep a visible
  gap between independently dozing Aleem and Syafiqa, and the zoo-distance CG
  was revised to restore Aleem's approved green/cream casual outfit and Mei
  Lin's yellow casual outfit.

### Adulthood expansion

Chapters 6–8 add 26 adult character sprites, 11 backgrounds, and two CGs,
generated with the built-in OpenAI image generator on 10–11 September 2026.
The exact model is unspecified. Their shared inventory is
`src/story/adulthood-art.json`; the existing school and JC inventories remain
separate. See [sprite prompts](adulthood-sprites.md),
[scene prompts](adulthood-scenes.md), and the
[production and QA record](adulthood-production.md).

Adult Aleem preserves his established face, glasses, complexion, and lean
build. Jia Wen, Claire, and Imran have distinct fictional adult identities.
The new chapter ends at arrival in the holy land and contains no pilgrimage
or prayer artwork. Initial painted-checkerboard sprite requests are retained
as rejected sources and are never deployed. Selected keyed sprites receive
the existing tolerant matting and spill cleanup before deployment.

## Style bible

- Soft, semi-realistic cel shading with crisp silhouettes, restrained line
  work, natural facial proportions, and readable expressions at mobile size.
- Singapore school and housing cues are generic and period-conscious. Schools
  have no real names, crests, badges, or identifiable architecture.
- Characters are age-appropriate and nonsexual. Poses are natural half-body or
  three-quarter visual-novel poses; no glamour framing.
- No readable generated text, trademarks, logos, watermarks, Minecraft assets,
  copied UI, or recognisable game textures. SMS, server, and result details are
  rendered later as accessible HTML overlays.
- Colour script:
  - Primary Six memories: warm nostalgic gold with light-blue uniform accents.
  - Wrong SMS: cool phone-light blue.
  - Third-language class: bright teal and green afternoon light.
  - Server period: electric blue with warm monitor highlights.
  - Results and withdrawal: desaturated blue-grey.
  - Epilogue: gentle dawn gold returning through cool shadows.

## Identity anchors

### aleem-p6

Twelve-year-old Boyanese Malay boy in 2009; short and round, with short dark
hair, glasses, a cute youthful face, and a generic light-blue primary-school
uniform. Expressions deployed: neutral, shy smile, surprised, hurt, and
reflective.

### alya

Malay Primary Six girl with long braided dark hair, slightly larger expressive
eyes, and the same generic light-blue school palette. Her expressions remain
playful or remorseful rather than villainous: neutral, smile, playful, startled,
and apologetic.

### aleem-sec

Aleem in 2011–2013 after a growth spurt: tall and skinny, short dark hair,
glasses, recognisably related to the younger design, and wearing an unnamed
boys' school's plain white uniform. Expressions deployed: neutral, nervous,
smile, confused, guilty, tired, and devastated.

### aleem-home

The same secondary-school Aleem in modest home clothes at his computer.
Expressions/poses deployed: focused, proud, distracted, and numb.

### hana

Tall Malay secondary-school girl with glasses and long straight dark hair. She
wears her own generic white-and-navy school uniform at the external class.
Expressions deployed: neutral, curious, shy, smile, disappointed, and distant.

### faris

Short, round secondary-school boy with short fluffy dark hair and glasses,
wearing the same plain white boys' school uniform as Aleem. Expressions
deployed: neutral, encouraging, and confident.

### aleem-jc and aleem-casual

Aleem at 17–18, preserving the secondary-school anchor's Boyanese Malay
identity, warm brown skin, short dark hair, rectangular glasses, cute gentle
features, and tall skinny build. JC clothing uses the fictional white,
charcoal, and muted-teal palette; zoo clothing is a forest-green overshirt,
cream T-shirt, and dark navy chinos. The approved production set contains eight
JC expressions and four casual expressions.

### syafiqa

Distinct tall Malay JC student with warm medium-brown skin, expressive dark
eyes, no glasses, and long dark hair in a low ponytail. She wears the same
fictional JC palette. The approved production set contains six expressions.

### mei-lin-jc and mei-lin-casual

Distinct, very short Chinese JC student with a fair-to-light warm complexion,
long straight dark hair, and round dark glasses. Her uniform uses the fictional
JC palette; zoo clothing is a pale-yellow blouse and dark navy jeans. The
approved production set contains five JC and four casual expressions. A
generated hidden-hands relaxed zoo pose is explicitly rejected and replaced by
a separate hands-visible source.

## Generation relationships and limitations

1. The first Primary 6 Aleem/Alya style proof established rendering, uniform
   simplicity, age treatment, line weight, and palette.
2. Each character/outfit set was generated as one expression sheet from its
   written identity anchor and the shared style bible. The deployed expressions
   were split from those sheets and had their chroma-key background removed
   with the image-generation skill's helper.
3. These were **not** image-to-image identity-preserving edits. Consistency
   comes from a shared written anchor and same-sheet generation, so minor
   expression-to-expression drift remains a known limitation.
4. Backgrounds and key CGs were fresh generations guided by the same written
   bible and colour script. They do not contain story text; UI overlays supply
   that information accessibly.
5. Exact raw tool request payloads were not exported by the generator. The
   prompt summaries below are the canonical production descriptions and should
   be used when regenerating an asset.
6. The 25 August 2026 JC production batch uses the approved revised anchors as
   direct identity/outfit references. Its complete relationship graph and cell
   mappings are recorded in `art/prompts/jc-production.md`.

## Character prompt family

The common character request was: soft semi-realistic cel-shaded visual-novel
character sheet; the relevant identity anchor above; age-appropriate half-body
poses; consistent face, hair, glasses, body shape, and clothing across named
expressions; crisp silhouette; soft studio light; flat chroma-key background;
no text, logo, badge, watermark, or sexualised treatment.

Reserve variants exist in the deployed source set but are intentionally not
addressed by the current story graph: `aleem-p6/cheerful.webp`,
`aleem-sec/reflective.webp`, and `alya/sad.webp`.

## Background and CG prompt summaries

All scenes use a 16:9 visual-novel composition with useful negative space for
sprites and dialogue UI, no visible brand marks, and no readable generated
text.

### bg-primary-classroom

Warm 2009 Singapore primary classroom, light-blue accents, ceiling fans, rows
of desks, nostalgic late-morning gold.

### bg-primary-corridor

Sunlit generic primary-school corridor and courtyard, warm gold, quiet space for
two students after class.

### bg-graduation-gate

Unnamed primary-school entrance at graduation, celebratory but bittersweet,
generic decorations and no crest or readable signage.

### bg-bus-stop

Singapore neighbourhood bus stop after graduation, diverging routes suggested
through composition, gentle overcast-to-gold transition.

### bg-bedroom-2009

Modest period-appropriate bedroom in 2009, simple mobile phone glow, unfinished
schoolwork, cool blue evening light, no readable screen.

### bg-boys-classroom

Plain unnamed boys' secondary-school classroom, white-uniform palette, orderly
desks and subdued daylight.

### bg-language-classroom

Bright classroom at a mixed school hosting an external third-language class,
teal accents, students' home-school identities implied without real badges.

### bg-language-courtyard

Leafy generic school courtyard after language class, warm afternoon sun and
space for two or three half-body sprites.

### bg-bedroom-pc-day

Secondary-school Aleem's modest bedroom and computer setup by day, original
block-inspired shapes on blank monitors, creative and industrious mood.

### bg-bedroom-pc-night

The same workspace at night in electric blue, growing clutter and schoolbooks,
monitor content abstract and unbranded.

### bg-exam-hall

Generic O-Level examination hall, repeated desks, wall clock, anxious stillness,
no readable paper or school identifiers.

### bg-results-hall

Generic school hall on results day, desaturated blue-grey palette and negative
space around the central subject.

### bg-dark-bedroom

The same bedroom during withdrawal, curtains mostly closed, computer dark,
quiet blue-grey shadows without depicting self-harm or a clinical diagnosis.

### bg-dawn-window

Soft dawn entering through a bedroom window, cool shadows yielding to warm
light, reflective and open-ended.

### cg-wrong-message

Young Aleem reacting to an unexpected SMS in cold phone light; phone screen
unreadable so the accessible HTML SMS overlay remains authoritative.

### cg-server-night

Teenage Aleem absorbed in late-night server administration, electric-blue
monitor light, original abstract block-world cues only, no game logo or copied
interface.

### cg-results

Teenage Aleem receiving a disappointing O-Level outcome in a muted hall; paper
has no readable grades, preserving privacy and leaving the HTML results overlay
authoritative.

## JC expansion prompt summaries

The nine approved JC backgrounds are `bg-hdb-dining`, `bg-jc-walkway`,
`bg-jc-classroom`, `bg-bus-interior-morning`,
`bg-bus-interior-evening`, `bg-jc-study-area`, `bg-a-level-results`,
`bg-zoo-path`, and `bg-zoo-shelter`. The three approved CGs are
`cg-shared-earpiece`, `cg-syafiqa-sighting`, and `cg-zoo-distance`.

Their canonical prompts, layout rules, focal points, identity relationships,
and narrative safeguards are in [the JC production record](jc-production.md).
In particular, relatives, Daniel, the confession-montage girls, and the
upcoming relationship remain offscreen; the boy in Syafiqa's sighting is
entirely offscreen and unidentifiable.

## Files and processing

| Asset family | Generated/source path | Deployed path | Deployed dimensions |
| --- | --- | --- | --- |
| Background masters | `art/sources/bg-*-master.png` | `public/assets/art/backgrounds/*.webp` | 1600×900 |
| CG masters | `art/sources/cg-*-master.png` | `public/assets/art/cg/*.webp` | 1600×900 |
| Character sheets/variants | `art/sources/characters/*-expression-master.png` | `public/assets/art/characters/<anchor>/*.webp` | Manifest-defined; new JC sprites target 768×1152 |
| Normalized JC sprite masters | `art/sources/characters/normalized/<family>/*-master.png` | `public/assets/art/characters/<family>/*.webp` | 1024×1536 source; 768×1152 deployed |

The original 2009–2013 background and CG masters are 1672×941 PNG files. New JC
scene/CG generations are normalized to exact 2048×1152 PNG masters. The
deterministic `scripts/process-art.py background` command remains available for
the original scenes; the `jc-scenes` command normalizes the new masters and
exports 1600×900 WebP. Character sheets are split and encoded as lossless WebP
after chroma-key removal. Deployed dimensions are recorded exactly in
`src/story/artManifest.ts`.

The JC sources use an uneven opaque magenta key because true-alpha requests to
the built-in generator were unusable. Their deterministic path requires
border-connected tolerant matting, a small edge feather, magenta despill, and
normalization on a shared scale-calibrated canvas. This is an approved
technical fallback, not permission to change generators or use an API/CLI
transparency workflow.

## Review checklist

- Confirm age, body shape, glasses, hair, and uniform palette against the
  identity anchor before accepting a regeneration.
- Reject real school insignia, readable generated text, logos, watermarks,
  copied game UI/textures, or accidental mature framing.
- Check transparent sprite edges at dark and light backgrounds, especially
  braided/long/fluffy hair and glasses.
- Confirm every story ID is mapped exactly once and every deployed file exists.
  `src/art/manifest.test.ts` checks logical coverage, nested GitHub Pages URLs,
  dimensions/metadata, and engine validation.
- Run `python -B scripts/validate-jc-art.py` after any JC art reprocessing. It
  checks the 27 normalized and deployed sprites, 12 scene/CG masters, deployed
  dimensions, alpha/corners, stature calibration, baselines, centering, and the
  PWA precache size ceiling.
- A factual and tone review remains required before publishing changed art.
