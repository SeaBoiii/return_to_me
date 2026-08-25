# Chapter 1 character approval proofs

Generated on 25 August 2026 with OpenAI's built-in image-generation tool. The
tool did not expose an exact model name or version, so the generator is recorded
as **unspecified**. These files are the approved first-gate identity and outfit
anchors. They are not production sprites and were not copied directly to
`public`; their production derivatives passed deterministic matting,
normalization, and final batch QA before promotion.

## Status

| Proof | Selected file | Native size | Review status |
| --- | --- | --- | --- |
| Primary 6 Aleem, uniform | `aleem-p6-anchor.png` | 1086x1448 RGB | Approved identity/outfit anchor; tolerant matting completed for production derivatives |
| Alya, uniform | `alya-p6-anchor.png` | 1024x1536 RGB | Approved identity/outfit anchor; tolerant matting completed for production derivatives |
| Young Aleem, home clothes | `aleem-young-home-anchor.png` | 1086x1448 RGB | Approved identity/outfit anchor; tolerant matting completed for production derivatives |
| Young Alya, home clothes | `alya-young-home-anchor.png` | 1024x1536 RGB | Approved identity/outfit anchor; tolerant matting completed for production derivatives |

The first generation of every proof explicitly requested genuine alpha. The
built-in tool instead returned an RGB image containing a baked white/grey
checker pattern. Those backgrounds were rejected. A background-only built-in
edit replaced each checker pattern with the established vivid-magenta technical
fallback. The selected magenta fields are visually flat and contain no scene,
floor, or shadow, but their pixels have a narrow generated colour range rather
than one exact RGB value. Production therefore used the existing
border-connected tolerant matting and magenta-despill workflow, followed by
edge review against light, dark, and teal backgrounds.

No expression variants, CGs, production cutouts, story mappings, or deployed
assets were created in this approval step.

## Reference relationships

- `art/sources/characters/aleem-p6-expression-master.png` is the authoritative
  identity, age, build, hair, glasses, skin-tone, and uniform reference for both
  Aleem proofs.
- `art/sources/characters/alya-expression-master.png` is the authoritative
  identity, age, face, eye scale, twin-braid hairstyle, skin-tone, and uniform
  reference for both Alya proofs.
- `art/proofs/jc-expansion/aleem-jc-proof-v3-magenta.png` is a rendering-quality
  and later-life continuity reference only for Primary 6 Aleem. Its JC age,
  build, outfit, and pose are not copied.
- `art/proofs/jc-expansion/syafiqa-proof.png` is a rendering-quality, anatomy,
  line-weight, and fabric-shading reference only for Alya. Syafiqa's identity,
  age, ponytail, proportions, and JC outfit are not copied.
- Each home-clothes proof uses its newly generated uniform proof as the primary
  identity/rendering anchor and the original expression sheet as supporting
  identity evidence. The home outfits are explicitly fictionalized.

## Primary 6 Aleem uniform prompt

```text
Use case: identity-preserve
Asset type: Chapter 1 visual-novel character identity/outfit approval proof
Input images: Image 1 is the authoritative Primary 6 Aleem identity, age,
body-build, hair, glasses, skin tone, and light-blue uniform reference. Image 2
is the approved later-life Aleem rendering-quality and family-continuity
reference only; do not copy Image 2's teenage proportions, JC outfit, pose, or
age.
Primary request: Create one polished identity anchor of the unmistakably same
Primary 6 Aleem in Singapore in 2009. Preserve Image 1's cute twelve-year-old
Boyanese Malay identity: warm brown skin, short neat dark hair, rectangular
black glasses, natural large but not anime eyes, compact youthful face, short
stature, and round/chubby child build. He wears a generic fictional light-blue
short-sleeve primary-school shirt tucked into dark navy school trousers, with
no school name, badge, crest, tie, or branding.
Style/medium: soft semi-realistic cel-shaded visual-novel illustration matching
the approved project's crisp silhouettes, restrained line work, natural facial
proportions, subtle fabric folds, and mobile-readable polish. Keep the childlike
identity and proportions of Image 1.
Composition/framing: one isolated three-quarter-length character, front
three-quarter view, centered with generous transparent padding; full head and
every strand of hair visible; both complete arms and hands visible in a relaxed
natural pose; no cropped fingers or limbs. Neutral-to-gentle expression with a
tiny, shy warmth suitable as a production identity anchor.
Scene/backdrop: genuinely transparent alpha background, completely empty; no
checkerboard, chroma field, floor, cast shadow, glow, texture, or scenery.
Lighting/mood: soft neutral studio light with gentle warm highlights;
nostalgic, grounded, innocent.
Constraints: aggressively preserve the identity and round child build from
Image 1; age-appropriate and nonsexual; one character only; anatomically
natural hands; clean hair and glasses edges; no props, phone, bag, accessories
beyond glasses, readable text, school identifier, badge, logo, trademark,
watermark, or signature.
Avoid: aging him up, making him tall or skinny, mature jawline, facial hair,
muscular build, glamour pose, oversized anime eyes, altered hairstyle, missing
fingers, cropped hair, opaque background, fake transparency checkerboard, halo
edges.
```

## Alya uniform prompt

```text
Use case: identity-preserve
Asset type: Chapter 1 visual-novel character identity/outfit approval proof
Input images: Image 1 is the authoritative Alya identity, age, face, slightly
larger eyes, twin-braid hairstyle, skin tone, child proportions, and light-blue
primary-school uniform reference. Image 2 is the approved project's
rendering-quality, anatomy, line-weight, and fabric-shading reference only; do
not copy Image 2's identity, ponytail, JC age, body proportions, or outfit.
Primary request: Create one polished identity anchor of the unmistakably same
Alya, a fictional twelve-year-old Singaporean Malay Primary 6 girl in 2009.
Preserve Image 1's warm medium-brown skin, youthful natural face, slightly
larger expressive dark eyes, and long dark hair in two tidy braids falling
forward over her shoulders. She wears a generic fictional light-blue
short-sleeve primary-school blouse tucked into a dark navy modest knee-length
pleated skirt, with no school name, badge, crest, tie, or branding.
Style/medium: soft semi-realistic cel-shaded visual-novel illustration matching
the approved project's crisp silhouettes, restrained line work, natural child
facial proportions, subtle fabric folds, and mobile-readable polish. Keep the
child identity and age treatment from Image 1.
Composition/framing: one isolated three-quarter-length character, front
three-quarter view, centered with generous transparent padding; full head,
fringe, both complete braids and braid ends visible; both complete arms and
hands visible in a relaxed natural pose; no cropped fingers, hair, or limbs.
Neutral-to-gentle expression with a soft friendly smile suitable as a
production identity anchor.
Scene/backdrop: genuinely transparent alpha background, completely empty; no
checkerboard, chroma field, floor, cast shadow, glow, texture, or scenery.
Lighting/mood: soft neutral studio light with gentle warm highlights;
approachable, playful potential, grounded.
Constraints: aggressively preserve Alya's identity and distinctive twin braids
from Image 1; age-appropriate and nonsexual; one character only; anatomically
natural hands; clean fine hair edges; no props, phone, bag, jewellery, makeup,
accessories, readable text, school identifier, badge, logo, trademark,
watermark, or signature.
Avoid: aging her up, romantic glamour, mature body styling, exaggerated curves,
short skirt, oversized anime eyes beyond her established natural
slightly-larger-eye trait, copied Syafiqa identity, ponytail, loose unbraided
hair, missing braid ends, hidden hands, cropped hair, opaque background, fake
transparency checkerboard, halo edges.
```

## Young Aleem home-clothes prompt

```text
Use case: identity-preserve
Asset type: Chapter 1 visual-novel post-graduation home-clothes identity/outfit
approval proof
Input images: Image 1 is the new authoritative Primary 6 Aleem identity and
rendering-quality reference. Image 2 is the supporting expression-sheet
reference for his established child face, short round build, hair, glasses,
and skin tone. Both are references, not edit targets; preserve the same person
exactly.
Primary request: Create one polished anchor of the same Aleem shortly after
Primary 6 graduation, around age twelve to thirteen in 2010, at home. He
remains a cute Boyanese Malay child with warm brown skin, compact youthful
face, short neat dark hair, rectangular black glasses, short stature, and
round/chubby build. Change only his clothing from school uniform to a modest
fictional home outfit: a plain warm oatmeal-beige short-sleeve T-shirt with
subtle navy collar piping and loose dark navy casual trousers. No print, logo,
writing, jewellery, or school elements. The outfit should clearly read as
post-graduation home clothes, period-neutral and ordinary.
Style/medium: exactly the same soft semi-realistic cel-shaded visual-novel
rendering as Image 1, with crisp restrained outlines, natural child
proportions, subtle fabric folds, and mobile-readable silhouette.
Composition/framing: one isolated three-quarter-length character, front
three-quarter view, centered with generous transparent padding; full head and
hair visible; both complete arms and hands visible in a relaxed natural pose;
no cropped fingers or limbs. Gentle, slightly waiting expression—quietly
hopeful rather than sad—suitable as the neutral home identity anchor.
Scene/backdrop: genuinely transparent alpha background, completely empty; no
checkerboard, chroma field, floor, cast shadow, glow, texture, or bedroom
scenery.
Lighting/mood: soft neutral studio light with a faint warm domestic tone.
Constraints: preserve Aleem's exact identity, glasses, hair silhouette, child
age, warm skin, and round build; age-appropriate and nonsexual; one character
only; anatomically natural hands; no props or phone because messages are HTML
overlays; no readable text, badge, logo, trademark, watermark, or signature.
Avoid: aging him into secondary school, making him tall or skinny, changing his
face or glasses, school uniform, collared school shirt, adult styling, facial
hair, oversized anime eyes, hidden hands, cropped hair, opaque background, fake
transparency checkerboard, halo edges.
```

## Young Alya home-clothes prompt

```text
Use case: identity-preserve
Asset type: Chapter 1 visual-novel post-graduation home-clothes identity/outfit
approval proof
Input images: Image 1 is the new authoritative Alya identity and
rendering-quality reference. Image 2 is the supporting expression-sheet
reference for her established child face, slightly larger eyes, long twin
braids, age, proportions, and skin tone. Both are references, not edit targets;
preserve the same person exactly.
Primary request: Create one polished anchor of the same Alya shortly after
Primary 6 graduation, around age twelve to thirteen in 2010, at home. She
remains a fictional Malay child with warm medium-brown skin, youthful natural
face, slightly larger expressive dark eyes, and long dark hair in two tidy
braids falling forward with both braid ends visible. Change only her clothing
from school uniform to a modest fictional home outfit: a loose dusty-lilac
elbow-sleeve tunic blouse extending past the hips with simple navy piping,
paired with dark navy straight casual trousers. No print, logo, writing,
jewellery, makeup, or school elements. The outfit should clearly read as
post-graduation home clothes, ordinary and age-appropriate.
Style/medium: exactly the same soft semi-realistic cel-shaded visual-novel
rendering as Image 1, with crisp restrained outlines, natural child
proportions, subtle fabric folds, and mobile-readable silhouette.
Composition/framing: one isolated three-quarter-length character, front
three-quarter view, centered with generous transparent padding; full head,
fringe, both complete braids and braid ends visible; both complete arms and
hands visible in a relaxed natural pose; no cropped fingers, hair, or limbs.
Gentle, slightly introspective expression—human and tentative, not
villainous—suitable as the neutral home identity anchor.
Scene/backdrop: genuinely transparent alpha background, completely empty; no
checkerboard, chroma field, floor, cast shadow, glow, texture, or bedroom
scenery.
Lighting/mood: soft neutral studio light with a faint warm domestic tone.
Constraints: preserve Alya's exact identity, twin braids, slightly larger
natural eyes, child age, skin tone, and proportions; age-appropriate and
nonsexual; one character only; anatomically natural hands; no props or phone
because messages are HTML overlays; no readable text, badge, logo, trademark,
watermark, or signature.
Avoid: aging her up, mature styling, exaggerated curves, tight clothing, short
skirt, makeup, copied secondary/JC identity, ponytail, loose unbraided hair,
school uniform, oversized anime eyes beyond the established trait, hidden
hands, cropped braid ends, opaque background, fake transparency checkerboard,
halo edges.
```

## Selected magenta background edit

Each rejected checkerboard proof received one built-in background-only edit.
The relevant character, outfit, and invariants were named explicitly. The
normalized edit family was:

```text
Use case: precise-object-edit
Asset type: Chapter 1 visual-novel character approval proof on a safe chroma
background
Input images: Image 1 is the sole edit target: the relevant Chapter 1 identity
anchor.
Primary request: Replace only the baked white-and-light-gray checkerboard
background with one perfectly uniform, flat, vivid magenta chroma-key field
(#FF00FF).
Constraints: preserve the character figure exactly—the identity, child age,
face, expression, skin, hair, glasses where applicable, proportions, pose,
complete arms and hands, clothing, colors, outlines, scale, dimensions, and
composition must not change or be redrawn. Background replacement only.
Scene/backdrop: edge-to-edge solid #FF00FF, a single even color with no texture,
gradient, lighting, shadow, glow, floor, checker pattern, or variation.
Avoid: transparency checkerboard, white or grey background, green or teal key
colors, vignette, halo, subject recoloring, cropped hair or figure, text,
watermark, extra elements.
```

## Manual proof QA

- All four candidates preserve the intended child-age, nonsexual treatment and
  contain no text, logos, badges, crests, watermarks, phones, or school names.
- Primary 6 Aleem remains short and round with short dark hair and rectangular
  glasses. Both Aleem proofs preserve complete hair, arms, and hands. Their
  three-quarter framing ends through the lower trousers and is acceptable for
  an identity proof, but expression production must retain deliberate lower
  padding for normalization.
- Alya retains her slightly larger expressive eyes and two complete long
  braids. Both Alya proofs show complete hair, arms, hands, and full modest
  outfits. Her home expression reads tentative rather than antagonistic.
- Hands and visible fingers are plausible at proof scale. Braids, hair spikes,
  glasses, fingers, and sandal/toe edges remain high-risk areas for later
  matting QA.
- The selected files are RGB magenta-key sources, not genuine-alpha sprites.
  They must not be described as transparent or production-ready.
