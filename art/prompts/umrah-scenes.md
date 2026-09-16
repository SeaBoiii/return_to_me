# Umrah scene prompts and provenance

Generated for **Return to Me: Before Nurul**, displayed Chapters 10–11. Each asset uses a separate OpenAI built-in image generator call; no CLI/API fallback was used. The exact model is not exposed by the tool. The original 14 September four backgrounds were retained when work resumed on 15 September 2026.

## References and layout

The existing `art/sources/adulthood/scenes/bg-holy-land-arrival-master.png` and `bg-uni-orientation-master.png` were visually inspected for the established softly rendered architectural style. Backgrounds are new generations with written style guidance, not edits of those locations. Scene target is 2048×1152 (16:9). All ten selected built-in PNG sources are 1672×941; the independent Umrah batch normalizes them to 2048×1152 masters and exports 1600×900 WebP deployment files. Keep action in the upper portion for dialogue; existing portrait CG letterboxing preserves the whole composition.

Place context was checked against [Saudipedia's Grand Mosque courtyards](https://saudipedia.com/en/courtyards-of-the-grand-mosque), [Jabal al-Nour](https://saudipedia.com/en/jabal-al-nour), [Jabal al-Rahmah](https://saudipedia.com/en/jabal-al-rahmah), [the Prophet's Mosque](https://saudipedia.com/en/the-prophet%22s-mosque), and the [official umbrella overview](https://alharamain.gov.sa/public/?page=umbrellas-en). These are illustrative impressions of the places, not architectural surveys. The Rahmah narrative association is a remembered tradition. No historic religious figures are depicted.

The contemporary `aleem-umrah-neutral-master.png` and `nadiah-umrah-neutral-master.png` sprites and the prior `cg-uss-confession-master.png` were viewed before CG generation. The two sprites supply identity and exact travel clothing; the older CG supplies only rendering style. Each CG also uses its corresponding new background as a location reference. Reference roles are spelled out in every exact request below.

## Exact prompts and saved sources

### bg-umrah-common-area

- Generation: new background, no direct image input; built-in generator, 2026-09-14.
- Selected source: `C:\Users\alsiddiq\.codex\generated_images\01a09df4-3da7-7362-a907-bf86a10fac0d\exec-ffcf1927-6f81-45b4-8759-5cbcb674c545.png`
- Workspace master: `art/sources/umrah/scenes/bg-umrah-common-area-master.png`
- Original PNG: 1672×941, 1,975,209 bytes.
- Visual review: Accepted: open central foreground, ordinary unlocated dining area, no visible labels or people.

```text
Use case: illustration-story. Asset type: one finished visual-novel background master, landscape 16:9, target 2048x1152. Style: soft semi-realistic cel-shaded illustration, restrained fine linework, nuanced natural light, crisp architectural silhouettes, gently painted textures, match the established Return to Me visual novel. Eye-level wide camera. Keep the meaningful architectural or landscape detail in the upper 62% and central 70% width, with an uncluttered low-contrast foreground for character sprites and a translucent dialogue panel across the lower 38%. No generated text, signage, logos, watermarks, speech bubbles, UI, collage or grid. No identifiable real people or historical religious figures. Scene: A modest contemporary accommodation common dining area used by a small Singaporean Umrah tour group. An unlocated, generic interior: pale cream walls, a window admitting warm daylight without a city landmark, practical pale-wood tables and upholstered dining chairs, plain water bottles and unbranded cups with a small serving tray on a side table, a discreet leafy indoor plant. Quiet everyday hospitality and comfortable conversation, no luxury ballroom. Empty room, no people. Keep central standing space open. The location must not specify Makkah or Madinah.
```

### bg-makkah-courtyard

- Generation: new background, no direct image input; built-in generator, 2026-09-14.
- Selected source: `C:\Users\alsiddiq\.codex\generated_images\01a09df4-3da7-7362-a907-bf86a10fac0d\exec-f80d48aa-4eee-46aa-a318-96846dedd1c0.png`
- Workspace master: `art/sources/umrah/scenes/bg-makkah-courtyard-master.png`
- Original PNG: 1672×941, 2,240,428 bytes.
- Visual review: Accepted: exterior marble courtyard, distant anonymous visitors, no Kaaba or Madinah umbrellas, clear foreground; decorative friezes are illustrative ornament, not a text source.

```text
Use case: illustration-story. Asset type: one finished visual-novel background master, landscape 16:9, target 2048x1152. Style: soft semi-realistic cel-shaded illustration, restrained fine linework, nuanced natural light, crisp architectural silhouettes, gently painted textures, match the established Return to Me visual novel. Eye-level wide camera. Keep the meaningful architectural or landscape detail in the upper 62% and central 70% width, with an uncluttered low-contrast foreground for character sprites and a translucent dialogue panel across the lower 38%. No generated text, signage, logos, watermarks, speech bubbles, UI, collage or grid. No identifiable real people or historical religious figures. Scene: An external marble courtyard outside Masjid al-Haram in Makkah during a January Umrah visit. Seen at pedestrian eye level from a quiet edge: broad pale marble paving in the foreground, monumental cream mosque arcades and tall slender paired minarets beyond, warm pale stone and restrained gold details, a few very small anonymous pilgrims walking near the distant arches. Soft morning light, peaceful atmosphere, pale blue sky. The outside courtyard is distinct from the central Kaaba tawaf courtyard: do not show the Kaaba. No giant shading umbrellas, no city clock face, no Hajj masses, no ritual sequence. Architectural impression grounded in the Grand Mosque exterior, not an exact architectural survey.
```

### bg-jabal-nur-ascent

- Generation: new background, no direct image input; built-in generator, 2026-09-14.
- Selected source: `C:\Users\alsiddiq\.codex\generated_images\01a09df4-3da7-7362-a907-bf86a10fac0d\exec-c8ed5350-9b8e-453e-8c49-6c390e682fb0.png`
- Workspace master: `art/sources/umrah/scenes/bg-jabal-nur-ascent-master.png`
- Original PNG: 1672×941, 2,713,327 bytes.
- Visual review: Accepted: rocky steps and open trail foreground, low distant city and tiny anonymous climbers, no cave entry.

```text
Use case: illustration-story. Asset type: one finished visual-novel background master, landscape 16:9, target 2048x1152. Style: soft semi-realistic cel-shaded illustration, restrained fine linework, nuanced natural light, crisp architectural silhouettes, gently painted textures, match the established Return to Me visual novel. Eye-level wide camera. Keep the meaningful architectural or landscape detail in the upper 62% and central 70% width, with an uncluttered low-contrast foreground for character sprites and a translucent dialogue panel across the lower 38%. No generated text, signage, logos, watermarks, speech bubbles, UI, collage or grid. No identifiable real people or historical religious figures. Scene: A mountain path ascending Jabal Nur near Makkah. Rugged sun-warmed brown-grey granite boulders, uneven worn stone steps snaking upward along the rocky slope, a simple low unobtrusive metal handrail along one stretch. Sparse arid terrain, distant hazy rocky hills and only a small hint of the city low in the distance. Soft clear morning daylight, the bodily effort and quiet openness of a remembered climb. No people in the foreground, at most tiny distant climber silhouettes. No cave opening, shrine, religious event, temple, tropical vegetation or summit pillar. Frame a broad safe area of the trail in front for standing characters.
```

### bg-jabal-nur-rest

- Generation: new background, no direct image input; built-in generator, 2026-09-14.
- Selected source: `C:\Users\alsiddiq\.codex\generated_images\01a09df4-3da7-7362-a907-bf86a10fac0d\exec-e40a5477-e445-4163-967c-8bde91318fcf.png`
- Workspace master: `art/sources/umrah/scenes/bg-jabal-nur-rest-master.png`
- Original PNG: 1672×941, 2,623,147 bytes.
- Visual review: Accepted: resting ledge with safe flat foreground, stone stair continuity, Makkah impression distant, no cave or religious event.

```text
Use case: illustration-story. Asset type: one finished visual-novel background master, landscape 16:9, target 2048x1152. Style: soft semi-realistic cel-shaded illustration, restrained fine linework, nuanced natural light, crisp architectural silhouettes, gently painted textures, match the established Return to Me visual novel. Eye-level wide camera. Keep the meaningful architectural or landscape detail in the upper 62% and central 70% width, with an uncluttered low-contrast foreground for character sprites and a translucent dialogue panel across the lower 38%. No generated text, signage, logos, watermarks, speech bubbles, UI, collage or grid. No identifiable real people or historical religious figures. Scene: A modest broad resting place along the rocky Jabal Nur ascent, before any cave visit. Weathered brown-grey granite ledge and flat boulders beside the stone footpath, with a natural low rock edge and Makkah's low and mid-rise buildings far below in atmospheric desert haze. Layers of arid hills under a pale blue sky. Gentle morning light, stillness after climbing, intimate but grounded ordinary place to catch one's breath. No foreground people, no cave, no shrine, no summit pillar, no religious figures. Foreground safe resting ledge open enough for two standing character sprites; city details in the upper middle distance.
```

### bg-jabal-rahmah

- Generation: new background, no direct image input; built-in generator, 2026-09-15.
- Selected source: `C:\Users\alsiddiq\.codex\generated_images\01a09df4-3da7-7362-a907-bf86a10fac0d\exec-b8db89ef-a386-48ff-b083-1414c9c1050b.png`
- Workspace master: `art/sources/umrah/scenes/bg-jabal-rahmah-master.png`
- Original PNG: 1672×941, 2,506,467 bytes.
- Visual review: Accepted: white summit pillar, rocky slope and Arafat plain, sparse distant visitors, quiet foreground; no historical figures or destiny symbolism.

```text
Use case: illustration-story. Asset type: one finished visual-novel background master, landscape 16:9, target 2048x1152. Style: soft semi-realistic cel-shaded illustration, restrained fine linework, nuanced natural light, crisp architectural silhouettes, gently painted textures, match the established Return to Me visual novel. Eye-level wide camera. Keep the meaningful architectural or landscape detail in the upper 62% and central 70% width, with an uncluttered low-contrast foreground for character sprites and a translucent dialogue panel across the lower 38%. No generated text, signage, logos, watermarks, speech bubbles, UI, collage or grid. No identifiable real people or historical religious figures. Scene: Jabal Rahmah, the low rocky hill on the plain of Arafat near Makkah, during a quiet January Umrah excursion. View from partway up a broad slope of rugged dark brown-grey boulders and stone steps, its simple tall WHITE summit pillar visible in the upper centre distance, flat hazy Arafat plain beyond. Soft warm daylight, open pale sky, a few tiny anonymous visitors far away near the summit but no dense Hajj crowds. Leave an empty level section of the slope across the foreground for two characters. Convey a quiet real place where someone might reflect. No supernatural light, destiny symbols, historical or religious figures, Adam and Eve, signs or readable writing on the pillar.
```

### bg-madinah-courtyard

- Generation: new background, no direct image input; built-in generator, 2026-09-15.
- Selected source: `C:\Users\alsiddiq\.codex\generated_images\01a09df4-3da7-7362-a907-bf86a10fac0d\exec-6a6da02d-15cc-4b6b-b256-18fc398a5927.png`
- Workspace master: `art/sources/umrah/scenes/bg-madinah-courtyard-master.png`
- Original PNG: 1672×941, 2,176,433 bytes.
- Visual review: Accepted: Nabawi umbrellas and green dome clearly distinguish Madinah; distant worshippers, clear central foreground and gentle ordinary light.

```text
Use case: illustration-story. Asset type: one finished visual-novel background master, landscape 16:9, target 2048x1152. Style: soft semi-realistic cel-shaded illustration, restrained fine linework, nuanced natural light, crisp architectural silhouettes, gently painted textures, match the established Return to Me visual novel. Eye-level wide camera. Keep the meaningful architectural or landscape detail in the upper 62% and central 70% width, with an uncluttered low-contrast foreground for character sprites and a translucent dialogue panel across the lower 38%. No generated text, signage, logos, watermarks, speech bubbles, UI, collage or grid. No identifiable real people or historical religious figures. Scene: The courtyard of Masjid an-Nabawi in Madinah, viewed at pedestrian eye level beneath the giant open cream retractable shade umbrellas. Distinctive elegant ribbed umbrella canopies and tall cream support columns, pale marble paving, repeated mosque arches and a slender minaret in the distance, a glimpse of the famous green dome far behind on one side. Small anonymous worshippers walk far away between columns; the nearby courtyard remains open for sprites. Gentle late-afternoon daylight filtered through the fabric, quiet spacious atmosphere, restful cream, warm beige and restrained green palette. No readable calligraphy, no Hajj crowd, no Kaaba, no historical religious figures.
```

### bg-nabawi-interior

- Generation: new background, no direct image input; built-in generator, 2026-09-15.
- Selected source: `C:\Users\alsiddiq\.codex\generated_images\01a09df4-3da7-7362-a907-bf86a10fac0d\exec-40f2f5cf-bbdf-4493-bcbe-9f701132b8b9.png`
- Workspace master: `art/sources/umrah/scenes/bg-nabawi-interior-master.png`
- Original PNG: 1672×941, 2,283,933 bytes.
- Visual review: Accepted: quiet personal foreground within an occupied prayer hall, marble columns and arches, no supernatural effects or sacred enclosure claim.

```text
Use case: illustration-story. Asset type: one finished visual-novel background master, landscape 16:9, target 2048x1152. Style: soft semi-realistic cel-shaded illustration, restrained fine linework, nuanced natural light, crisp architectural silhouettes, gently painted textures, match the established Return to Me visual novel. Eye-level wide camera. Keep the meaningful architectural or landscape detail in the upper 62% and central 70% width, with an uncluttered low-contrast foreground for character sprites and a translucent dialogue panel across the lower 38%. No generated text, signage, logos, watermarks, speech bubbles, UI, collage or grid. No identifiable real people or historical religious figures. Scene: A quiet prayer area inside Masjid an-Nabawi in Madinah, a contemporary ordinary interior hall. Rows of tall pale marble columns with ornate gold-toned capitals, repeating cream-and-dark striped arches receding into the distance, restrained ceiling ornament and warm hanging lamps, green prayer carpet with simple repeated row motifs. Soft interior light. A handful of small anonymous seated worshippers far in the background establish an active mosque, while a broad personal patch of carpet in the near foreground is empty and peaceful for the protagonist. This is a private ordinary place to sit and make doa, without claiming a specific sacred enclosure. No tomb, grille, mihrab focal point, readable Arabic/script text, named or historical religious figure, beam of divine light or mystical effects.
```

### cg-umrah-jabal-nur

- Generation: new story scene composed from identity, location and style references; built-in generator, 2026-09-15.
- Selected source: `C:\Users\alsiddiq\.codex\generated_images\01a09df4-3da7-7362-a907-bf86a10fac0d\exec-caf4b3f2-8186-49a2-a525-840ca8642d62.png`
- Workspace master: `art/sources/umrah/scenes/cg-umrah-jabal-nur-master.png`
- Original PNG: 1672×941, 2,580,959 bytes.
- Reference 1: `art/sources/umrah/sprites/aleem-umrah-neutral-master.png`
- Reference 2: `art/sources/umrah/sprites/nadiah-umrah-neutral-master.png`
- Reference 3: `art/sources/umrah/scenes/bg-jabal-nur-rest-master.png`
- Reference 4: `art/sources/adulthood/scenes/cg-uss-confession-master.png`
- Visual review: Accepted: both established identities and travel outfits match; natural seated anatomy, separate personal space and familiar conversation. Faces and eye contact sit high above the dialogue zone; resting hands are lower and are not story-critical.

```text
Use case: compositing / illustration-story. Create one new finished visual-novel story illustration, landscape 16:9, target 2048x1152, based on the attached reference images. Reference 1 is Aleem's adult identity and exact travel outfit: Malay Singaporean man about thirty, warm medium tan skin, short tousled black hair, dark rectangular glasses, cream overshirt with rolled sleeves over a muted blue-teal T-shirt, navy trousers. Reference 2 is contemporary Nadiah's identity and exact clothing: Malay Singaporean woman about thirty, warm tan skin, brown eyes, soft oval face, blue-grey hijab covering hair and neck, muted teal long open outer layer, cream tunic and loose cream trousers. Preserve both character identities, adult proportions and outfits. Reference 3 supplies the Jabal Nur resting-ledged environment. Reference 4 supplies ONLY the established soft semi-realistic cel-shaded story-illustration rendering, not its people, outfits or theme-park setting. Scene: Aleem and Nadiah resting on separate safe broad rocks beside the Jabal Nur ascent near Makkah. It has become just the two of them at this particular stopping point. They face partly toward one another, asking how life has been and sharing a gentle familiar memory. Aleem's shoulders relax, a small sincere half-smile; Nadiah listens with a warm familiar smile. Their body language is comfortable but reserved, not a couple posing. Respectful space remains between them, no touching, no handholding. Sit naturally with hands resting on their own laps or knees; sound anatomy and five fingers when visible. Warm natural daylight, brown-grey granite and the hazy city far below. No other nearby characters, no cave opening, no shrine, no historical religious figures, no supernatural destiny symbols. Composition: medium-wide seated two-person scene, heads around the upper third, both faces and main conversational gestures entirely above 58% image height; central 70% width contains the whole interaction. Leave the lower 35% calm rock foreground, anticipating an opaque dialogue panel. Keep a single integrated scene, no panels, no text or lettering, logos, UI, watermark, magenta background or copied cutout edges.
```

### cg-umrah-jabal-rahmah

- Generation: new story scene composed from identity, location and style references; built-in generator, 2026-09-15.
- Selected source: `C:\Users\alsiddiq\.codex\generated_images\01a09df4-3da7-7362-a907-bf86a10fac0d\exec-3b3715f3-5fb8-41c2-8c62-d8748844b498.png`
- Workspace master: `art/sources/umrah/scenes/cg-umrah-jabal-rahmah-master.png`
- Original PNG: 1672×941, 2,376,265 bytes.
- Reference 1: `art/sources/umrah/sprites/aleem-umrah-neutral-master.png`
- Reference 2: `art/sources/umrah/sprites/nadiah-umrah-neutral-master.png`
- Reference 3: `art/sources/umrah/scenes/bg-jabal-rahmah-master.png`
- Reference 4: `art/sources/adulthood/scenes/cg-uss-confession-master.png`
- Visual review: Accepted: familiar, reserved eye contact and respectful distance; both identities and outfits match anchors. Pillar and Arafat plain remain clear. Aleem's left hand rests naturally in his trouser pocket. Faces sit safely in upper third.

```text
Use case: compositing / illustration-story. Create one new finished visual-novel story illustration, landscape 16:9, target 2048x1152, using the attached reference images. Reference 1 is Aleem's adult identity and exact travel outfit: Malay Singaporean man about thirty, medium tan skin, short black hair, dark rectangular glasses, cream rolled-sleeve overshirt over muted blue-teal T-shirt and navy trousers. Reference 2 is contemporary Nadiah's identity and exact modest clothing: Malay Singaporean woman about thirty, warm tan skin, brown eyes, soft oval face, blue-grey hijab, teal long open outer layer, cream tunic and loose cream trousers. Preserve their faces, adult proportions, and outfits. Reference 3 supplies Jabal Rahmah's rocky slope, the white summit pillar and Arafat plain. Reference 4 supplies ONLY the established soft semi-realistic cel-shaded story art style, not its characters, theme park or clothing. Scene: Aleem and Nadiah have unexpectedly found themselves together again on a safe broad rocky section partway up Jabal Rahmah, during a January Umrah excursion. They stand at a respectful ordinary conversational distance, turned slightly toward each other. Aleem has a softened, quietly hopeful look of recognition. Nadiah answers with familiar warmth, a subtle thoughtful pause in her eyes, without visual proof or depiction of another man. A sense of peaceful reconnection grounded entirely in their expressions. No touching, no handholding, no engagement or romantic embrace. Their own hands relaxed naturally in front or at their sides, anatomically sound. Behind them: white summit pillar farther uphill and the hazy flat Arafat landscape, a few tiny anonymous visitors far away, no masses. Warm natural light, no halo or magical beam, no Adam and Eve or other historical religious figures, no fate symbols. Composition: eye-level medium-wide two-person portrait in the environment; both heads around the upper third, faces and the space between them wholly above 58% height, central 70% width contains their interaction; lower 35% is quieter rock and unobtrusive clothing for the dialogue overlay. One integrated landscape scene, no grid, no text, readable script, logos, UI, watermark, magenta backdrop or pasted sprite silhouettes.
```

### cg-nabawi-release

- Generation: new story scene composed from identity, location and style references; built-in generator, 2026-09-15.
- Selected source: `C:\Users\alsiddiq\.codex\generated_images\01a09df4-3da7-7362-a907-bf86a10fac0d\exec-165de8b4-dc5b-4918-b835-818225ec66c8.png`
- Workspace master: `art/sources/umrah/scenes/cg-nabawi-release-master.png`
- Original PNG: 1672×941, 2,104,979 bytes.
- Reference 1: `art/sources/umrah/sprites/aleem-umrah-neutral-master.png`
- Reference 2: `art/sources/umrah/scenes/bg-nabawi-interior-master.png`
- Reference 3: `art/sources/adulthood/scenes/cg-uss-confession-master.png`
- Visual review: Accepted: relaxed breath and shoulders read clearly, established face and outfit preserved, shoes removed and seated anatomy natural. Aleem has a private patch within an occupied hall, with no supernatural effects. Face and breathing expression remain high above dialogue; passive hands are lower.

```text
Use case: compositing / illustration-story. Create one finished visual-novel story illustration, landscape 16:9, target 2048x1152, using these references. Reference 1 defines Aleem's adult identity and exact travel clothes: Malay Singaporean man about thirty, warm medium tan skin, short tousled black hair, dark rectangular glasses, cream overshirt with rolled sleeves over muted blue-teal T-shirt, navy trousers. Keep this face and outfit. Reference 2 defines the contemporary Masjid an-Nabawi interior: quiet green prayer carpet, pale marble columns with gold-toned capitals, repeating striped arches and warm lamps. Reference 3 supplies ONLY the project's soft semi-realistic cel-shaded story-illustration style, not its people, clothing or theme-park location. Scene: Aleem sits alone in a personal patch of carpet in Masjid an-Nabawi in Madinah just after a small private doa about his love life. Show a modest, intimate physical release: eyes softly closed behind his glasses, mouth gently parted as he lets a relieved breath go, shoulders visibly eased. His two hands rest loosely on his thighs after praying, with relaxed natural fingers. He is seated cross-legged, without shoes, seen in gentle three-quarter side view, his face visible to the viewer. The moment is peace, relief and ordinary human vulnerability; do not make him ecstatic or visibly 'cured'. A few small anonymous worshippers are seated far away behind the repeating columns so the whole mosque is not empty. No other character interacts with him. No literal air cloud, spirit leaving the body, particles, halos, supernatural light, magical healing, religious historical figure, prophetic depiction, tomb or sacred enclosure. Composition: Aleem in the central portion of the scene, head and shoulders comfortably above the middle, face and resting hands all above 60% height; calm green carpet across the lower 35% for the dialogue panel. Natural soft interior light, calm gold, cream and muted green. No writing or readable Arabic, speech bubble, caption, UI, watermark, logos, magenta backdrop, collage or grid.
```

## Completion and validation handoff

All seven backgrounds and three illustrations are saved in the workspace and were visually inspected. The ten source files preserve the original generated PNG data. The retained generation records and complete planned prompt set are in `art/sources/umrah/scenes/generation-records.json` and `planned-jobs.json`.

On 14 September the first Jabal Rahmah request returned a usage-limit error and produced no asset. The identical prompt succeeded on 15 September. No accepted preceding asset was regenerated. A later session interruption occurred after the Rahmah CG succeeded; its original result was recovered and copied without requesting a replacement.

All important faces, eye contact, and Aleem's relief expression sit in the upper area; relaxed hands in the seated CGs are lower and carry no essential story action. The existing portrait CG treatment displays the whole illustration above the dialogue panel. The processing batch and browser review remain the integration checks for exact exported dimensions, per-file precache size, scene legibility, and offline availability; this source document does not substitute for those checks.

