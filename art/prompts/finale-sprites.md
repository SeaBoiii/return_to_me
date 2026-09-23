# Nurulain sprite prompts and provenance

Generated for **Return to Me** on 23 September 2026 using the built-in OpenAI image generator, one call per requested asset or correction. The exact model is not exposed by the tool. All selected masters and rejected transparency attempts are retained below `art/sources/finale`.

Nurulain is the author-approved adult Malay Singaporean design: golden-brown complexion matching Aleem, a warm dusty-rose hijab covering hair, neck and chest, opaque baggy beige tunic with wrist-length sleeves, and a loose dark taupe ankle-length skirt. Her visible deployed stature is 947 px beside Aleem at 1050 px, representing the supplied 165 cm / 183 cm height relationship.

Aleem supplies complexion and rendering style only in the original identity design. Nadiah supplies rendering finish and framing only; neither reference supplies Nurulain's facial identity or wardrobe. Later expressions reference the selected Nurulain neutral master. The initial genuine-alpha request produced an unsuitable halo and was corrected to an opaque flat-magenta source for the existing border-connected matting pipeline. The amused expression also needed a halo correction. Exact requests and source metadata follow.

## Initial identity design and rejected transparency

### nurulain-neutral-halo

- References: `art/sources/umrah/sprites/aleem-umrah-neutral-master.png` (complexion and rendering style only); `art/sources/umrah/sprites/nadiah-umrah-neutral-master.png` (rendering finish and framing only).
- Metadata: `art/sources/finale/rejected/nurulain-neutral-halo-generation.json`.
- Original source: `C:/Users/seabo/.codex/generated_images/01a0cced-3c90-7e42-99c6-5c877ba3a64a/exec-89d8d55d-9dfb-4e7c-933b-1ad788e49234.png`.
- Status: rejected: opaque halo background, retained as identity design.

```text
Use case: illustration-story. Asset type: one isolated visual-novel character sprite identity anchor, nurulain-neutral, for Return to Me. Create a DISTINCT NEW adult Malay Singaporean woman Nurulain, late twenties, warm medium golden-brown skin closely matching Aleem in reference 1, soft rounded oval face, dark brown almond eyes, natural full brows, small rounded nose, kind approachable face whose smile can be bright. Reference1 Aleem is a SKIN TONE and illustration style reference ONLY, do not include him. Reference2 Nadiah is illustration finish/framing reference ONLY, do not copy her face or clothes. Nurul is165cm compared to Aleem183cm. She wears a plain muted warm dusty-rose full hijab draping generously over hair, neck, shoulders and entire chest; no hair or neck visible, face uncovered. Baggy opaque full-length long-sleeved pale warm stone-beige tunic with very loose sleeves to wrists and no waist shaping, over an opaque loose dark taupe ankle-length skirt. Hands relaxed together low in front, fingers visible and natural. Expression neutral attentive with a tiny welcoming closed-mouth smile, eyes softly looking toward viewer left. Soft semi-realistic cel-shaded visual-novel illustration, delicate clean linework, natural fabric shading, consistent with supplied style. Portrait1024x1536, one centered person from head through below knees, ample top and side margin, complete hands, skirt continues to low crop. Genuine transparent RGBA background, fully opaque figure, crisp antialiased silhouette, no scenery, floor shadow, glow, checkerboard, text, watermark, accessories, or props. This is the permanent character identity anchor, modest and ordinary, no fashion glamour.
```

### nurulain-amused-halo

- Metadata: `art/sources/finale/rejected/nurulain-amused-halo-generation.json`.
- Original source: `C:/Users/seabo/.codex/generated_images/01a0cced-3c90-7e42-99c6-5c877ba3a64a/exec-a24a3d10-20c0-4ebd-a4ba-ffd361b69230.png`.
- Status: rejected halo.
- References: `art/sources/finale/sprites/nurulain-neutral-master.png`.

```text
Use case: identity-preserve. Edit this exact Nurulain neutral identity sprite into one amused variant. Preserve exactly her adult Malay Singaporean face, warm golden-brown skin, dark eyes, age, body proportions, dusty rose full hijab draping over hair neck shoulders and entire chest, baggy opaque beige long tunic with sleeves to wrists, dark taupe loose long skirt, delicate cel-shaded linework and all framing. Change only facial performance and subtle posture: Her characteristic bright smile shows a little upper teeth, eyes crinkle with natural laughter, shoulders ease. Adult natural humour, not an exaggerated cartoon grin. Hands stay together. Portrait1024x1536 one isolated centered woman head to below knees, full hands intact, same scale and generous margins. Preserve perfectly flat solid vivid magenta RGB(255,0,255) chroma-key backdrop; woman fully opaque; no magenta spill, backdrop shadow, halo, glow, scenery, checkerboard, text or watermark.
```

## Selected sprite masters

### nurulain-neutral

- Master: `art/sources/finale/sprites/nurulain-neutral-master.png`.
- Metadata: `art/sources/finale/sprites/nurulain-neutral-generation.json`.
- Original source: `C:/Users/seabo/.codex/generated_images/01a0cced-3c90-7e42-99c6-5c877ba3a64a/exec-894e2b37-01ad-4d9b-8b3a-1834a560b231.png`.
- References: `art/sources/finale/rejected/nurulain-neutral-halo.png`.

```text
Use case: background-extraction. Edit this exact Nurulain identity anchor. Preserve her exact face, eyes, skin tone, dusty-rose full hijab covering her hair neck shoulders and chest, baggy beige wrist-length-sleeved tunic and dark taupe loose long skirt, hands, neutral expression, framing, and cel-shaded illustration. Change ONLY the background and opacity: remove all translucent halo, aura, haze and glow. Put this fully OPAQUE woman on a perfectly uniform flat solid vivid magenta RGB(255,0,255) backdrop edge to edge. This is a chroma-key production sprite. Crisp antialiased boundary, no magenta on figure, no background gradient, shadow, floor, vignette, checkerboard or transparency. Face and clothing fully opaque.1024x1536 portrait with same head-through-below-knees composition and generous margins. No new elements, no text.
```

### nurulain-curious

- Master: `art/sources/finale/sprites/nurulain-curious-master.png`.
- Metadata: `art/sources/finale/sprites/nurulain-curious-generation.json`.
- Original source: `C:/Users/seabo/.codex/generated_images/01a0cced-3c90-7e42-99c6-5c877ba3a64a/exec-7c11e378-3562-4cfb-ac87-5002ec716464.png`.
- References: `art/sources/finale/sprites/nurulain-neutral-master.png`.

```text
Use case: identity-preserve. Edit this exact Nurulain neutral identity sprite into one curious variant. Preserve exactly her adult Malay Singaporean face, warm golden-brown skin, dark eyes, age, body proportions, dusty rose full hijab draping over hair neck shoulders and entire chest, baggy opaque beige long tunic with sleeves to wrists, dark taupe loose long skirt, delicate cel-shaded linework and all framing. Change only facial performance and subtle posture: Her brows gently lift, eyes engaged and attentive, lips slightly parted as she asks a question. Small friendly tilt of head, both hands still together. Portrait1024x1536 one isolated centered woman head to below knees, full hands intact, same scale and generous margins. Preserve perfectly flat solid vivid magenta RGB(255,0,255) chroma-key backdrop; woman fully opaque; no magenta spill, backdrop shadow, halo, glow, scenery, checkerboard, text or watermark.
```

### nurulain-amused

- Master: `art/sources/finale/sprites/nurulain-amused-master.png`.
- Metadata: `art/sources/finale/sprites/nurulain-amused-generation.json`.
- Original source: `C:/Users/seabo/.codex/generated_images/01a0cced-3c90-7e42-99c6-5c877ba3a64a/exec-291c8e78-9032-40e6-a047-ef344ad4e182.png`.
- References: `art/sources/finale/rejected/nurulain-amused-halo.png`.

```text
Use case: background-extraction. Change ONLY BACKGROUND of this exact amused Nurulain sprite. Replace entire dark halo backdrop with uniformly flat solid vivid pure magenta RGB255,0,255. Remove ALL transparency and halo/glow. The woman must be FULLY OPAQUE including face clothing hands. Keep exact bright smile showing upper teeth, rounded face, dusty-rose full hijab, baggy beige tunic, taupe skirt, hands, size, framing and every character detail. 1024x1536. No scenery shadow gradient checkerboard text or watermark. Single opaque woman on pure flat magenta, ready for chroma key.
```

### nurulain-guarded

- Master: `art/sources/finale/sprites/nurulain-guarded-master.png`.
- Metadata: `art/sources/finale/sprites/nurulain-guarded-generation.json`.
- Original source: `C:/Users/seabo/.codex/generated_images/01a0cced-3c90-7e42-99c6-5c877ba3a64a/exec-a60cfcdb-ef25-4906-a575-569cd9f5fe0d.png`.
- References: `art/sources/finale/sprites/nurulain-neutral-master.png`.

```text
Use case: identity-preserve. Edit this exact Nurulain neutral identity sprite into one guarded variant. Preserve exactly her adult Malay Singaporean face, warm golden-brown skin, dark eyes, age, body proportions, dusty rose full hijab draping over hair neck shoulders and entire chest, baggy opaque beige long tunic with sleeves to wrists, dark taupe loose long skirt, delicate cel-shaded linework and all framing. Change only facial performance and subtle posture: Her mouth settles into a restrained closed line, eyes thoughtful and cautious, shoulders slightly held. Quiet reserve, no hostility, no tears. Hands stay together. Portrait1024x1536 one isolated centered woman head to below knees, full hands intact, same scale and generous margins. Preserve perfectly flat solid vivid magenta RGB(255,0,255) chroma-key backdrop; woman fully opaque; no magenta spill, backdrop shadow, halo, glow, scenery, checkerboard, text or watermark.
```

### nurulain-anxious

- Master: `art/sources/finale/sprites/nurulain-anxious-master.png`.
- Metadata: `art/sources/finale/sprites/nurulain-anxious-generation.json`.
- Original source: `C:/Users/seabo/.codex/generated_images/01a0cced-3c90-7e42-99c6-5c877ba3a64a/exec-7e669faa-878f-4973-9e4e-2d044ef31a9d.png`.
- References: `art/sources/finale/sprites/nurulain-neutral-master.png`.

```text
Use case: identity-preserve. Use supplied nurulain-neutral sprite as exact identity and outfit anchor. Create nurulain-anxious. Change ONLY face subtly: uncertain gently drawn brows, worried parted lips, gaze slightly lowered, shoulders held; anxious about being rushed into a relationship, not fearful of physical danger. Retain exact warm medium golden-brown skin, soft rounded oval face, adult Malay Singaporean identity, dusty-rose full chest-covering hijab, opaque loose beige long tunic to wrists and taupe long skirt, hands together, same scale/framing1024x1536 head through below knees. Same delicate cel-shaded illustration. IMPORTANT BACKGROUND: perfectly uniform flat vivid pure magenta RGB255,0,255, fully opaque character with crisp edges. No transparency, gradients, glow, shadow, halo, scenery, checkerboard or text. Do not copy any translucent effects. Single isolated character only.
```

### nurulain-warm

- Master: `art/sources/finale/sprites/nurulain-warm-master.png`.
- Metadata: `art/sources/finale/sprites/nurulain-warm-generation.json`.
- Original source: `C:/Users/seabo/.codex/generated_images/01a0cced-3c90-7e42-99c6-5c877ba3a64a/exec-a76b4c32-2b26-44b0-9dd2-a0036bc07578.png`.
- References: `art/sources/finale/sprites/nurulain-neutral-master.png`.

```text
Use case: identity-preserve. Create one nurulain-warm expression variant by editing supplied exact neutral Nurulain sprite. Keep EXACT same face identity, warm medium golden brown skin, dark eyes, proportions and illustrated style. Change only expression: her signature bright affectionate smile showing a small amount of upper teeth, soft attentive eyes, relaxed shoulders, warm sincerity. Both hands together naturally. Keep dusty-rose full hijab over hair neck shoulders chest, loose opaque beige wrist-length-sleeved long tunic and dark taupe long skirt, no body-hugging cuts.1024x1536 portrait head through below knees, same scale/margins. BACKGROUND IS SOLID PURE MAGENTA RGB255,0,255 edge to edge. Fully opaque figure. Absolutely no transparency, halo, glow, shadow, gradient, checkerboard, scenery, text or watermark.
```

### nurulain-moved

- Master: `art/sources/finale/sprites/nurulain-moved-master.png`.
- Metadata: `art/sources/finale/sprites/nurulain-moved-generation.json`.
- Original source: `C:/Users/seabo/.codex/generated_images/01a0cced-3c90-7e42-99c6-5c877ba3a64a/exec-6d948a66-7a82-4f6a-b8a2-bdaf35b5078f.png`.
- References: `art/sources/finale/sprites/nurulain-neutral-master.png`.

```text
Use case: identity-preserve. Edit supplied neutral Nurulain sprite to create ONE nurulain-moved expression. Preserve exact adult Malay Singaporean woman identity, warm golden-brown skin, soft rounded oval face, dark eyes, same full dusty-rose hijab covering all hair neck shoulders chest, loose opaque beige tunic sleeves to wrists and taupe long skirt, proportions and head-through-below-knees1024x1536 composition. Expression: deeply touched by a sincere love confession, eyes gently shining, brows softly raised inward, small tender closed smile, shoulders relaxed, no tears rolling down or dramatic distress. Hands remain naturally together and visible. Delicate cel-shaded VN illustration unchanged. Uniform flat pure solid vivid magenta RGB255,0,255 background, fully opaque subject, clean edges. NO transparency, glow, halo, gradient, shadows, scenery, checkerboard, text or watermarks.
```
