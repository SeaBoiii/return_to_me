# Umrah support sprite prompts and provenance

Completed 15 September 2026 for **Return to Me: Before Nurul**. Ten accepted support sprites: five contemporary Nadiah expressions, three Kak Mariam expressions, and two Abang Yusuf expressions. Every requested asset was generated in a separate built-in `image_gen.imagegen` call; no CLI/API fallback or external image source was used. The built-in tool did not expose a selected model setting.

## Identities and production handling

Nadiah was aged from the established NS identity in `art/sources/characters/normalized/nadiah/neutral-master.png`, inspected before generation. Her brown eyes, brows, face shape, and warm skin tone remain recognizable. Her January 2026 wardrobe is a blue-grey hijab, plain teal long open outer layer, and cream inner clothing/trousers. Her hesitant and wistful expressions show observed pauses and distance without depicting evidence of an attachment to anyone.

Kak Mariam and Abang Yusuf are fictional adult designs. Mariam has a rounded mature face and fuller build, muted grey-plum hijab, dusty rose tunic, and taupe trousers. Yusuf is a broad, slightly stocky man with short dark greying hair, a neat beard, an olive-grey shirt, and charcoal trousers. These visual age and appearance choices are fictional connecting design details, not asserted biographical facts.

The initial transparency requests produced either painted checkerboards or RGBA files with broad residual halos. Those sources were rejected. Accepted masters use opaque RGB magenta sources for the established tolerant alpha matting and spill-cleanup pipeline. Do not deploy the unprocessed masters. All ten accepted masters are 1024×1536 PNGs; normalized RGBA masters and deployed 768×1152 lossless WebP files are produced by the separate Umrah processing batch.

Every accepted image was visually inspected at generation. Facial identity, wardrobe, visible hands, expression distinctions, and silhouette separation were checked. Side margins keep hands inside the source canvas; source top margins vary and the standard normalization establishes stage scale/baseline. Final alpha edge, stature, mobile, and in-engine validation is recorded separately in the production review.

## Processed contact-sheet review

Reviewed all ten deployed support sprites on 15 September 2026 against the light and dark halves of [Nadiah's sheet](../qa/umrah/nadiah-umrah.jpg), [Mariam's sheet](../qa/umrah/mariam.jpg), and [Yusuf's sheet](../qa/umrah/yusuf.jpg). No visible magenta fringe, background halo, checkerboard remnant, or transparent clothing remains. Face and wardrobe continuity, baseline, expression readability, and hand silhouettes are consistent across each family. Mariam's small encouraging hand gesture stays inside the frame. The normalized designs remain visually distinct from one another.

## Exact accepted requests

### mariam-encouraging

- Source: `art/sources/umrah/sprites/mariam-encouraging-master.png`
- Exact tool metadata and original generated path: [mariam-encouraging-generation.json](../sources/umrah/sprites/mariam-encouraging-generation.json)
- Reference at generation: `art/sources/umrah/sprites/mariam-neutral-master.png`

```text
Use case: identity-preserve. Edit the referenced Kak Mariam sprite into an encouraging expression and subtle gesture. Preserve exactly this fictional Malay Singaporean woman's identity, forties, rounded mature face, brown eyes, broad cheeks, fuller build, plain muted grey-plum hijab, loose long dusty rose tunic and dark taupe trousers. Change expression to a gentle reassuring smile with brows raised slightly in friendly encouragement. Lift her right hand just a little from waist, palm softly open upward in a small conversational gesture, with all five fingers anatomically natural; her other hand rests at waist. Not pointing, no grand gesture. Same soft semi-realistic cel-shaded visual novel illustration and gentle neutral lighting. 1024x1536 portrait; single person centered, head to below knees, hands fully visible with generous side margins, same scale as reference. Retain the uniform flat vivid magenta RGB(255,0,255) chroma-key backdrop for production alpha matting. Fully opaque woman, no magenta on subject, no gradient or shadows in backdrop, no checkerboard, no scenery, no text, no watermark.
```

### mariam-neutral

- Source: `art/sources/umrah/sprites/mariam-neutral-master.png`
- Exact tool metadata and original generated path: [mariam-neutral-generation.json](../sources/umrah/sprites/mariam-neutral-generation.json)
- Reference at generation: `art/sources/umrah/rejected/mariam-neutral-halo.png`

```text
Use case: background-extraction. Edit the referenced Kak Mariam neutral sprite. Preserve exactly this fictional Malay Singaporean woman's identity, forties, rounded mature face, brown eyes, broad cheeks, fuller build, plain muted grey-plum hijab, loose long dusty rose tunic and dark taupe trousers, neutral friendly closed-mouth expression and hands naturally together. Change ONLY the background to uniform flat vivid pure magenta RGB(255,0,255) for production alpha matting. Remove all existing transparency, dark backdrop, haze and outer glow; fully opaque woman with clean crisp antialiased silhouette against an entirely flat magenta background. Same soft semi-realistic cel-shaded visual novel illustration and gentle neutral lighting. 1024x1536 portrait, centered head to below knees, all fingers visible. No magenta on the woman, no gradient or shadow in backdrop, no scenery, no checkerboard, no text, no watermark.
```

### mariam-warm

- Source: `art/sources/umrah/sprites/mariam-warm-master.png`
- Exact tool metadata and original generated path: [mariam-warm-generation.json](../sources/umrah/sprites/mariam-warm-generation.json)
- Reference at generation: `art/sources/umrah/sprites/mariam-neutral-master.png`

```text
Use case: identity-preserve. Edit the referenced Kak Mariam sprite into a warm expression. Preserve exactly this fictional Malay Singaporean woman's identity, forties, rounded mature face, brown eyes, broad cheeks, fuller build, plain muted grey-plum hijab, loose long dusty rose tunic and dark taupe trousers. Change ONLY expression to a broad sincere welcoming smile showing a little upper teeth, smiling eyes and relaxed shoulders. Keep hands naturally together at waist, all fingers clear. Same soft semi-realistic cel-shaded visual novel illustration and gentle neutral lighting. 1024x1536 portrait; keep single person centered, head to below knees, same framing. Retain the uniform flat vivid magenta RGB(255,0,255) chroma-key backdrop for production alpha matting. Fully opaque woman, no magenta on subject, no gradient or shadows in backdrop, no checkerboard, no scenery, no text, no watermark.
```

### nadiah-umrah-amused

- Source: `art/sources/umrah/sprites/nadiah-umrah-amused-master.png`
- Exact tool metadata and original generated path: [nadiah-umrah-amused-generation.json](../sources/umrah/sprites/nadiah-umrah-amused-generation.json)
- Reference at generation: `art/sources/umrah/sprites/nadiah-umrah-neutral-master.png`

```text
Use case: identity-preserve. Edit the reference Nadiah Umrah character sprite into an amused expression variant. Keep EXACTLY the same adult Malay Singaporean face and identity, age about thirty, brown eyes, blue-grey hijab, plain long teal open outer layer, cream inner top and cream trousers, proportions and overall composition. Change only her expression: an easy playful laugh, a small open smile showing upper teeth, eyes naturally narrowed with amusement, one brow slightly raised as she gently teases an old friend. Hands remain naturally together in front. Same soft semi-realistic cel-shaded visual novel finish, gentle neutral lighting. One person centered head to below knees, 1024x1536 portrait, generous top and side margins, visible hands and fingers. Retain a uniform flat vivid magenta RGB(255,0,255) chroma-key backdrop for production alpha matting; no magenta on subject, no gradient or shadows in backdrop, no checkerboard, no scenery, no text, no watermark.
```

### nadiah-umrah-hesitant

- Source: `art/sources/umrah/sprites/nadiah-umrah-hesitant-master.png`
- Exact tool metadata and original generated path: [nadiah-umrah-hesitant-generation.json](../sources/umrah/sprites/nadiah-umrah-hesitant-generation.json)
- Reference at generation: `art/sources/umrah/sprites/nadiah-umrah-neutral-master.png`

```text
Use case: identity-preserve. Edit the reference Nadiah Umrah character sprite into a hesitant expression variant. Keep EXACTLY the same adult Malay Singaporean face and identity, age about thirty, brown eyes, blue-grey hijab, plain long teal open outer layer, cream inner top and cream trousers, proportions and overall composition. Change only her expression: lips softly parted as though pausing before replying, eyes shifting slightly to her right, a subtle uncertain crease in the eyebrows, shoulders slightly held. No tears, no guilt or melodrama. Hands remain naturally together in front. Same soft semi-realistic cel-shaded visual novel finish, gentle neutral lighting. One person centered head to below knees, 1024x1536 portrait, generous top and side margins, visible hands and fingers. Retain a uniform flat vivid magenta RGB(255,0,255) chroma-key backdrop for production alpha matting; no magenta on subject, no gradient or shadows in backdrop, no checkerboard, no scenery, no text, no watermark.
```

### nadiah-umrah-neutral

- Source: `art/sources/umrah/sprites/nadiah-umrah-neutral-master.png`
- Exact tool metadata and original generated path: [nadiah-umrah-neutral-generation.json](../sources/umrah/sprites/nadiah-umrah-neutral-generation.json)
- Reference at generation: `art/sources/umrah/rejected/nadiah-umrah-neutral-checkerboard.png`

```text
Use case: background-extraction. Edit the reference Nadiah Umrah neutral visual-novel sprite. Keep EXACTLY her same face, adult identity, neutral closed smile, brown eyes, hands and modest travel outfit: blue-grey hijab, teal long open outer layer, cream inner top and trousers. Keep same soft semi-realistic cel-shaded style, portrait 1024x1536 head to below knees, subject centered, all fingers visible. Change ONLY the background: replace every checkerboard square and grey texture behind the figure with one absolutely uniform flat vivid pure magenta RGB(255,0,255) chroma-key background. No magenta on the woman herself, no shadow, no gradient, no checkerboard, no text. Clean hard-to-soft antialiased silhouette separation for later production alpha matting.
```

### nadiah-umrah-warm

- Source: `art/sources/umrah/sprites/nadiah-umrah-warm-master.png`
- Exact tool metadata and original generated path: [nadiah-umrah-warm-generation.json](../sources/umrah/sprites/nadiah-umrah-warm-generation.json)
- Reference at generation: `art/sources/umrah/sprites/nadiah-umrah-neutral-master.png`

```text
Use case: identity-preserve. Edit the reference Nadiah Umrah character sprite into a warm expression variant. Keep EXACTLY the same adult Malay Singaporean face and identity, age about thirty, brown eyes, blue-grey hijab, plain long teal open outer layer, cream inner top and cream trousers, proportions and overall composition. Change only her expression: a small sincere affectionate smile, softer eyes and gently relaxed shoulders, hands still naturally together in front. She is warmly recognizing an old friend, without exaggerated romance or glamour. Same soft semi-realistic cel-shaded visual novel finish, gentle neutral lighting. One person centered head to below knees, 1024x1536 portrait, generous top and side margins, visible hands and fingers. Retain a uniform flat vivid magenta RGB(255,0,255) chroma-key backdrop for production alpha matting; no magenta on subject, no gradient or shadows in backdrop, no checkerboard, no scenery, no text, no watermark.
```

### nadiah-umrah-wistful

- Source: `art/sources/umrah/sprites/nadiah-umrah-wistful-master.png`
- Exact tool metadata and original generated path: [nadiah-umrah-wistful-generation.json](../sources/umrah/sprites/nadiah-umrah-wistful-generation.json)
- Reference at generation: `art/sources/umrah/sprites/nadiah-umrah-neutral-master.png`

```text
Use case: identity-preserve. Edit the reference Nadiah Umrah character sprite into a wistful expression variant. Keep EXACTLY the same adult Malay Singaporean face and identity, age about thirty, brown eyes, blue-grey hijab, plain long teal open outer layer, cream inner top and cream trousers, proportions and overall composition. Change only her expression: gaze slightly lowered and distant as though a private thought has interrupted her, mouth relaxed with a faint trace of a bittersweet smile, eyebrows gently softened rather than sharply worried. A restrained quiet longing, no tears and no visible evidence of what she is thinking. Hands remain naturally together in front. Same soft semi-realistic cel-shaded visual novel finish, gentle neutral lighting. One person centered head to below knees, 1024x1536 portrait, generous top and side margins, visible hands and fingers. Retain a uniform flat vivid magenta RGB(255,0,255) chroma-key backdrop for production alpha matting; no magenta on subject, no gradient or shadows in backdrop, no checkerboard, no scenery, no text, no watermark.
```

### yusuf-neutral

- Source: `art/sources/umrah/sprites/yusuf-neutral-master.png`
- Exact tool metadata and original generated path: [yusuf-neutral-generation.json](../sources/umrah/sprites/yusuf-neutral-generation.json)
- Reference at generation: `art/sources/umrah/rejected/yusuf-neutral-halo.png`

```text
Use case: background-extraction. Edit the referenced Abang Yusuf neutral sprite. Preserve EXACTLY this fictional Malay Singaporean man's identity, age forties, broad slightly stocky sturdy build, mature squared round face, dark brown eyes, short brushed black hair with a little grey at temples, neat short beard and moustache, no glasses, muted olive-grey rolled-sleeve casual button shirt and charcoal trousers. Same faint closed-mouth friendly smile, relaxed hands at sides, all fingers naturally visible. Change ONLY the background to uniform flat vivid pure magenta RGB(255,0,255) for production alpha matting. Remove all existing transparency, dark backdrop, haze and outer glow; fully opaque man with clean crisp antialiased silhouette against an entirely flat magenta background. Same soft semi-realistic cel-shaded visual novel illustration and gentle neutral lighting. 1024x1536 portrait, centered head to below knees. No magenta on the man, no gradient or shadow in backdrop, no scenery, no checkerboard, no text, no watermark.
```

### yusuf-warm

- Source: `art/sources/umrah/sprites/yusuf-warm-master.png`
- Exact tool metadata and original generated path: [yusuf-warm-generation.json](../sources/umrah/sprites/yusuf-warm-generation.json)
- Reference at generation: `art/sources/umrah/sprites/yusuf-neutral-master.png`

```text
Use case: identity-preserve. Edit the referenced Abang Yusuf sprite into a warm expression variant. Preserve EXACTLY this fictional Malay Singaporean man's identity, age forties, broad slightly stocky sturdy build, mature squared round face, dark brown eyes, short brushed black hair with a little grey at temples, neat short beard and moustache, no glasses, muted olive-grey rolled-sleeve casual button shirt and charcoal trousers. Change ONLY his expression: an easy broad welcoming smile showing a little upper teeth, eyes gently crinkled with ordinary friendly amusement. Keep relaxed shoulders and hands at sides, all fingers naturally visible. Same soft semi-realistic cel-shaded visual novel illustration and gentle neutral lighting. 1024x1536 portrait, centered head to below knees, same proportions and framing. Retain the uniform flat vivid pure magenta RGB(255,0,255) backdrop for production alpha matting. Fully opaque man with clean antialiased silhouette, no magenta on the man, no gradient or shadow in backdrop, no scenery, no checkerboard, no text, no watermark.
```

## Rejected source history and anchor briefs

Rejected images remain in `art/sources/umrah/rejected` for provenance only. A reference path inside a historical request records the path used at that moment; moved rejected files are linked below. Generation quota interrupted the wistful and Yusuf cleanup calls; both were subsequently completed after the user resumed, without changing the accepted identity anchors.

### mariam-neutral-halo

RGBA with a broad visible residual background halo and semi-opaque figure; rejected despite having an alpha channel. [Original request metadata](../sources/umrah/rejected/mariam-neutral-halo-generation.json).

```text
Use case: illustration-story. Asset type: transparent visual novel character sprite, neutral identity anchor. Create Kak Mariam, a wholly fictional adult Malay Singaporean married woman in her forties with a warm softly rounded face, medium warm brown skin, gentle deep brown eyes, broad cheeks and a small rounded nose. Her face should feel mature and kind, clearly distinct from a slender younger heroine. Modest comfortable Umrah travel outfit: fully covering plain muted plum hijab (desaturated grey-plum), loose long dusty rose tunic and dark taupe wide modest trousers; no patterns or jewellery. Neutral friendly closed-mouth expression, hands loosely resting together at waist, all fingers naturally drawn. Soft semi-realistic cel-shaded visual novel illustration with delicate clean contours, subtle warm skin shading and softly painted fabric folds, restrained lifelike adult proportions, gentle neutral illumination. One person centered straight-on, head to below knees, 1024x1536 portrait canvas, generous top and side margins, hands fully visible, lower legs may continue past bottom edge. GENUINELY TRANSPARENT RGBA background and clean alpha edges. Do not paint checkerboard texture to simulate transparency. No background, shadows, scenery, text, watermark or other people.
```

### mariam-warm-checkerboard

RGB painted checkerboard; no alpha. [Original request metadata](../sources/umrah/rejected/mariam-warm-checkerboard-generation.json).

```text
Use case: identity-preserve. Edit the referenced Kak Mariam sprite into a warm expression. Preserve exactly this fictional Malay Singaporean woman's identity, forties, rounded mature face, brown eyes, broad cheeks, fuller build, plain muted grey-plum hijab, loose long dusty rose tunic and dark taupe trousers. Change expression to a broad sincere closed-mouth welcoming smile, smiling eyes and relaxed shoulders. Keep hands naturally together at waist, all fingers clear. Same soft semi-realistic cel-shaded visual novel illustration and gentle neutral lighting. 1024x1536 portrait; keep single person centered, head to below knees, increase clear top margin a little so her hijab does not approach the top edge. Preserve genuine RGBA transparency with a completely transparent background and clean character edges; no painted backdrop, no outer glow, no edge haze, no checkerboard, no text, no watermark. Keep the figure fully opaque.
```

### nadiah-umrah-neutral-checkerboard

RGB painted checkerboard; no alpha. [Original request metadata](../sources/umrah/rejected/nadiah-umrah-neutral-checkerboard-generation.json).

```text
Use case: identity-preserve. Asset type: one transparent visual novel character sprite. Edit the referenced Nadiah character into the same woman at age around thirty, January 2026, preserving her recognizable warm medium tan Malay Singaporean face, almond brown eyes, full dark brows and nose shape. Subtle adult facial maturity, same natural appearance. Replace the embroidered outfit with practical modest Umrah travel clothing: a muted blue-grey hijab fully covering hair and neck, long soft teal open outer layer with plain cream long-sleeved inner clothing and cream modest trousers. No patterns. Neutral friendly expression, lips gently closed, hands relaxed together in front with every finger anatomically clear. Preserve the soft semi-realistic cel-shaded illustration style and gentle neutral lighting of the reference. Single person centered straight-on, head to below knees, 1024x1536 portrait canvas, generous clear top and side margins, no hands cut off. Keep full visible silhouette within the canvas except lower legs at bottom. Genuine transparent RGBA background with clean soft alpha edges; do not paint a checkerboard or any background texture. No text, no watermark, no extra objects, no halos, no scenery. This is the neutral identity and wardrobe anchor for later expressions.
```

### yusuf-neutral-halo

RGBA with a broad visible residual background halo and semi-opaque figure; rejected despite having an alpha channel. [Original request metadata](../sources/umrah/rejected/yusuf-neutral-halo-generation.json).

```text
Use case: illustration-story. Asset type: transparent visual novel character sprite, neutral identity anchor. Create Abang Yusuf, a wholly fictional adult Malay Singaporean married man in his forties. Warm medium brown skin, broad slightly stocky sturdy build, mature squared round face, dark brown eyes, short neatly brushed black hair with very slight greying at temples, a neatly trimmed short beard and moustache, no glasses. His expression is relaxed and approachable, a faint closed-mouth smile. Comfortable modest Umrah travel outfit: plain muted olive-grey long-sleeved casual button shirt with sleeves rolled neatly just below elbows, no logos, charcoal modest trousers. Arms comfortably at sides with both hands entirely visible and naturally relaxed, all fingers anatomically clear. Soft semi-realistic cel-shaded visual novel illustration with delicate clean contours, subtle warm skin shading and softly painted fabric folds, lifelike adult proportions, gentle neutral illumination. One person centered straight-on, head to below knees, 1024x1536 portrait canvas, generous top and side margins. GENUINELY TRANSPARENT RGBA background and clean alpha edges with fully opaque subject. Do not paint checkerboard texture to simulate transparency. No background, glow, shadows, scenery, text, watermark or other people.
```
