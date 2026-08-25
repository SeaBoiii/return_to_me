# Chapter 2 support sprites: canonical candidate record

Generated on 25 August 2026 with OpenAI's default built-in image generator
after the project owner approved the first School Years refresh proof batch.
The built-in tool did not expose an exact model name or version, so the
generator is recorded as **unspecified**. These files are second-gate
inputs whose processed transparent masters and deploy WebPs were approved and
promoted on 25 August 2026. The raw keyed PNGs remain here for reproducibility
and are not served directly.

Per-output generator filenames were not retained in this record. The selected
committed PNG blobs and their Git history are the authoritative output record.

## Approved anchors and output inventory

- `art/proofs/school-years-refresh/hana-anchor.png` is the sole authoritative
  input for every generated Hana expression. It was copied byte-for-byte to
  `characters/hana/neutral.png` (SHA-256
  `35A996CDB5E3B2B4CAA8E13FA078C6B31DE70B89242BFC21993B7330F759D848`).
- `art/proofs/school-years-refresh/faris-anchor.png` is the sole authoritative
  revised input for every generated Faris expression. It was copied
  byte-for-byte to `characters/faris/neutral.png` (SHA-256
  `DC02A276272956A52C7A5640FB6F3FAEF702BF7B7374ED09086A59652A0CE12B`).
- Hana candidates: `neutral`, `curious`, `shy`, `smile`, `supportive`,
  `concerned`, `disappointed`, `distant`, and `apologetic`.
- Faris candidates: `neutral`, `teasing`, `encouraging`, and `confident`.

Each non-neutral candidate was produced by one independent built-in
identity-preserving edit call using only its approved anchor. Generated-image
defaults were copied into the workspace without deleting or modifying the
generator-owned originals.

## QA review

- All 13 files are 1024x1536 opaque RGB PNGs with flat-to-near-flat vivid
  magenta fields and magenta at all four corners. Production used tolerant,
  border-connected chroma matting and spill cleanup to create the transparent
  sprite masters.
- No candidate contains a fake checkerboard, environment, prop, extra person,
  readable text, crest, badge, school name, logo, trademark, or watermark.
- Hana retains the approved face, glasses, side-parted very long straight hair,
  warm skin, tall slender proportions, and generic white-and-navy uniform.
  Her concern, disappointment, distance, and apology remain restrained and
  non-villainous. The `shy` state has a deliberately visible cel-shaded blush;
  it remains age-appropriate and reads clearly at mobile scale.
- Faris retains the revised round face and torso, compact limbs, fluffy hair,
  glasses, and generic boys'-school uniform. The generated frames remain on a
  common source canvas; the production processor calibrated Faris to the
  planned approximately 850-pixel visible height so his short stature remains
  unambiguous beside Aleem and Hana.
- Complete hair silhouettes, arms, and hands are inside every frame. The
  contact-sheet and full-resolution review found no blocking anatomy defects.
  The final QA package includes close edge crops of hand silhouettes after
  chroma matting, especially Hana `concerned` and Faris `confident`.

## Hana prompts

### `curious.png`

```text
Use case: identity-preserve
Asset type: Chapter 2 visual-novel character sprite candidate — Hana, curious expression
Input images: Image 1 is the sole authoritative approved Hana identity/outfit anchor and edit target.
Primary request: Change only Hana’s expression and a restrained natural upper-body gesture so she reads as quietly curious: slightly raised eyebrows, attentive eyes behind the same glasses, a subtle questioning half-smile, and a very gentle head tilt. Allow one complete hand to lift loosely near mid-torso in an open, thoughtful gesture while the other complete arm and hand remain naturally visible.
Subject invariants: preserve exactly the same fictional Malay teenage girl, age 14–16, warm medium-brown skin, facial structure, natural eye size, rectangular dark glasses, very long straight black hair with the same side part, taller slender proportions, plain white short-sleeve collared blouse, modest dark navy pleated below-knee skirt, and soft semi-realistic cel-shaded rendering.
Composition/framing: one isolated centered three-quarter-length figure; complete head and every strand of hair, both complete arms, both complete hands and all fingers visible; generous padding around silhouette; mobile-readable expression.
Scene/backdrop: preserve the flat vivid magenta chroma-key background edge to edge, with no checkerboard, scene, floor, texture, shadow, gradient, glow, or halo.
Lighting/mood: preserve neutral studio lighting; thoughtful, observant, human, and warm.
Constraints: identity-preserving edit; change only expression and restrained gesture; age-appropriate and nonsexual; keep uniform generic and unchanged; no props, text, crest, badge, school name, logo, watermark, jewelry, extra people, makeup emphasis, mature styling, caricature, or villainous affect.
Avoid: identity drift, changed face or glasses, short/tied/cropped hair, oversized anime eyes, hidden/cropped hands, ambiguous fingers, altered outfit, fake transparency checkerboard, background scenery, magenta spill on the figure.
```

### `shy.png`

```text
Use case: identity-preserve
Asset type: Chapter 2 visual-novel character sprite candidate — Hana, shy expression
Input images: Image 1 is the sole authoritative approved Hana identity/outfit anchor and edit target.
Primary request: Change only Hana’s expression and restrained pose so she reads as sincerely shy and slightly flustered: softened eyes behind the same glasses, a small closed-mouth hesitant smile, subtly warmed cheeks without cosmetics, shoulders drawn in just a little, and both complete hands gently clasped together at lower mid-torso with anatomically natural fingers.
Subject invariants: preserve exactly the same fictional Malay teenage girl, age 14–16, warm medium-brown skin, facial structure, natural eye size, rectangular dark glasses, very long straight black hair with identical side part, taller slender proportions, plain white short-sleeve collared blouse, modest dark navy pleated below-knee skirt, and soft semi-realistic cel-shaded rendering.
Composition/framing: one isolated centered three-quarter-length figure; complete head and every strand of long hair, both complete arms, both complete hands and fingers visible; generous silhouette padding; mobile-readable emotion.
Scene/backdrop: preserve the flat vivid magenta chroma-key background edge to edge; no checkerboard, scene, floor, texture, shadow, gradient, glow, or halo.
Lighting/mood: neutral studio lighting; tender, awkward, human, never glamorized.
Constraints: identity-preserving edit; change only expression and restrained gesture; age-appropriate and nonsexual; generic uniform unchanged; no props, text, crest, badge, school name, logo, watermark, jewelry, makeup emphasis, extra people, mature styling, caricature, or villainous affect.
Avoid: identity drift, altered face/glasses/hair/outfit, tied or cropped hair, oversized anime eyes, hidden or cropped hands, malformed clasped fingers, fake transparency checkerboard, scenery, magenta spill on figure.
```

### `smile.png`

```text
Use case: identity-preserve
Asset type: Chapter 2 visual-novel character sprite candidate — Hana, smile expression
Input images: Image 1 is the sole authoritative approved Hana identity/outfit anchor and edit target.
Primary request: Change only Hana’s expression and restrained pose so she shows a genuine, relaxed smile: warm bright eyes behind the same glasses, naturally lifted cheeks, a modest closed-mouth smile, relaxed shoulders, and both complete hands loosely folded together at waist height with anatomically natural fingers.
Subject invariants: preserve exactly the same fictional Malay teenage girl, age 14–16, warm medium-brown skin, facial structure, natural eye size, rectangular dark glasses, very long straight black hair with identical side part, taller slender proportions, plain white short-sleeve collared blouse, modest dark navy pleated below-knee skirt, and soft semi-realistic cel-shaded rendering.
Composition/framing: one isolated centered three-quarter-length figure; complete head and every strand of long hair, both complete arms, both complete hands and fingers visible; generous silhouette padding; mobile-readable expression.
Scene/backdrop: preserve the flat vivid magenta chroma-key background edge to edge; no checkerboard, scene, floor, texture, shadow, gradient, glow, or halo.
Lighting/mood: neutral studio lighting; open, happy, grounded, and age-appropriate.
Constraints: identity-preserving edit; change only expression and restrained gesture; nonsexual teen treatment; generic uniform unchanged; no props, text, crest, badge, school name, logo, watermark, jewelry, makeup emphasis, extra people, mature styling, caricature, or idealized glamour.
Avoid: identity drift, altered face/glasses/hair/outfit, tied or cropped hair, oversized anime eyes, exaggerated grin, hidden/cropped hands, malformed fingers, fake transparency checkerboard, scenery, magenta spill on figure.
```

### `supportive.png`

```text
Use case: identity-preserve
Asset type: Chapter 2 visual-novel character sprite candidate — Hana, supportive expression
Input images: Image 1 is the sole authoritative approved Hana identity/outfit anchor and edit target.
Primary request: Change only Hana’s expression and restrained upper-body gesture so she reads as quietly supportive: compassionate steady eyes behind the same glasses, softly raised inner brows, a small reassuring closed-mouth smile, slight forward attentiveness, and one complete hand resting gently over her own upper chest while the other complete arm and hand remain relaxed and visible.
Subject invariants: preserve exactly the same fictional Malay teenage girl, age 14–16, warm medium-brown skin, facial structure, natural eye size, rectangular dark glasses, very long straight black hair with identical side part, taller slender proportions, plain white short-sleeve collared blouse, modest dark navy pleated below-knee skirt, and soft semi-realistic cel-shaded rendering.
Composition/framing: one isolated centered three-quarter-length figure; complete head and all long hair, both complete arms, both complete hands and natural fingers visible; generous silhouette padding; mobile-readable expression.
Scene/backdrop: preserve flat vivid magenta chroma-key edge to edge; no checkerboard, scene, floor, texture, shadow, gradient, glow, or halo.
Lighting/mood: neutral studio lighting; empathetic, grounded, human, never romanticized.
Constraints: identity-preserving edit; change only expression and restrained gesture; age-appropriate and nonsexual; generic uniform unchanged; no props, text, crest, badge, school name, logo, watermark, jewelry, makeup emphasis, extra people, mature styling, caricature, or villainous affect.
Avoid: identity drift, altered face/glasses/hair/outfit, tied or cropped hair, oversized anime eyes, melodrama, hidden/cropped hands, malformed fingers, fake transparency checkerboard, scenery, magenta spill.
```

### `concerned.png`

```text
Use case: identity-preserve
Asset type: Chapter 2 visual-novel character sprite candidate — Hana, concerned expression
Input images: Image 1 is the sole authoritative approved Hana identity/outfit anchor and edit target.
Primary request: Change only Hana’s expression and restrained pose so she reads as genuinely concerned: inner eyebrows lifted slightly, attentive worried eyes behind the same glasses, lips gently parted as if asking whether someone is okay, subtle tension in her shoulders, and both complete hands loosely gathered near mid-torso with natural unforced fingers.
Subject invariants: preserve exactly the same fictional Malay teenage girl, age 14–16, warm medium-brown skin, facial structure, natural eye size, rectangular dark glasses, very long straight black hair with identical side part, taller slender proportions, plain white short-sleeve collared blouse, modest dark navy pleated below-knee skirt, and soft semi-realistic cel-shaded rendering.
Composition/framing: one isolated centered three-quarter-length figure; complete head and all long hair, both complete arms, both complete hands and fingers visible; generous silhouette padding; mobile-readable emotion.
Scene/backdrop: preserve flat vivid magenta chroma-key edge to edge; no checkerboard, scene, floor, texture, shadow, gradient, glow, or halo.
Lighting/mood: neutral studio lighting; caring, uncertain, restrained, and human.
Constraints: identity-preserving edit; change only expression and restrained gesture; age-appropriate and nonsexual; generic uniform unchanged; no props, text, crest, badge, school name, logo, watermark, jewelry, makeup emphasis, tears, extra people, mature styling, caricature, or villainous affect.
Avoid: identity drift, altered face/glasses/hair/outfit, tied or cropped hair, oversized anime eyes, melodrama, anger, accusation, hidden/cropped hands, malformed fingers, fake checkerboard, scenery, magenta spill.
```

### `disappointed.png`

```text
Use case: identity-preserve
Asset type: Chapter 2 visual-novel character sprite candidate — Hana, disappointed expression
Input images: Image 1 is the sole authoritative approved Hana identity/outfit anchor and edit target.
Primary request: Change only Hana’s expression and restrained pose so she reads as quietly disappointed and tired rather than angry: gaze lowered slightly behind the same glasses, gently knitted brows, closed lips with a small downward tension, shoulders subtly heavy, and both complete arms relaxed with hands visible near her sides. Convey hurt and emotional fatigue without blame or hostility.
Subject invariants: preserve exactly the same fictional Malay teenage girl, age 14–16, warm medium-brown skin, facial structure, natural eye size, rectangular dark glasses, very long straight black hair with identical side part, taller slender proportions, plain white short-sleeve collared blouse, modest dark navy pleated below-knee skirt, and soft semi-realistic cel-shaded rendering.
Composition/framing: one isolated centered three-quarter-length figure; complete head and all long hair, both complete arms, both complete hands and natural fingers visible; generous silhouette padding; mobile-readable emotion.
Scene/backdrop: preserve flat vivid magenta chroma-key edge to edge; no checkerboard, scene, floor, texture, shadow, gradient, glow, or halo.
Lighting/mood: neutral studio lighting; subdued, human, vulnerable, non-villainous.
Constraints: identity-preserving edit; change only expression and restrained posture; age-appropriate and nonsexual; generic uniform unchanged; no props, text, crest, badge, school name, logo, watermark, jewelry, makeup emphasis, tears, extra people, mature styling, caricature, anger, contempt, or villainous affect.
Avoid: identity drift, altered face/glasses/hair/outfit, tied or cropped hair, oversized anime eyes, melodrama, accusing gesture, arms crossed, clenched fists, hidden/cropped hands, fake checkerboard, scenery, magenta spill.
```

### `distant.png`

```text
Use case: identity-preserve
Asset type: Chapter 2 visual-novel character sprite candidate — Hana, distant expression
Input images: Image 1 is the sole authoritative approved Hana identity/outfit anchor and edit target.
Primary request: Change only Hana’s expression and restrained pose so she reads as emotionally distant and guarded, not cruel: eyes looking gently off to one side behind the same glasses rather than meeting the viewer, brows neutral but tired, mouth closed in a quiet flat line, shoulders held slightly inward, and both complete hands loosely held together low in front with natural relaxed fingers. She is creating space, not showing contempt.
Subject invariants: preserve exactly the same fictional Malay teenage girl, age 14–16, warm medium-brown skin, facial structure, natural eye size, rectangular dark glasses, very long straight black hair with identical side part, taller slender proportions, plain white short-sleeve collared blouse, modest dark navy pleated below-knee skirt, and soft semi-realistic cel-shaded rendering.
Composition/framing: one isolated centered three-quarter-length figure; complete head and all long hair, both complete arms, both complete hands and fingers visible; generous silhouette padding; mobile-readable emotion.
Scene/backdrop: preserve flat vivid magenta chroma-key edge to edge; no checkerboard, scene, floor, texture, shadow, gradient, glow, or halo.
Lighting/mood: neutral studio lighting; reserved, withdrawn, thoughtful, non-villainous.
Constraints: identity-preserving edit; change only expression and restrained posture; age-appropriate and nonsexual; generic uniform unchanged; no props, text, crest, badge, school name, logo, watermark, jewelry, makeup emphasis, tears, extra people, mature styling, caricature, anger, contempt, smirk, or villainous affect.
Avoid: identity drift, altered face/glasses/hair/outfit, tied or cropped hair, oversized anime eyes, melodrama, glaring, accusatory gesture, crossed arms, clenched fists, hidden/cropped hands, fake checkerboard, scenery, magenta spill.
```

### `apologetic.png`

```text
Use case: identity-preserve
Asset type: Chapter 2 visual-novel character sprite candidate — Hana, apologetic expression
Input images: Image 1 is the sole authoritative approved Hana identity/outfit anchor and edit target.
Primary request: Change only Hana’s expression and restrained pose so she reads as sincerely apologetic and human: softened remorseful eyes behind the same glasses, inner brows raised slightly, lips parted as if choosing careful words, a small respectful forward inclination, and both complete hands gently clasped at mid-torso with clear natural fingers. Convey regret and honesty without self-punishment or melodrama.
Subject invariants: preserve exactly the same fictional Malay teenage girl, age 14–16, warm medium-brown skin, facial structure, natural eye size, rectangular dark glasses, very long straight black hair with identical side part, taller slender proportions, plain white short-sleeve collared blouse, modest dark navy pleated below-knee skirt, and soft semi-realistic cel-shaded rendering.
Composition/framing: one isolated centered three-quarter-length figure; complete head and all long hair, both complete arms, both complete hands and fingers visible; generous silhouette padding; mobile-readable emotion.
Scene/backdrop: preserve flat vivid magenta chroma-key edge to edge; no checkerboard, scene, floor, texture, shadow, gradient, glow, or halo.
Lighting/mood: neutral studio lighting; remorseful, careful, compassionate, non-villainous.
Constraints: identity-preserving edit; change only expression and restrained posture; age-appropriate and nonsexual; generic uniform unchanged; no props, text, crest, badge, school name, logo, watermark, jewelry, makeup emphasis, tears, extra people, mature styling, caricature, anger, or villainous affect.
Avoid: identity drift, altered face/glasses/hair/outfit, tied or cropped hair, oversized anime eyes, exaggerated crying, groveling pose, hidden/cropped hands, malformed fingers, fake checkerboard, scenery, magenta spill.
```

## Faris prompts

### `teasing.png`

```text
Use case: identity-preserve
Asset type: Chapter 2 visual-novel character sprite candidate — Faris, teasing expression
Input images: Image 1 is the sole authoritative approved revised Faris identity/outfit anchor and edit target.
Primary request: Change only Faris’s expression and a restrained upper-body gesture so he reads as warmly teasing a close friend: one eyebrow lifted, eyes bright behind the same glasses, a small knowing closed-mouth grin, slight playful lean, and one complete hand raised in a light open-palmed 'well?' gesture while the other complete arm and hand remain relaxed and visible. His humor is affectionate, never mocking.
Subject invariants: preserve exactly the same fictional Malay teenage boy, age 14–16, warm brown skin, distinct friendly round face and soft cheeks, rectangular black glasses, noticeably short compact stature, round stocky build with compact limbs, short fluffy black hair silhouette, plain white short-sleeve collared shirt, dark navy trousers, simple black belt, and polished soft semi-realistic cel-shaded rendering.
Composition/framing: one isolated centered three-quarter-length figure; complete head and fluffy hair, both complete arms, both complete hands and natural fingers visible; generous silhouette padding; mobile-readable emotion. Do not enlarge his body to fill the canvas; later normalization will enforce short stature.
Scene/backdrop: preserve flat vivid magenta chroma-key background edge to edge; no checkerboard, scene, floor, texture, shadow, gradient, glow, or halo.
Lighting/mood: neutral studio lighting; warm, clever, playful, dependable.
Constraints: identity-preserving edit; change only expression and restrained gesture; retain compact round build and fluffy hair aggressively; age-appropriate and nonsexual; generic uniform unchanged; no props, text, crest, badge, school name, logo, watermark, extra people, facial hair, mature styling, exaggerated obesity, caricature, or ridicule.
Avoid: becoming tall, skinny, muscular, childlike, or Aleem-like; altered face/glasses/hair/outfit; exaggerated grin; pointing at viewer; hidden/cropped hands; malformed fingers; fake transparency checkerboard; scenery; magenta spill.
```

### `encouraging.png`

```text
Use case: identity-preserve
Asset type: Chapter 2 visual-novel character sprite candidate — Faris, encouraging expression
Input images: Image 1 is the sole authoritative approved revised Faris identity/outfit anchor and edit target.
Primary request: Change only Faris’s expression and restrained upper-body gesture so he reads as genuinely encouraging his nervous friend: warm steady eyes behind the same glasses, lifted brows, a broad but natural closed-mouth supportive smile, upright dependable posture, and one complete hand making a modest clear thumbs-up near chest height while the other complete arm and hand remain relaxed and visible. His support is sincere, not comedic.
Subject invariants: preserve exactly the same fictional Malay teenage boy, age 14–16, warm brown skin, distinct friendly round face and soft cheeks, rectangular black glasses, noticeably short compact stature, round stocky build with compact limbs, short fluffy black hair silhouette, plain white short-sleeve collared shirt, dark navy trousers, simple black belt, and polished soft semi-realistic cel-shaded rendering.
Composition/framing: one isolated centered three-quarter-length figure; complete head and fluffy hair, both complete arms, both complete hands and natural fingers visible; generous silhouette padding; mobile-readable emotion. Do not enlarge his body to fill the canvas; later normalization enforces short stature.
Scene/backdrop: preserve flat vivid magenta chroma-key edge to edge; no checkerboard, scene, floor, texture, shadow, gradient, glow, or halo.
Lighting/mood: neutral studio lighting; warm, loyal, reassuring, dependable.
Constraints: identity-preserving edit; change only expression and restrained gesture; retain compact round build and fluffy hair aggressively; age-appropriate and nonsexual; generic uniform unchanged; no props, text, crest, badge, school name, logo, watermark, extra people, facial hair, mature styling, exaggerated obesity, caricature, or ridicule.
Avoid: becoming tall, skinny, muscular, childlike, or Aleem-like; altered face/glasses/hair/outfit; oversized anime eyes; exaggerated grin; hidden/cropped hands; malformed thumb or fingers; fake transparency checkerboard; scenery; magenta spill.
```

### `confident.png`

```text
Use case: identity-preserve
Asset type: Chapter 2 visual-novel character sprite candidate — Faris, confident expression
Input images: Image 1 is the sole authoritative approved revised Faris identity/outfit anchor and edit target.
Primary request: Change only Faris’s expression and restrained upper-body pose so he reads as calmly confident before acting as a wingman: direct steady eyes behind the same glasses, brows comfortably set, a small assured closed-mouth smile, shoulders squared without swagger, and one complete hand extended slightly forward with an open welcoming palm while the other complete arm and hand remain relaxed and visible. He is dependable and ready, never boastful.
Subject invariants: preserve exactly the same fictional Malay teenage boy, age 14–16, warm brown skin, distinct friendly round face and soft cheeks, rectangular black glasses, noticeably short compact stature, round stocky build with compact limbs, short fluffy black hair silhouette, plain white short-sleeve collared shirt, dark navy trousers, simple black belt, and polished soft semi-realistic cel-shaded rendering.
Composition/framing: one isolated centered three-quarter-length figure; complete head and fluffy hair, both complete arms, both complete hands and natural fingers visible; generous silhouette padding; mobile-readable emotion. Do not enlarge his body to fill the canvas; later normalization enforces short stature.
Scene/backdrop: preserve flat vivid magenta chroma-key edge to edge; no checkerboard, scene, floor, texture, shadow, gradient, glow, or halo.
Lighting/mood: neutral studio lighting; assured, loyal, warm, competent.
Constraints: identity-preserving edit; change only expression and restrained gesture; retain compact round build and fluffy hair aggressively; age-appropriate and nonsexual; generic uniform unchanged; no props, text, crest, badge, school name, logo, watermark, extra people, facial hair, mature styling, exaggerated obesity, caricature, arrogance, or ridicule.
Avoid: becoming tall, skinny, muscular, childlike, or Aleem-like; altered face/glasses/hair/outfit; smugness; dramatic hero pose; pointing at viewer; hidden/cropped hands; malformed fingers; fake transparency checkerboard; scenery; magenta spill.
```
