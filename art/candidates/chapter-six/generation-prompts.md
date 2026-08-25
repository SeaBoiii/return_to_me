# Chapter 6 ImageGen prompt record

Generated on 25 August 2026 with OpenAI's built-in ImageGen tool. The tool did
not expose a model/version identifier. No external image API, CLI, stock art,
copied interface, or real-person likeness was used. Approved copies are kept at
the fixed candidate paths below.

All prompts used the established Return to Me visual language: polished,
semi-realistic anime-inspired cel shading, refined linework, natural anatomy,
restrained cinematic lighting, and no typography, logo, readable text, brand,
watermark, school/university identifier, or military insignia.

## Environment prompts

### `bg-raya-living-room-2016`

> Create a polished 16:9 visual-novel background of a warm Singapore HDB
> living room prepared for Hari Raya visiting in 2016. Late-afternoon sunlight,
> tiled floor, wooden furniture, green-and-cream textiles, snack jars, flowers,
> and ketupat-inspired hanging decorations; layered domestic detail with clear
> negative space for character sprites. No people, family identifiers,
> religious text, brand packaging, logos, readable signs, or watermark.

### `bg-ns-camp-gate`

> Create a polished 16:9 visual-novel background of a completely generic
> Singapore National Service camp gate and parade-area edge in warm humid
> daylight. Restrained concrete buildings, covered walkway, open formation
> space, tropical rain trees, and no people. No real camp architecture,
> readable sign, flag, unit emblem, badge, name, rank, weapon, national emblem,
> military logo, or watermark.

### `bg-ns-bunk-night`

> Create a polished 16:9 visual-novel background of a generic National Service
> bunk at night: aligned metal beds, folded blankets, plain lockers, ceiling
> fans, cool window light, and one practical warm bedside light, with useful
> foreground space for a sprite. No people, weapons, uniforms on display, unit
> markings, personal names, readable notices, insignia, logo, or watermark.

### `bg-university-lecture-theatre`

> Create a polished 16:9 visual-novel background looking through open doors
> into an unnamed Singapore university lecture theatre during freshman club
> recruitment. The atmosphere is ordinary, diverse, and welcoming; anonymous
> volunteers and freshmen talk naturally around simple tables, with Malay women
> both wearing and not wearing hijab present as ordinary members of the crowd.
> No threat cues, red markers, isolation, horror lighting, club logo,
> university crest, readable sign-up text, identifier, or watermark.

### `bg-university-corridor`

> Create a polished 16:9 visual-novel background of a quiet unnamed university
> corridor immediately outside a lecture theatre. Practical daylight, concrete
> and warm wood, a bench, drinking fountain, open-air greenery, and enough clear
> space for a breathless character sprite. No people, dramatic pursuit cues,
> signs, logos, crests, campus identifiers, readable text, or watermark.

## Character anchors

Aleem anchors referenced
`art/proofs/jc-expansion/aleem-jc-proof-v3-magenta.png` solely to preserve the
project's existing fictional protagonist. Nadiah was generated from scratch.

### `aleem-ns/neutral`

> Create one production-ready visual-novel character sprite of Aleem at age 20
> during Singapore National Service, preserving the same fictional Aleem
> identity and facial structure from the supplied reference. Three-quarter
> body, straight-on neutral standing pose, short neat black hair, warm
> medium-brown Malay complexion, lean build, calm but slightly guarded neutral
> expression. He wears a completely generic olive drab training uniform with
> plain fabric only: absolutely no flag, unit patch, name tape, rank, badge,
> insignia, readable text, camouflage markings, weapon, or military logo.
> Soft semi-realistic anime-inspired cel shading, refined linework, natural
> anatomy, cinematic soft light, centered with generous padding, portrait 2:3.
> No typography, objects, scenery, or watermark.

### `aleem-raya/awed`

> Create one production-ready visual-novel character sprite of Aleem at age 20
> during Hari Raya, preserving the same fictional Aleem identity and facial
> structure from the supplied reference. Three-quarter body, relaxed standing
> pose, short neat black hair, warm medium-brown Malay complexion, lean build,
> quietly awed expression: widened gentle eyes and slightly parted lips,
> respectful rather than exaggerated. He wears a modest dark navy baju melayu
> with understated woven texture, no logos or readable text. Warm indoor light,
> centered with generous padding, portrait 2:3. No typography, props, scenery,
> or watermark.

### `aleem-uni/neutral`

> Create one production-ready visual-novel character sprite of Aleem at age 21
> in his first week at an unnamed Singapore university, preserving the same
> fictional Aleem identity and facial structure from the supplied reference.
> Three-quarter body, neutral standing pose, short neat black hair, warm
> medium-brown Malay complexion, lean build, attentive neutral expression with
> a trace of caution. Plain muted teal overshirt over a cream T-shirt and dark
> trousers; no university identifier, brand, logo, or readable text. Clean
> daylight, centered with generous padding, portrait 2:3. No typography, props,
> scenery, or watermark.

### `nadiah/neutral`

> Create one original, wholly fictional production-ready visual-novel character
> sprite of Nadiah, a 20-year-old Malay Singaporean woman. This must not resemble
> any real person or celebrity. Three-quarter body, neutral standing pose, warm
> medium-brown complexion, oval face, expressive dark-brown eyes, gentle natural
> features, calm neutral expression. She wears a neatly draped dusty blue-grey
> hijab fully covering her hair and neck and a modest cream baju kurung with
> subtle teal botanical embroidery at cuffs and hem. No glamour pose, logo, or
> readable text. Warm balanced light, centered with generous padding, portrait
> 2:3. No typography, props, scenery, or watermark. The design should feel
> individual, empathetic, grounded, and adult.

## Expression edit template

Every final sprite candidate used this shared instruction followed by its
listed modifier:

> Edit the supplied production character reference into one three-quarter-body
> visual-novel expression sprite. Preserve identity, face, hair or hijab, age,
> body, outfit, colors, rendering style, anatomy, pose, camera, crop, and scale
> exactly. Only change the requested facial expression and very small natural
> shoulder/hand cues. Place the character against a perfectly uniform flat pure
> chroma-magenta #FF00FF background touching every canvas edge; no gradient,
> halo, glow, shadow, checkerboard, scenery, props, or extra objects. Clean
> silhouette, generous padding, portrait 2:3. No typography, brands, logos,
> insignia, readable text, or watermark.

- `aleem-ns/neutral`: calm, slightly guarded neutral expression.
- `aleem-ns/proud`: quietly relieved after Passing Out Parade; restrained
  smile, slightly raised chin, gently squared shoulders.
- `aleem-ns/warm`: soft genuine smile, relaxed eyes, subtle openness during an
  evening call.
- `aleem-ns/stunned`: widened fixed eyes and slightly parted lips after an
  unexpected phone revelation; restrained rather than theatrical.
- `aleem-ns/hurt`: wet lowered eyes, tight jaw, compressed mouth, shoulders
  slightly inward; no flying tears or melodrama.
- `aleem-ns/numb`: unfocused distant gaze, neutral slack mouth, lowered
  shoulders, emotionally exhausted and understated.
- `aleem-raya/awed`: gentle widened eyes and slightly parted lips, respectful
  and understated.
- `aleem-raya/shy-smile`: gentle eyes, small sincere closed-mouth smile,
  relaxed shoulders.
- `aleem-uni/neutral`: attentive neutral expression with a trace of caution.
- `aleem-uni/guarded`: eyes scanning slightly sideways, brow faintly tightened,
  mouth set, shoulders subtly tense.
- `aleem-uni/frozen`: fixed widened eyes, tense brow, barely parted lips, rigid
  shoulders; physically credible and restrained.
- `aleem-uni/overwhelmed`: pinched brow, distressed eyes, tightened mouth,
  tense shoulders; no diagnostic cues or theatrical effects.
- `aleem-uni/breathless`: mouth slightly open taking air, sweat at temples,
  unsettled eyes, one hand lightly bracing his side; realistic and restrained.
- `nadiah/neutral`: calm neutral expression with hijab coverage and modest
  styling preserved exactly.
- `nadiah/warm`: relaxed eyes and a genuine smile; empathetic and not
  flirtatious or glamour-posed.
- `nadiah/amused`: small contained smile and bright eyes reacting to an
  ordinary joke; not flirtatious.
- `nadiah/thoughtful`: eyes angled down slightly, brows gently gathered, mouth
  neutral.
- `nadiah/guarded`: steady gaze, softly pressed lips, subtly closed shoulders;
  neither villainous nor cold.

## CG prompts

### `cg-raya-first-sight`

> Create a polished 16:9 cinematic visual-novel CG using the supplied fictional
> Aleem, fictional Nadiah, and Hari Raya living-room references as continuity
> anchors. Singapore HDB Hari Raya family visit in 2016, warm late-afternoon
> sunlight, ketupat decorations and snack jars. Aleem stands at one side in his
> navy baju melayu; Nadiah stands across the room in her dusty blue-grey hijab
> and cream baju kurung. Their eyes meet through ordinary family activity, with
> a respectful distance and gentle mutual curiosity. Nadiah is a whole person,
> not an ethereal object: natural posture, believable expression, no beauty
> halo or glamour framing. Background relatives are soft anonymous figures. No
> text, logo, sign, brand, watermark, or copied UI. Full-bleed landscape.

### `cg-relationship-montage`

> Create one polished 16:9 cinematic visual-novel CG as a restrained warm
> relationship montage using the supplied fictional Aleem and Nadiah references
> for identity continuity. Show a balanced three-panel composition: Aleem in a
> generic plain olive National Service outfit on a quiet evening call before
> book-in; an unbranded phone on a bunk blanket with abstract unreadable message
> bubbles only; and Aleem in simple civilian clothes with Nadiah in her dusty
> blue-grey hijab and cream modest outfit sharing an ordinary public cafe table
> in daylight. Both look mutually present, relaxed, and human. No idealized
> halo, possessive framing, or physical intimacy beyond ordinary closeness. No
> insignia, flag, weapon, logo, brand, app UI, handle, readable text, border, or
> watermark.

### `cg-close-friends-reveal`

> Create one polished 16:9 cinematic visual-novel CG of an unexpected private-
> story reveal, using the supplied fictional Aleem and fictional Nadiah
> references only for identity continuity. At night in a generic National
> Service bunk, Aleem in a completely plain olive outfit sits rigid on his bed,
> looking at an unbranded phone held by a friend's off-frame hand, stunned and
> contained. The display is understandable only as a private story image and
> contains absolutely no copied interface, logo, handle, icon, caption,
> timestamp, or readable text. Inside the image, fictional Nadiah wears neutral
> modest casual clothes and her uncovered dark hair naturally styled on a bright
> generic theme-park walkway; she stands beside an unnamed young Chinese man who
> is distant, partly turned away, unidentifiable, and not touching her. Their
> pose is neutral and non-moralized. Her lack of hijab is an observed fact with
> no ominous lighting, shame cue, or implied motive. The phone image is normal
> daylight, not sinister. No insignia, flag, unit sign, weapon, brand,
> university identifier, readable text, watermark, copied UI, or border.

## Approved output mapping

- `art/candidates/chapter-six/scenes/backgrounds/*.png`: five backgrounds.
- `art/candidates/chapter-six/scenes/cg/*.png`: three CGs.
- `art/candidates/chapter-six/characters/<family>/<expression>.png`: eighteen
  magenta-key sprite sources.

The deterministic processor, validator, nine contact sheets, and guarded
promotion command are documented in [`README.md`](README.md).
