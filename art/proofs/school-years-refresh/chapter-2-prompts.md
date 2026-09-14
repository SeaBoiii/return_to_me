# Chapters 1–2 refresh: Chapter 2 proof record

Generated on 25 August 2026 with OpenAI's default built-in image generator.
The tool did not expose an exact model name or version, so the generator is
recorded as **unspecified**. These four files are the approved first-gate
identity and outfit anchors. They are not expression variants or deployable
sprites; their production derivatives passed the separate final promotion gate.

## Status and inventory

| Proof | Selected file | Physical format | Review status |
| --- | --- | --- | --- |
| Secondary-uniform Aleem | `aleem-sec-anchor.png` | 1024×1536 RGB, magenta key | Approved identity/outfit anchor |
| Home-clothes secondary Aleem | `aleem-home-anchor.png` | 1086×1448 RGB, magenta key | Approved identity/outfit anchor |
| Hana | `hana-anchor.png` | 1024×1536 RGB, magenta key | Approved identity/outfit anchor |
| Faris | `faris-anchor.png` | 1024×1536 RGB, magenta key | Revised and approved identity/outfit anchor |

No proof file in this batch was copied directly to `public` or used directly by
the story graph. After first-gate approval, the anchors guided expression
production whose normalized derivatives passed final QA and promotion.

## Reference relationships

| Proof | Input image and role |
| --- | --- |
| Secondary Aleem | `art/sources/characters/aleem-sec-expression-master.png`: authoritative secondary-school identity, age, build, and outfit. `art/proofs/jc-expansion/aleem-jc-proof-v3-magenta.png`: approved future identity continuity and rendering quality only. |
| Home Aleem | `art/sources/characters/aleem-sec-expression-master.png`: authoritative younger identity. `art/sources/characters/aleem-home-expression-master.png`: authoritative home outfit and era reference. Approved JC Aleem proof: future identity continuity and rendering quality only. |
| Hana | `art/sources/characters/hana-expression-master.png`: authoritative identity, age, hair, glasses, stature, and outfit. Approved JC Aleem proof: rendering quality, natural teen proportions, line weight, and shading only; Aleem's identity was not copied. |
| Faris | `art/sources/characters/faris-expression-master.png`: authoritative identity, hair, glasses, stature, build, and outfit. Existing secondary Aleem sheet: shared age and boys'-school uniform only. Approved JC Aleem proof: rendering quality and natural proportions only; Aleem's identity was not copied. |

## Transparency attempt and selected fallback

Each initial generation explicitly requested a genuinely transparent alpha
background. Physical inspection with Pillow found that all four results were
opaque `RGB` PNGs containing baked white-and-light-grey checkerboards:

- Secondary Aleem: 1024×1536, no alpha channel.
- Home Aleem: 1086×1448, no alpha channel.
- Hana: 1024×1536, no alpha channel.
- Faris: 1024×1536, no alpha channel.

Those fake-transparency files were rejected. Each selected character then
received a background-only built-in edit requesting a flat vivid magenta
field. The selected proof files remain opaque RGB approval anchors. The
generator produced a narrow magenta range rather than literal `#FF00FF`; their
corner samples range approximately from `(230, 35, 218)` to `(242, 20, 233)`.
This matches the established JC proof-stage fallback and requires tolerant,
border-connected matting plus magenta-spill cleanup before any later expression
source can become a transparent sprite. Fake transparency must not be promoted
or treated as production alpha.

## Internal visual review

- All four candidates match the approved soft semi-realistic cel-shaded visual
  novel language and use restrained outlines, clean silhouettes, and natural
  age-appropriate, nonsexual treatment.
- Secondary Aleem reads as a younger predecessor of approved JC Aleem. His
  school and home proofs preserve the same face, hair, rectangular glasses,
  warm skin tone, and tall skinny build across outfits.
- Hana retains her tall Malay identity, long straight side-parted hair,
  rectangular glasses, warm skin tone, and modest white-and-navy uniform.
- Faris's first selected proof remained too close to Aleem's lean silhouette.
  A targeted identity-preserving edit revised only his proportions and hair:
  the accepted candidate now has a visibly rounder torso, softer cheeks,
  compact limbs, and fluffier short hair. The superseded candidate is retained
  as `faris-anchor-v1-lean.png`. Relative short stature was enforced on the
  common calibrated production canvas at approximately 850 px visible height.
- Complete hair, arms, and hands are visible. Hands are suitable for an anchor
  proof, but every derived pose still requires close anatomy review.
- No proof contains a crest, badge, school name, readable text, prop, trademark,
  logo, watermark, extra person, mature framing, or sexualized treatment.
- The magenta is visibly usable as a chroma field but is not mathematically
  uniform. These proofs must not be deployed directly.

## Generation prompts

### Secondary-uniform Aleem

```text
Use case: identity-preserve
Asset type: Chapter 2 visual-novel character identity and outfit approval proof
Input images: Image 1 is the authoritative existing secondary-school Aleem identity, age, skin tone, face, hair, glasses, build, and plain boys'-school uniform reference. Image 2 is the approved JC Aleem identity-continuity and rendering-style reference, showing how this same character looks a few years later; use it only to ensure a clear family-of-one age progression and the approved polish, not to age the subject up or copy the JC tie/outfit.
Primary request: Create one refreshed isolated proof of the unmistakably same Aleem during Singapore secondary school, approximately age 14–16 in 2011–2013. He is a Boyanese Malay teenage boy with warm brown skin, a cute gentle youthful face, short neat black hair, rectangular black glasses, and the tall skinny build he developed after Primary 6. His face must read as the younger predecessor of Image 2 and preserve Image 1's compact facial shape, natural eye scale, glasses proportions, short-hair silhouette, nose, mouth, and warm skin tone.
Subject clothing: generic unnamed boys'-school uniform: crisp plain white short-sleeve collared shirt tucked into dark navy trousers with a simple black belt; no tie, crest, badge, school name, or decorative trim.
Style/medium: polished soft semi-realistic cel-shaded visual-novel illustration matching the approved Image 2 rendering language; crisp restrained outlines, natural teen proportions, subtle fabric shading, mobile-readable silhouette.
Composition/framing: one centered three-quarter-length standing figure in a relaxed neutral-to-gentle pose; complete head and all hair, both complete arms, and both complete hands clearly visible outside pockets; generous clear padding around the silhouette; no cropped extremities.
Scene/backdrop: genuinely transparent alpha background, completely empty; no colored key field, checkerboard, white panel, floor, cast shadow, texture, glow, or halo.
Lighting/mood: soft neutral studio light; thoughtful, approachable, grounded.
Constraints: preserve Aleem's identity aggressively; age-appropriate and nonsexual teen treatment; no facial hair, mature styling, props, accessories beyond glasses, extra people, readable text, school identifiers, badges, logos, trademarks, or watermark.
Avoid: oversized anime eyes, heavy brows, adult elongated face, broad or muscular build, JC tie, hands in pockets, hidden fingers, cropped hair or hands, opaque background, transparency checkerboard, color spill.
```

### Home-clothes secondary Aleem

```text
Use case: identity-preserve
Asset type: Chapter 2 visual-novel home-clothes character identity and outfit approval proof
Input images: Image 1 is the authoritative secondary-school Aleem identity, age, face, hair, glasses, warm skin tone, and tall skinny build reference. Image 2 is the existing home-clothes Aleem outfit and domestic-era identity reference; preserve its plain dark navy crew-neck T-shirt and recognizable younger Aleem. Image 3 is the approved JC Aleem identity-continuity and polished rendering-style reference, showing this same character a few years later; use it only for future continuity and visual quality, not to age the subject up or copy either outfit from Image 3.
Primary request: Create one refreshed isolated proof of the unmistakably same Aleem at home during secondary school, approximately age 14–16 in 2011–2013. He is a Boyanese Malay teenage boy with warm brown skin, cute gentle youthful features, short neat black hair, rectangular black glasses, and a tall skinny build. Preserve Image 1's compact face, natural eye scale, glasses proportions, nose, mouth, ear placement, and short-hair silhouette, and make him clearly the younger predecessor of Image 3.
Subject clothing: modest plain dark navy short-sleeve crew-neck T-shirt, matching Image 2; no pattern, logo, lettering, jewelry, or added layer.
Style/medium: polished soft semi-realistic cel-shaded visual-novel illustration matching Image 3's approved rendering language; crisp restrained outlines, natural teen proportions, subtle fabric shading, mobile-readable silhouette.
Composition/framing: one centered three-quarter-length standing figure in a calm focused neutral-to-gentle pose suitable as an identity anchor; complete head and all hair, both complete arms, and both complete hands clearly visible in relaxed natural positions; no desk, keyboard, or implied cropped prop; generous clear padding around the silhouette.
Scene/backdrop: genuinely transparent alpha background, completely empty; no colored key field, checkerboard, white panel, floor, cast shadow, texture, glow, or halo.
Lighting/mood: soft neutral studio light with the faintest cool indoor tint; capable, absorbed, but approachable.
Constraints: preserve Aleem's identity aggressively across school and home outfits; age-appropriate and nonsexual teen treatment; no facial hair, mature styling, props, extra people, readable text, badges, logos, trademarks, or watermark.
Avoid: oversized anime eyes, heavy brows, adult elongated face, broad or muscular build, changed haircut, hands behind the body or in pockets, hidden fingers, cropped hair or hands, opaque background, transparency checkerboard, color spill.
```

### Hana

```text
Use case: identity-preserve
Asset type: Chapter 2 visual-novel character identity and outfit approval proof
Input images: Image 1 is the authoritative existing Hana identity, age, warm medium-brown skin tone, face, long straight dark hair, rectangular glasses, tall build, and white-and-navy home-school uniform reference. Image 2 is the approved later-chapter rendering-quality, natural teen-proportion, line-weight, and cel-shading reference only; do not copy Aleem's identity, facial features, glasses shape, body, or clothing.
Primary request: Create one refreshed isolated proof of the unmistakably same Hana, a fictional Malay secondary-school girl approximately age 14–16 attending an external mixed-school third-language class in 2011–2013. Preserve Image 1's distinct natural face, warm medium-brown skin, calm expressive dark eyes, rectangular dark glasses, very long straight black hair with the same side part, and her taller-than-average slender build. She should feel observant, diligent, and human, never idealized or villainized.
Subject clothing: preserve her generic unnamed home-school uniform from Image 1: plain white short-sleeve collared blouse tucked into a modest dark navy pleated below-knee skirt; no tie, crest, badge, school name, piping, or decorative trim.
Style/medium: polished soft semi-realistic cel-shaded visual-novel illustration matching Image 2's approved rendering language; crisp restrained outlines, natural teen proportions, nuanced facial modelling, subtle fabric and hair shading, mobile-readable silhouette.
Composition/framing: one centered three-quarter-length standing figure in a relaxed neutral-to-gentle attentive pose; complete head and every strand of the long hair, both complete arms, and both complete hands clearly visible in natural relaxed positions; generous clear padding, especially around hair and fingers; no cropped hair or hands.
Scene/backdrop: genuinely transparent alpha background, completely empty; no colored key field, checkerboard, white panel, floor, cast shadow, texture, glow, or halo.
Lighting/mood: soft neutral studio light; thoughtful, quietly warm, self-possessed.
Constraints: preserve Hana's identity aggressively; age-appropriate and nonsexual teen treatment; modest natural pose and clothing; no props, jewelry, makeup emphasis, extra people, readable text, school identifiers, badges, logos, trademarks, or watermark; avoid stereotyped ethnic features.
Avoid: oversized anime eyes, childlike or adult-glamour proportions, copied Aleem identity, short or tied hair, missing glasses, cropped hair, hidden hands, ambiguous fingers, opaque background, transparency checkerboard, halo edges, color spill.
```

### Faris

```text
Use case: identity-preserve
Asset type: Chapter 2 visual-novel character identity and outfit approval proof
Input images: Image 1 is the authoritative existing Faris identity, age, face, short fluffy dark hair, glasses, short round build, and plain boys'-school uniform reference. Image 2 is the authoritative secondary-school age-treatment and shared boys'-school uniform reference only; do not copy Aleem's tall skinny body or facial identity. Image 3 is the approved later-chapter rendering-quality, natural teen-proportion, restrained-line, and cel-shading reference only; do not copy JC Aleem's identity, height, tie, or clothing.
Primary request: Create one refreshed isolated proof of the unmistakably same Faris, a fictional Malay secondary-school boy approximately age 14–16 in 2011–2013. Preserve Image 1's friendly distinct face, warm brown skin, short fluffy black hair silhouette, rectangular black glasses, noticeably short stature, and round stocky build. He should feel clever, loyal, lightly playful, and confidently encouraging without becoming a caricature.
Subject clothing: same generic unnamed boys'-school uniform as Image 2: crisp plain white short-sleeve collared shirt tucked into dark navy trousers with a simple black belt; no tie, crest, badge, school name, or decorative trim.
Style/medium: polished soft semi-realistic cel-shaded visual-novel illustration matching Image 3's approved rendering language; crisp restrained outlines, natural teen proportions, nuanced face, subtle fabric and hair shading, mobile-readable silhouette.
Composition/framing: one centered three-quarter-length standing figure in a relaxed neutral-to-gentle encouraging pose with a small friendly smile; complete head and fluffy hair, both complete arms, and both complete hands clearly visible outside pockets in natural relaxed positions; generous clear padding around the silhouette; no cropped hair or hands.
Scene/backdrop: genuinely transparent alpha background, completely empty; no colored key field, checkerboard, white panel, floor, cast shadow, texture, glow, or halo.
Lighting/mood: soft neutral studio light; warm, humorous, dependable.
Constraints: preserve Faris's identity aggressively; age-appropriate and nonsexual teen treatment; no props, facial hair, mature styling, extra people, readable text, school identifiers, badges, logos, trademarks, or watermark; avoid stereotyped ethnic features.
Avoid: turning him tall or skinny, copied Aleem identity, exaggerated obesity, oversized anime eyes, adult or childlike proportions, changed fluffy hairstyle, hands in pockets, hidden or ambiguous fingers, cropped extremities, opaque background, transparency checkerboard, halo edges, color spill.
```

## Common background-only fallback prompt

The character name and preservation list were specialized for each proof.

```text
Use case: precise-object-edit
Asset type: Chapter 2 visual-novel character approval proof on a safe chroma background
Input images: Image 1 is the sole edit target. Its entire selected character figure is authoritative and must remain unchanged.
Primary request: Replace only the baked white-and-light-gray checkerboard background with one perfectly uniform, flat, vivid magenta chroma-key field (#FF00FF).
Constraints: preserve the character figure exactly—identity, face, skin tone, hair, glasses, expression, body proportions, pose, both hands and fingers, clothing, outlines, spacing, resolution, and composition must not change or be redrawn. Background replacement only. Keep the full silhouette and all existing padding.
Scene/backdrop: edge-to-edge solid #FF00FF, a single even color with no texture, pattern, gradient, lighting, shadow, glow, floor, checkerboard, or variation.
Avoid: transparency checkerboard, white or gray backdrop, green or teal key colors, vignette, halo, subject recoloring, altered anatomy, text, logo, watermark, or extra elements.
```

## Faris proportion correction

The final `faris-anchor.png` received one additional built-in edit after the
initial batch review. Image 1 was the magenta-key Faris proof and the request
changed only compact stature cues, round build, and fluffy hair while preserving
identity, face, glasses, outfit, pose direction, hands, rendering, and the flat
magenta field. The correction introduced no text, identifiers, props, or extra
people.
