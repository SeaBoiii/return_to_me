# JC expansion proof prompts

These are the normalized prompts used with OpenAI's built-in image generation
tool on 25 August 2026. The referenced local images are existing project
masters and were used only for identity or style guidance.

## Aleem

```text
Use case: identity-preserve
Asset type: visual-novel character identity and outfit proof
Input images: art/sources/characters/aleem-sec-expression-master.png is the
authoritative identity and rendering reference for teenage Aleem.
Primary request: Create a clean two-pose identity proof of the same Aleem at
age 17–18 in Singapore junior college. Age him forward subtly while preserving
his recognizable face, warm brown skin tone, Boyanese Malay identity, short
neat black hair, rectangular black glasses, cute gentle features, and tall
skinny build. Pose one wears a fictional JC uniform: crisp white short-sleeve
collared shirt, muted teal tie, charcoal trousers, no crest or badge. Pose two
wears modest zoo-day casual clothes: forest-green lightweight overshirt, plain
cream T-shirt, dark navy chinos.
Style/medium: exactly the same soft semi-realistic cel-shaded visual-novel
illustration language as the reference, crisp restrained outlines, polished
mobile-readable silhouette.
Composition/framing: two clearly separated three-quarter-length figures,
neutral relaxed pose and mild determined smile, complete head/hair/hands
visible, consistent scale.
Scene/backdrop: perfectly flat bright chroma-key green background with even
color and no shadow or texture.
Lighting/mood: soft neutral studio light, hopeful but grounded.
Constraints: age-appropriate and nonsexual; preserve identity; no school name,
badge, logo, readable text, watermark, extra people, props, or cropped
hair/hands.
```

## Syafiqa

```text
Use case: stylized-concept
Asset type: visual-novel character identity proof
Input images: art/sources/characters/hana-expression-master.png and
art/sources/characters/aleem-sec-expression-master.png are style,
age-treatment, line-weight, and uniform-rendering references only; do not copy
either character's identity.
Primary request: Design Syafiqa, a fictional 17–18-year-old Singaporean Malay
junior-college student. She is tall, with a distinct friendly face, warm
medium-brown skin, expressive dark eyes, no glasses, and long dark hair neatly
tied back in a low ponytail. Show two consistent three-quarter-length poses:
neutral and warm smiling.
Style/medium: match the references' soft semi-realistic cel-shaded visual-novel
art, crisp restrained outlines, natural facial proportions, readable
silhouette.
Subject clothing: fictional unnamed JC uniform with white short-sleeve blouse,
muted teal tie, charcoal below-knee skirt, no crest or badge.
Scene/backdrop: perfectly flat bright chroma-key green background with even
color and no shadow or texture.
Lighting/mood: soft neutral studio light; approachable, self-possessed, human
rather than romanticized.
Constraints: age-appropriate and nonsexual; distinct from Hana; consistent
face/body/hair/outfit across both poses; complete head, ponytail, arms, and
hands visible; no text, logo, badge, watermark, props, extra people, or
stereotyped ethnic features.
```

## Mei Lin

```text
Use case: stylized-concept
Asset type: visual-novel character identity and outfit proof
Input images: art/sources/characters/hana-expression-master.png and
art/sources/characters/aleem-sec-expression-master.png are style,
age-treatment, line-weight, and uniform-rendering references only; do not copy
either character's identity.
Primary request: Design Mei Lin, a fictional 17–18-year-old Singaporean Chinese
junior-college student who is notably very short. She has a distinct cute but
natural face, fair-to-light warm skin, long straight dark hair, and dark round
glasses. Show two consistent three-quarter-length poses: one in school uniform
with a focused supportive expression, one in modest zoo-day casual clothes
with a small bright smile.
Style/medium: match the references' soft semi-realistic cel-shaded visual-novel
art, crisp restrained outlines, natural facial proportions, mobile-readable
silhouette.
Subject clothing: school pose wears the same fictional unnamed JC palette—
white short-sleeve blouse, muted teal tie, charcoal below-knee skirt, no crest
or badge. Casual pose wears a pale yellow short-sleeve blouse and dark navy
jeans, no logos.
Scene/backdrop: perfectly flat bright chroma-key green background with even
color and no shadow or texture.
Lighting/mood: soft neutral studio light; diligent, quietly funny, supportive,
fully age-appropriate.
Constraints: age-appropriate and nonsexual; distinct from Hana and Syafiqa;
consistent identity across outfits; complete head, hair, arms, and hands
visible; no text, logo, badge, watermark, props, extra people, or stereotyped
ethnic features.
```

## Bus interior

```text
Use case: stylized-concept
Asset type: 16:9 visual-novel background style proof
Input images: art/sources/bg-bus-stop-master.png is the authoritative
Singapore-period environment and palette reference;
art/sources/bg-language-classroom-master.png is an indoor rendering-style
reference.
Primary request: Create an empty, generic Singapore public-bus interior around
2014, viewed from the middle aisle toward a row of paired seats and broad
windows. Include period-plausible blue-grey patterned seats, simple metal rails
and hanging grips, soft residential greenery and HDB blocks passing outside,
with no identifiable route or operator.
Style/medium: soft semi-realistic cel-shaded visual-novel environment, crisp
architecture, restrained line work, painterly detail matching the references.
Composition/framing: wide 16:9 establishing view at seated eye level; strong
perspective; clear paired seats where two character sprites could later sit;
generous uncluttered visual space for dialogue UI.
Lighting/mood: gentle early-morning gold mixed with misty green and cool
interior shadows; intimate, sleepy commute mood.
Constraints: background only, no people; no readable text, route numbers,
advertisements, logos, trademarks, badges, watermarks, or distorted seating
geometry.
```

## Revised Aleem anchor

```text
Use case: identity-preserve
Asset type: revised visual-novel character identity and outfit approval proof
Input images: Image 1 is the authoritative secondary-school Aleem identity and
rendering reference. Image 2 is the current JC proof and is the edit target for
its two-pose layout and outfits.
Primary request: Revise the current proof into the unmistakably same Aleem at
age 17–18. Change only the facial continuity, pose visibility, and background
treatment needed below; preserve the established character, tall skinny build,
outfits, palette, and soft semi-realistic cel-shaded style.
Subject: Boyanese Malay Singaporean teenage boy with warm brown skin, short
neat black hair, rectangular black glasses, and gentle cute features. His
growth from Image 1 must be subtle. Match Image 1's smaller natural eye scale,
lighter/narrower eyebrows, compact face shape, nose, mouth, ear placement,
glasses proportions, and distinctive short-hair silhouette. He should look
about two years older, not redesigned and not like a relative. Keep a youthful
JC-age face without facial hair.
Outfits: left pose wears the fictional JC uniform from Image 2—white
short-sleeve collared shirt, muted-teal tie, charcoal trousers, black belt, no
badge or crest. Right pose wears the same modest zoo-day outfit—forest-green
lightweight overshirt, plain cream T-shirt, dark navy chinos.
Style/medium: exactly the polished soft semi-realistic cel-shaded visual-novel
rendering used in Image 1, with crisp restrained outlines and natural
proportions.
Composition/framing: one clean sheet containing two clearly separated
three-quarter-length figures at consistent scale and baseline; uniform pose
neutral and grounded, casual pose with a mild determined smile. Complete head,
hair, arms, and both hands fully visible; hands outside pockets in relaxed
natural positions; no cropped extremities.
Scene/backdrop: genuinely transparent alpha background, completely empty, with
no green key colour, backdrop, floor, texture, glow, or cast shadow.
Constraints: preserve Aleem's identity aggressively; age-appropriate and
nonsexual; no props, extra people, readable text, school name, badge, crest,
logo, watermark, accessories beyond his glasses, or mature styling.
Avoid: oversized anime eyes, heavy brows, elongated adult face, new hairstyle,
broad/muscular build, hands in pockets, green spill, halo edges, opaque
background.
```

## Revised Mei Lin anchor

```text
Use case: identity-preserve
Asset type: revised visual-novel character identity and outfit approval proof
Input images: Image 1 is the current Mei Lin proof and the identity/outfit edit
target. Image 2 is an age-treatment, facial-proportion, line-weight, and
rendering-style reference only; do not copy Hana's identity, glasses, skin
tone, hair shape, or clothing.
Primary request: Revise Mei Lin so she reads unmistakably as a 17–18-year-old
junior-college student while remaining very short, cute, diligent, quietly
funny, and recognizably the same person from Image 1. Change only her
age/proportion cues, hand visibility, prop removal, and background treatment.
Preserve her fair-to-light warm complexion, long straight dark hair, dark
round glasses, outfits, and cross-outfit identity.
Subject proportion changes: slightly reduce eye and head size relative to her
face and body; lengthen and mature the face subtly; give her natural late-teen
shoulder, torso, arm, and hand proportions. Retain a soft youthful expression
and very short stature. She must look like a petite 17–18-year-old, not a child
and not an adult in her twenties.
Outfits: left pose keeps the fictional JC uniform—white short-sleeve blouse,
muted-teal tie, charcoal below-knee skirt, no badge or crest—with a focused
supportive expression. Right pose keeps the pale-yellow short-sleeve blouse
and dark navy jeans with a small bright smile.
Style/medium: polished soft semi-realistic cel-shaded visual-novel art matching
Image 2's natural JC-age treatment, crisp restrained outlines, and
mobile-readable silhouette while preserving Mei Lin's distinct identity.
Composition/framing: one clean sheet containing two clearly separated
three-quarter-length poses, same baseline and consistent identity. Remove the
notebook entirely. Both arms and both complete hands must be plainly visible
in natural relaxed positions, not behind her back and not cropped. Preserve
full head and all hair. Leave deliberate transparent padding so her final
sprite can be rendered noticeably shorter than taller classmates on a shared
scale-calibrated canvas.
Scene/backdrop: genuinely transparent alpha background, completely empty, with
no green key colour, backdrop, floor, texture, glow, or cast shadow.
Constraints: age-appropriate and nonsexual; distinct from Hana and Syafiqa; no
props, extra people, readable text, school name, badge, crest, logo, watermark,
stereotyped ethnic features, opaque background, halo, or green spill.
Avoid: childlike head-to-body ratio, oversized anime eyes, doll-like face,
adult glamour styling, hidden hands, notebook, copied Hana identity.
```

## Selected non-green background edit

The built-in transparency requests returned opaque images, so those results
were rejected. Each selected revised anchor then received this background-only
edit, with the relevant character name substituted:

```text
Use case: precise-object-edit
Asset type: visual-novel character approval proof on a safe chroma background
Input images: Image 1 is the sole edit target.
Primary request: Replace only the baked white-and-light-gray checkerboard
background with one perfectly uniform, flat, vivid magenta chroma-key field
(#FF00FF).
Constraints: preserve both character figures exactly—their identities, faces,
hair, glasses, proportions, poses, hands, clothing, colors, outlines, spacing,
dimensions, and composition must not change or be redrawn. Background
replacement only.
Scene/backdrop: edge-to-edge solid #FF00FF, a single even color with no texture,
gradient, lighting, shadow, glow, floor, checker pattern, or variation.
Avoid: transparency checkerboard, green or teal key colors, vignette, halo,
subject recoloring, text, watermark, extra elements.
```

The generator produced a narrow range of magenta rather than one exact RGB
value. These files are therefore approval anchors only; final cutouts require
tolerant matting and spill cleanup.
