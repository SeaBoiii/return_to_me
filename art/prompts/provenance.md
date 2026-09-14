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

The adulthood chapters (now Chapters 7–9) add 26 adult character sprites,
11 backgrounds, and two CGs,
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

### School Years refresh proof and production batch

- Primary-school and secondary-school identity, outfit, and environment proofs
  were generated and approved before the full expression and scene batch.
- The selected inputs, exact prompt relationships, revisions, and production
  decisions are recorded in the
  [School Years production record](../candidates/school-years-refresh/README.md)
  and its linked prompt records.
- The production set contains 47 expression sprites across eight families,
  20 backgrounds, and eight cinematic CGs. The unchanged `bg-dawn-window`
  remains outside this 75-asset refresh.
- The deterministic pipeline produced normalized transparent sprite masters,
  normalized scene masters, and deploy-sized WebPs. The physical validator
  checks exact inventory, dimensions, alpha, corners, baselines, centering,
  relative stature, matte residue, detached fragments, and file-size budgets.
- The physical validator passed, the documented QA package was prepared, and
  the project owner approved promotion of the complete batch on 25 August
  2026. The 63 new, replacement, or normalized masters and all 75 WebPs were
  then promoted atomically to `art/sources` and `public/assets/art`; the 12
  retained background originals remained the canonical inputs used to build
  their refreshed deploy copies. Broader manual release-review items remain
  tracked in `RELEASE_CHECKLIST.md`.

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
uniform. Expressions deployed: neutral, smile, cheerful, surprised, nervous,
and reflective.

### alya

Malay Primary Six girl with long braided dark hair, slightly larger expressive
eyes, and the same generic light-blue school palette. Her expressions remain
playful or hopeful rather than villainous: neutral, smile, playful, shy, and
hopeful.

### aleem-young-home

The Primary Six Aleem identity in modest home clothes during the 2009-2010
feature-phone sequence. Expressions deployed: neutral, smile, waiting,
startled, and hurt.

### alya-young-home

The Primary Six Alya identity in modest home clothes during the mistaken-SMS
sequence. Expressions deployed: startled, apologetic, and sad.

### aleem-sec

Aleem in 2011–2013 after a growth spurt: tall and skinny, short dark hair,
glasses, recognisably related to the younger design, and wearing an unnamed
boys' school's plain white uniform. Expressions deployed: neutral, nervous,
smile, embarrassed, confused, defensive, guilty, tired, and devastated.

### aleem-home

The same secondary-school Aleem in modest home clothes at his computer.
Expressions/poses deployed: focused, proud, distracted, overwhelmed,
regretful, and numb.

### hana

Tall Malay secondary-school girl with glasses and long straight dark hair. She
wears her own generic white-and-navy school uniform at the external class.
Expressions deployed: neutral, curious, shy, smile, supportive, concerned,
disappointed, distant, and apologetic.

### faris

Short, round secondary-school boy with short fluffy dark hair and glasses,
wearing the same plain white boys' school uniform as Aleem. Expressions
deployed: neutral, teasing, encouraging, and confident.

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
7. The 25 August 2026 School Years refresh uses approved identity/outfit
   anchors as direct edit references for expression variants. It keeps 12
   original background masters as canonical inputs, adds eight new or
   replacement background masters, and adds eight CG masters. Exact source
   selections and prompt relationships are recorded under
   `art/candidates/school-years-refresh`.

## Character prompt family

The common character request was: soft semi-realistic cel-shaded visual-novel
character sheet; the relevant identity anchor above; age-appropriate half-body
poses; consistent face, hair, glasses, body shape, and clothing across named
expressions; crisp silhouette; soft studio light; flat chroma-key background;
no text, logo, badge, watermark, or sexualised treatment.

The approved deploy tree is synchronized exactly to the active manifest.
Legacy reserve variants removed by the refresh remain recoverable from Git
history but are not shipped or precached.

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

### bg-primary-canteen

Warm 2009 Singapore primary-school canteen with generic stalls and furniture,
nostalgic daylight, no readable signs, branding, or school identifiers.

### bg-graduation-gate

Unnamed primary-school entrance at graduation, celebratory but bittersweet,
generic decorations and no crest or readable signage.

### bg-bus-stop

Singapore neighbourhood bus stop after graduation, diverging routes suggested
through composition, gentle overcast-to-gold transition.

### bg-bedroom-2009

Modest period-appropriate bedroom in 2009, simple mobile phone glow, unfinished
schoolwork, cool blue evening light, no readable screen.

### bg-bedroom-2009-warm

The same modest 2009 bedroom in warm evening light before the messages become
less frequent, preserving layout and period cues without readable text.

### bg-alya-bedroom-2010

Fictionalized modest bedroom corner in 2010 where Alya reads and answers a
feature-phone message; warm domestic detail, no personal identifiers or
readable screen.

### bg-boys-classroom

Plain unnamed boys' secondary-school classroom, white-uniform palette, orderly
desks and subdued daylight.

### bg-boys-school-corridor

Empty open-air corridor at an unnamed boys' secondary school, generic
architecture and restrained daylight, with no crest, badge, or signage.

### bg-boys-classroom-overcast

The boys' secondary-school classroom under subdued overcast daylight, keeping
the original layout while shifting the emotional colour script cooler.

### bg-language-classroom

Bright classroom at a mixed school hosting an external third-language class,
teal accents, students' home-school identities implied without real badges.

### bg-language-classroom-late

The external language classroom late in the day, emptied into cool teal
shadows for a difficult conversation.

### bg-language-courtyard

Leafy generic school courtyard after language class, warm afternoon sun and
space for two or three half-body sprites.

### bg-language-corridor-rain

Generic external-school corridor during rain, with cool reflected light and no
identifying signs, badges, or readable text.

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

Generic fluorescent results-collection hall, desaturated blue-grey palette,
unreadable papers, and negative space around the central subject.

### bg-dark-bedroom

The same bedroom during withdrawal, curtains mostly closed, computer dark,
quiet blue-grey shadows without depicting self-harm or a clinical diagnosis.

### bg-dawn-window

Soft dawn entering through a bedroom window, cool shadows yielding to warm
light, reflective and open-ended.

### cg-wrong-message

Young Aleem reacting to an unexpected SMS in cold phone light; phone screen
unreadable so the accessible HTML SMS overlay remains authoritative.

### cg-first-confession

Primary Six Aleem and Alya speaking nervously in a school corridor, preserving
their approved identities and a respectful gap between them.

### cg-graduation-promise

Primary Six Aleem and Alya sharing a hopeful, bittersweet moment near their
unnamed school gate after graduation, with no readable school identifiers.

### cg-server-night

Teenage Aleem absorbed in late-night server administration, electric-blue
monitor light, original abstract block-world cues only, no game logo or copied
interface.

### cg-faris-wingman

Faris encouraging Hana on Aleem's behalf in a school courtyard while Aleem
waits at a respectful distance; approved identities and uniforms remain clear.

### cg-hana-breakup

Aleem and Hana having a quiet, balanced conversation in the late external-
language classroom, without villain framing or melodramatic physical contact.

### cg-o-level-exam

Teenage Aleem working under pressure in an unnamed O-Level examination hall;
papers, clock, and signs remain unreadable and unbranded.

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

## Chapter 6: Before Nurul production batch

The Chapter 6 raster candidates were generated on 25 August 2026 with
OpenAI's built-in ImageGen tool. No external image API or CLI was used. The
tool did not expose an exact image-model name or version, so the model remains
recorded as **unspecified**. Raw inputs, deterministic outputs, and nine QA sheets
are preserved under `art/candidates/chapter-six`. The 26 approved outputs were
promoted to the canonical and public trees on 25 August 2026 after physical-file
validation and full contact-sheet review. The reusable generation prompts and
source-to-candidate mapping are recorded in
[`generation-prompts.md`](../candidates/chapter-six/generation-prompts.md).

This is a separate 26-asset batch: five backgrounds, three CGs, and eighteen
expression sprites. It does not amend the locked School Years inventory.
The retained `bg-hdb-dining`, `bg-dark-bedroom`, and `bg-dawn-window` remain
canonical inputs for family support, grief, and adult reflection and are not
reprocessed in this batch.
Every generation uses the established soft, semi-realistic cel-shaded visual-
novel style, age-appropriate natural proportions, crisp silhouettes,
restrained lighting, and no readable generated text, logo, watermark, badge,
unit insignia, university identifier, copied interface, handle, or trademark.

Nadiah's appearance is wholly fictional, was not derived from a real person's
likeness, and must not be used to identify or imply endorsement by anyone. Her
hijab is an element of appearance rather than a moral signal. Her reason for
not wearing hijab in one remembered image is explicitly unknown.

### aleem-ns

Identity-preserving young-adult Aleem in a generic olive National Service
uniform, with no flag, name tape, rank, badge, unit patch, weapon, or formation
identifier. Six isolated three-quarter visual-novel expressions on genuine
alpha where usable, otherwise the approved vivid-magenta key: neutral, proud,
warm, stunned, hurt, and numb. Preserve his warm brown skin, short dark hair,
rectangular glasses, gentle features, and tall slim build across every output.

### aleem-raya

The same young-adult Aleem in a modest, unbranded navy baju melayu during Hari
Raya visiting. Two isolated three-quarter expressions: awed and shy-smile.
The performance conveys attraction and awkwardness without glamour framing.

### aleem-uni-arrival

The same young-adult Aleem in plain, unbranded university clothes. Five
isolated three-quarter expressions: neutral, guarded, frozen, overwhelmed,
and breathless. The physical response is depicted directly without diagnostic
symbols, medical language, horror distortion, or objective danger cues.

Original candidate and source files retain the `aleem-uni` family name.
Runtime IDs and public files use `aleem-uni-arrival` to keep this first-year
outfit separate from the later adulthood expansion's university sprites.

### nadiah

A wholly fictional young Malay woman with a distinct face and no real-person
likeness, wearing a dusty blue-grey hijab and modest cream-and-teal Hari Raya
outfit. Five isolated three-quarter expressions: neutral, warm, amused,
thoughtful, and guarded. Keep her agency, dignity, and ordinary humanity clear;
avoid seductive, deceitful, villainous, ashamed, or morally coded posing.

### bg-raya-living-room-2016

Warm 2016 Singapore HDB living room during Hari Raya visiting, with modest
festive fabrics, ketupat-inspired decorations, refreshments, layered domestic
detail, and useful negative space. No people, family identifiers, religious
text, brand packaging, logos, or readable signs.

### bg-ns-camp-gate

Generic Singapore National Service camp gate and parade-area edge in humid
daylight, with restrained concrete, shelter, trees, and open formation space.
No people, weapons, flags, unit emblems, crests, rank, real camp architecture,
readable signs, or national/service branding.

### bg-ns-bunk-night

Generic National Service bunk at night with aligned beds, lockers, ceiling
fans, practical fluorescent and cool window light, and space for one sprite.
No people, weapons, uniforms on display, unit markings, personal names,
readable notices, or institutional identifiers.

### bg-university-lecture-theatre

An unnamed university lecture theatre during freshman club recruitment. The
room is ordinary, diverse, and welcoming: anonymous volunteers and freshmen
talking naturally, with Malay women both wearing and not wearing hijab present
as ordinary members of the crowd. No red markers, menace, isolation, horror
lighting, club logo, university crest, readable sign-up text, or identifier.

### bg-university-corridor

Quiet, unnamed university corridor immediately outside a lecture theatre,
with practical daylight and enough space for a breathless Aleem sprite. No
people, dramatic pursuit cues, signs, logos, crests, or campus identifiers.

### cg-raya-first-sight

Wide 16:9 Hari Raya first-sight composition preserving young-adult Aleem and
the wholly fictional hijabi Nadiah. They notice each other across a warm,
busy HDB living room while remaining at a respectful distance. Attraction is
shown through eye line and a suspended ordinary moment, not destiny symbols,
glamour lighting, physical contact, or readable decoration.

### cg-relationship-montage

Restrained 16:9 composite memory of mutual warmth: calls around book-ins,
ordinary messages, and one public meeting. Balance Aleem and Nadiah's attention
and agency; the sequence is explicitly reconstructed rather than a verbatim
record. No readable messages, copied phone UI, logos, military identifiers,
possessive framing, foreshadowing, or villain coding.

### cg-close-friends-reveal

Generic 16:9 private-story reveal at an unbranded theme park. Nadiah appears
without hijab only in this CG, with neutral everyday styling and lighting,
standing beside an unnamed man who remains distant, turned away or otherwise
unidentifiable. Their pose does not confirm romance. No copied Instagram UI,
logo, handle, reactions, notification marks, USS branding, readable generated
text, ethnic caricature, shame lighting, seductive pose, or moral judgement.
Accessible HTML supplies the restricted-story context and states that Nadiah's
reason for not wearing hijab is unknown.

The fixed output inventory is:

- Backgrounds: `bg-raya-living-room-2016`, `bg-ns-camp-gate`,
  `bg-ns-bunk-night`, `bg-university-lecture-theatre`, and
  `bg-university-corridor`.
- CGs: `cg-raya-first-sight`, `cg-relationship-montage`, and
  `cg-close-friends-reveal`.
- Sprites: `aleem-ns-{neutral,proud,warm,stunned,hurt,numb}`,
  `aleem-raya-{awed,shy-smile}`,
  `aleem-uni-arrival-{neutral,guarded,frozen,overwhelmed,breathless}`, and
  `nadiah-{neutral,warm,amused,thoughtful,guarded}`.

The full approval and deterministic processing contract is recorded in the
[Chapter 6 candidate record](../candidates/chapter-six/README.md).

## Files and processing

| Asset family | Generated/source path | Deployed path | Deployed dimensions |
| --- | --- | --- | --- |
| Background masters | `art/sources/bg-*-master.png` | `public/assets/art/backgrounds/*.webp` | 1600×900 |
| CG masters | `art/sources/cg-*-master.png` | `public/assets/art/cg/*.webp` | 1600×900 |
| Superseded School Years expression sheets | `art/sources/characters/{aleem-p6,alya,aleem-sec,aleem-home,hana,faris}-expression-master.png` | Historical anchors retained for provenance; superseded as deploy inputs by the normalized School Years families | Generator-native |
| Later-chapter expression sheets | `art/sources/characters/{aleem-jc,aleem-zoo,mei-lin-jc,mei-lin-zoo,syafiqa}-expression-master.png` | Active source sheets for the JC and zoo production sprites | Generator-native |
| Approved School Years sprite inputs | `art/candidates/school-years-refresh/characters/**/*.png` | Processed into normalized masters | Generator-native |
| Approved Chapter 6 inputs | `art/candidates/chapter-six/{characters,scenes}/**/*.png` | Promoted after the explicit approval gate to the normalized canonical/public paths | Generator-native |
| Normalized production sprite masters | `art/sources/characters/normalized/<family>/*-master.png` | `public/assets/art/characters/<family>/*.webp` | 1024×1536 source; 768×1152 deployed |

The retained 2009–2013 background masters remain canonical 1672×941 PNG inputs.
New or replacement School Years scenes and all JC scene/CG generations use
exact 2048×1152 PNG masters. The deterministic `school-years` pipeline
normalizes the approved 47-sprite, 20-background, and eight-CG batch beneath
the candidate `processed` tree; after approval, new/replacement masters and all
75 deploy WebPs are synchronized to the canonical and public trees. The
`jc-scenes` command normalizes JC masters and exports 1600×900 WebP. Deployed
dimensions are recorded exactly in `src/story/artManifest.ts`.

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
- Run `npm run art:school-years:check` after any School Years reprocessing. It
  deterministically rebuilds the candidate batch, validates exact inventories
  and physical constraints, and regenerates the final-approval QA sheets.
- Run `npm run art:chapter-six:check` after any Chapter 6 candidate change. It
  processes and validates the independent 18-sprite/five-background/three-CG
  inventory and rebuilds its nine contact sheets without touching the locked
  School Years batch or deploy tree. Promotion is a separate explicit command.
- A factual and tone review remains required before publishing changed art.
