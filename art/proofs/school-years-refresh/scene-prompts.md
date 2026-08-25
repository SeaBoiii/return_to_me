# School Years refresh: environment proof record

Generated on **25 August 2026** with OpenAI's default built-in image
generator. The tool exposed no exact model name or version, so the generator
version is recorded as **unspecified**. These files are approval-gate proofs,
not production assets. They remain outside `public` and are not mapped by the
story or art manifest.

## Shared status

- Approval stage: first identity/environment checkpoint; **awaiting owner
  approval**.
- Native proof output: 1672 x 941 RGB PNG. If approved, the selected scenes
  must be normalized to the production 2048 x 1152 master contract before
  1600 x 900 WebP export.
- Shared direction: empty 16:9 visual-novel environments; soft semi-realistic
  cel shading with restrained painterly texture; generic period-conscious
  Singapore cues; central mobile-safe staging; quiet lower 38% for dialogue;
  no readable text, people, school identity, branding, or watermark.
- No deployed Chapter 1/2 assets, story data, JC assets, or processing scripts
  were changed while producing this checkpoint.

## Proof inventory and QA

| Proof | Generation relationship | SHA-256 | Initial visual QA |
| --- | --- | --- | --- |
| `bg-primary-canteen-proof.png` | Fresh generation using the written art bible and inspected primary-classroom/approved-JC environment style | `67C33A850B577071C1EB7076CFDB2E16752EAFA997FD57A4F15850C94B5A584B` | Pass: convincing warm 2009 canteen, empty, no visible text or identity marks. The foreground furniture is busier than the other scene proofs, so sprite compositing should be checked before production promotion. |
| `bg-bedroom-2009-warm-proof.png` | Lighting edit of `art/sources/bg-bedroom-2009-master.png` | `2F10D20780AA4651D58027D95DB750F4CCE07F7AD9887311A2F89725F3010E28` | Pass: camera, room geometry, furnishing, window, and feature-phone placement remain recognizably matched; warm pre-fade lighting is clearly distinct. The phone face is bright but blank and must remain covered by accessible HTML whenever message content is shown. |
| `bg-language-classroom-late-proof.png` | Lighting edit of `art/sources/bg-language-classroom-master.png` | `2B4E50C643D1D4A4AA04C520556FD93CA5E72A3BF59518AF343B4BE5BBC78EBF` | Pass with brightness note: geometry and props remain matched and the after-class blue-teal shift reads clearly. It is deliberately dim; test sprites and mobile displays and apply only a modest exposure lift during approved production normalization if faces lose readability. |
| `bg-results-hall-v2-proof.png` | Fresh compositional replacement informed by the existing results-day palette and approved expansion quality | `FE5CBF8B6F1BC3C151624E3BE904B260C43C33AD9BAA1D593EBF9D5BD53FED09` | Pass: clearly reads as a large indoor results-collection/assembly hall rather than a corridor or classroom, with an open dialogue-safe foreground. Paper stacks are distant and blank; no people, grades, readable text, crests, or brands were found. Its rendering is slightly more architectural than the warm scenes, so the complete environment contact sheet should confirm cohesion. |

## Canonical prompts

### `bg-primary-canteen-proof.png`

```text
Use case: stylized-concept
Asset type: approval-gate visual-novel environment proof for Return to Me
Primary request: Create a completely empty generic Singapore primary-school canteen in 2009, suitable for a warm everyday memory between two Primary Six classmates.
Scene/backdrop: A sheltered open-air school canteen with simple period-appropriate long laminate tables and attached round stools, closed generic food-stall fronts with blank panels, tiled floor, ceiling fans, louvred openings, and tropical greenery beyond. Use subtle fictional light-blue school accents. No people.
Style/medium: Soft semi-realistic cel-shaded visual-novel environment art with restrained painterly texture, crisp architectural silhouettes, natural perspective, and the same polished rendering language as a high-quality contemporary visual novel.
Composition/framing: Exact 16:9 landscape scene, intended as a 2048 x 1152 master. Eye-level wide establishing view. Keep useful uncluttered sprite lanes near 28%, 50%, and 72% of frame width, with all important architectural detail inside the central 70% mobile-safe area. Reserve the lower 38% for a dialogue UI: make that area visually quiet and avoid important focal details there.
Lighting/mood: Warm nostalgic late-morning Singapore sunlight, gentle golden reflections, welcoming and ordinary rather than idealized.
Color palette: Nostalgic warm gold, cream, muted wood and metal, with restrained light-blue accents and tropical green outside.
Constraints: Empty environment only; age-appropriate school setting; generic fictional architecture; period-conscious for 2009; no real or implied school prestige; no readable generated text; no menu words or numbers; no people; no uniforms; no crests, badges, flags, logos, trademarks, brand colors, advertisements, watermarks, QR codes, screens, or modern smartphones. Do not include narrative text. Avoid fisheye distortion, cluttered lower framing, photorealism, anime chibi styling, or overly saturated colors.
```

### `bg-bedroom-2009-warm-proof.png`

```text
Use case: lighting-weather
Asset type: approval-gate visual-novel environment proof for Return to Me
Input images: Image 1 is the exact edit target and geometry reference, the existing 2009 Aleem bedroom master.
Primary request: Create a warm pre-fade lighting variant of Image 1 for an earlier, hopeful SMS-memory beat. Change only the lighting, atmosphere, and color treatment.
Scene/backdrop: The identical modest 2009 Singapore bedroom shown in Image 1, empty of people.
Style/medium: Preserve Image 1's soft semi-realistic cel-shaded visual-novel rendering, restrained painterly texture, line weight, materials, and level of detail.
Composition/framing invariants: Preserve exactly the 16:9 camera position, crop, perspective, room geometry, doorway position, desk, chair, shelf, books, bed, window, louvres, fan, feature phone placement, wall items, bags, and every object silhouette from Image 1. Preserve the established central sprite lanes and lower-38-percent dialogue-safe composition. Do not add, remove, move, redesign, or resize objects.
Lighting/mood: Replace the predominantly cold breakup-night treatment with warm, gentle early-evening amber-gold light. Let warm room and corridor light mingle naturally with a faint soft dusk blue at the window. The small physical-keypad feature phone may have a subtle neutral glow, but it must not dominate the room. Mood is modest, safe, expectant, and nostalgic-not romanticized or ominous.
Color palette: Warm amber, honey gold, soft cream, muted wood, restrained dusk blue, and subtle light-blue accents.
Constraints: Change only lighting, shadows, atmosphere, and color grade; keep all geometry and composition unchanged. Empty environment only. Period-conscious for 2009. No readable phone screen; no readable generated text; no people; no smartphone; no WhatsApp-like UI; no extra electronics; no logos, trademarks, school identifiers, badges, watermarks, QR codes, or narrative text. Do not brighten so much that the room becomes daytime. Avoid orange over-saturation, photorealism, fisheye distortion, or lost shadow detail.
```

### `bg-language-classroom-late-proof.png`

```text
Use case: lighting-weather
Asset type: approval-gate visual-novel environment proof for Return to Me
Input images: Image 1 is the exact edit target and geometry reference, the existing external third-language classroom master.
Primary request: Create a cooler late-afternoon, after-class lighting variant of Image 1. Change only the lighting, atmosphere, and color treatment.
Scene/backdrop: The identical empty generic Singapore mixed-school classroom shown in Image 1, used for an external third-language class during 2011-2013.
Style/medium: Preserve Image 1's soft semi-realistic cel-shaded visual-novel rendering, restrained painterly texture, crisp silhouettes, natural perspective, line weight, materials, and detail.
Composition/framing invariants: Preserve exactly the 16:9 camera position, crop, perspective, ceiling beams, fans, windows and louvres, whiteboard and blank noticeboards, door, shelving, plants, every desk and chair, laptop silhouette, and all object positions from Image 1. Preserve the useful sprite lanes near 28%, 50%, and 72% of frame width, central-70-percent mobile-safe staging, and lower-38-percent dialogue-safe composition. Do not add, remove, move, redesign, or resize objects.
Lighting/mood: Replace the bright warm afternoon sunlight with cooler late-afternoon/after-class light. Exterior daylight should be fading toward soft blue-teal, with long subdued shadows and restrained neutral fluorescent fill inside. The room should feel quieter and slightly emotionally distant, but still safe, ordinary, and realistically usable-not abandoned, threatening, or night-dark.
Color palette: Cool teal, desaturated blue-green, soft grey, muted cream, and very restrained traces of fading gold near the windows.
Constraints: Change only lighting, shadows, atmosphere, and color grade; keep geometry and composition unchanged. Empty environment only. Period-conscious for 2011-2013. No readable generated text on boards, books, notices, or screen; no people; no uniforms; no crests, badges, flags, logos, trademarks, advertisements, watermarks, QR codes, modern devices, or narrative text. Keep the laptop screen dark and unreadable. Avoid heavy rain effects, horror mood, deep night, photorealism, fisheye distortion, cluttered lower framing, or over-saturated cyan.
```

### `bg-results-hall-v2-proof.png`

```text
Use case: stylized-concept
Asset type: approval-gate visual-novel environment proof for Return to Me
Primary request: Create a true generic Singapore secondary-school results-collection hall in 2013, empty of people, for an O-Level results-day scene.
Scene/backdrop: A large indoor school assembly hall with a high practical ceiling, exposed structural beams, rows of fluorescent tube lights and ceiling fans, a distant low stage with plain closed curtains, muted acoustic wall panels, and a polished multi-purpose floor. Suggest results collection through a few orderly long tables and chair groupings placed farther back and along the sides, with blank face-down envelopes or paper stacks that cannot be read. Keep the foreground and central aisle open. The school is entirely fictional and unnamed.
Style/medium: Soft semi-realistic cel-shaded visual-novel environment art with restrained painterly texture, crisp architectural silhouettes, natural perspective, believable materials, and the same polished rendering language as a high-quality contemporary visual novel.
Composition/framing: Exact 16:9 landscape scene, intended as a 2048 x 1152 master. Eye-level wide establishing view from just inside the hall entrance. Maintain useful uncluttered sprite/action lanes near 28%, 50%, and 72% of frame width, keep meaningful details inside the central 70% mobile-safe area, and reserve the lower 38% for dialogue UI by rendering it mostly as quiet, low-detail polished floor with no important props or papers.
Lighting/mood: Flat cool fluorescent light mixed with weak overcast daylight from high louvred windows. Desaturated blue-grey results-day mood: still, private, heavy, and uncertain, but not sinister, abandoned, clinical, or hopeless.
Color palette: Desaturated blue-grey, cool off-white, charcoal, muted navy, pale concrete, with only tiny restrained warm wood accents.
Constraints: Empty environment only-no students, staff, families, silhouettes, or reflections of people. Generic period-conscious 2013 Singapore school cues. No exact grades; no readable generated text; no banners, labels, signs, school names, mottos, crests, badges, flags, logos, trademarks, advertisements, watermarks, QR codes, screens, branded stationery, or narrative text. Papers and envelopes must be blank, turned away, or too distant to read. Do not depict the school as prestigious or inferior. Avoid corridor-dominant composition, ordinary classroom framing, gym branding, celebratory decorations, dramatic spotlights, horror mood, photorealism, fisheye distortion, cluttered foreground, or over-saturated cyan.
```

