# Adulthood sprite prompts and provenance

Generated for Return to Me: Before Nurul using the built-in OpenAI image generator, 10–11 September 2026. Exact image model unspecified. All rights reserved.

There are 26 separately generated sprites. Normalized character briefs below describe the first five selected anchors. Exact subsequent Aleem variant requests are retained in [the job manifest](adulthood-aleem-jobs.json) and alongside generated source records; exact supporting-character variant requests are in [the supporting sprite record](adulthood-support-sprites.md).

The first Aleem/Jia Wen alpha requests produced RGB painted checkerboards. Those images are retained under `art/sources/adulthood/rejected` for provenance and identity reference only. The selected sprites use a flat magenta field; the adulthood processor creates real transparent PNG masters and lossless WebP deployment assets using the established tolerant matting. Raw generator files are preserved. No magenta or checkerboard image is deployed.

All selected anchors and variants follow the existing soft semi-realistic cel-shaded rendering, with naturally adult proportions, complete hair/arms, readable expressions, no generated text or logos. Working/travelling outfits preserve Aleem's face. His restrained jealous variant naturally places one hand in a pocket. The shared baseline keeps Jia Wen visibly shorter than Aleem.

## aleem-uni-neutral

- Workspace generation master: `art/sources/adulthood/sprites/aleem-uni-neutral-master.png`.
- Identity/style reference: `art/proofs/jc-expansion/aleem-jc-proof-v3-magenta.png`.
- Normalized brief: Early-twenties adult Aleem, preserving his established warm brown complexion, short dark hair, rectangular glasses and tall lean build. Forest-green open overshirt, cream T-shirt and navy trousers. Neutral attentive expression. One centered head-to-mid-thigh portrait, 1024×1536, flat vivid magenta key background with no shadow, floor, pattern or extra person.

## aleem-work-neutral

- Workspace generation master: `art/sources/adulthood/sprites/aleem-work-neutral-master.png`.
- Identity/style reference: `art/sources/adulthood/sprites/aleem-uni-neutral-master.png`.
- Normalized brief: The same Aleem a few years older, wearing a muted sage-green collared button-down shirt rolled to the forearms and charcoal trousers. Neutral attentive expression. One centered head-to-mid-thigh portrait, 1024×1536, flat vivid magenta key background with no shadow, floor, pattern or extra person.

## jia-wen-neutral

- Workspace generation master: `art/sources/adulthood/sprites/jia-wen-neutral-master.png`.
- Identity/style reference: `art/sources/adulthood/rejected/jia-wen-neutral-checkerboard.png`.
- Normalized brief: Distinct petite adult Chinese Singaporean university student; chin-length black bob, dark eyes, no glasses, coral open short-sleeve overshirt, cream T-shirt and navy jeans. Neutral friendly expression. One centered head-to-mid-thigh portrait, 1024×1536, flat vivid magenta key background with no shadow, floor, pattern or extra person.

## claire-neutral

- Workspace generation master: `art/sources/adulthood/sprites/claire-neutral-master.png`.
- Identity/style reference: `art/sources/adulthood/rejected/jia-wen-neutral-checkerboard.png`.
- Normalized brief: Distinct adult Chinese Singaporean colleague, average stature, long dark brown hair in a low ponytail, no glasses, powder-blue collared blouse rolled to the elbows and charcoal trousers. Calm friendly expression. Reference is for style only. One centered head-to-mid-thigh portrait, 1024×1536, flat vivid magenta key background with no shadow, floor, pattern or extra person.

## imran-neutral

- Workspace generation master: `art/sources/adulthood/sprites/imran-neutral-master.png`.
- Identity/style reference: `art/sources/adulthood/rejected/aleem-uni-neutral-checkerboard.png`.
- Normalized brief: Distinct late-twenties male travelling friend, wavy dark hair, neat short beard, no glasses, slightly broader build, navy rolled-sleeve shirt and stone-beige trousers. Friendly neutral expression. Reference is for style only. One centered head-to-mid-thigh portrait, 1024×1536, flat vivid magenta key background with no shadow, floor, pattern or extra person.

## aleem-travel-tired

- Workspace generation master: `art/sources/adulthood/sprites/aleem-travel-tired-master.png`.
- Identity/outfit reference: `art/sources/adulthood/sprites/aleem-uni-neutral-master.png`.
- Exact variant prompt:

```text
Use case: identity-preserve. Edit the ONE referenced visual-novel character sprite. Preserve exact Aleem face identity, warm brown Boyanese Malay skin, short black hair, rectangular glasses, tall lean natural adult proportions, soft semi-realistic cel shading and crisp restrained outlines. Portrait 1024x1536 head to mid-thigh; both hands and all hair fully visible, no props. Keep generous blank margins. ONE character only. Background is entirely flat vivid magenta #FF00FF for alpha matting, no checkerboard, gradients, shadows, floor, text or logos. Naturally age Aleem into late twenties, same recognizable face and lean build. Change outfit to plain light stone-beige overshirt worn open over muted teal T-shirt, dark navy trousers. Tired, quietly emotionally exhausted expression with gentle undereye shading and lowered shoulders, not crying. Both hands relaxed at sides. Preserve realistic adult facial proportions.
```

## aleem-uni-smile

- Workspace generation master: `art/sources/adulthood/sprites/aleem-uni-smile-master.png`.
- Identity/outfit reference: `art/sources/adulthood/sprites/aleem-uni-neutral-master.png`.
- Exact variant prompt:

```text
Use case: identity-preserve. Edit the ONE referenced visual-novel character sprite. Preserve exact Aleem face identity, warm brown Boyanese Malay skin, short black hair, rectangular glasses, tall lean natural adult proportions, soft semi-realistic cel shading and crisp restrained outlines. Portrait 1024x1536 head to mid-thigh; both hands and all hair fully visible, no props. Keep generous blank margins. ONE character only. Background is entirely flat vivid magenta #FF00FF for alpha matting, no checkerboard, gradients, shadows, floor, text or logos. Keep identical dark forest-green overshirt over cream tee and navy trousers. Change only expression and modest pose to: Warm genuine open smile, brightened eyes, relaxed shoulders.
```

## aleem-uni-amused

- Workspace generation master: `art/sources/adulthood/sprites/aleem-uni-amused-master.png`.
- Identity/outfit reference: `art/sources/adulthood/sprites/aleem-uni-neutral-master.png`.
- Exact variant prompt:

```text
Use case: identity-preserve. Edit the ONE referenced visual-novel character sprite. Preserve exact Aleem face identity, warm brown Boyanese Malay skin, short black hair, rectangular glasses, tall lean natural adult proportions, soft semi-realistic cel shading and crisp restrained outlines. Portrait 1024x1536 head to mid-thigh; both hands and all hair fully visible, no props. Keep generous blank margins. ONE character only. Background is entirely flat vivid magenta #FF00FF for alpha matting, no checkerboard, gradients, shadows, floor, text or logos. Keep identical dark forest-green overshirt over cream tee and navy trousers. Change only expression and modest pose to: Playful amused half-smile with one eyebrow slightly raised, as if teasing a close friend.
```

## aleem-uni-nervous

- Workspace generation master: `art/sources/adulthood/sprites/aleem-uni-nervous-master.png`.
- Identity/outfit reference: `art/sources/adulthood/sprites/aleem-uni-neutral-master.png`.
- Exact variant prompt:

```text
Use case: identity-preserve. Edit the ONE referenced visual-novel character sprite. Preserve exact Aleem face identity, warm brown Boyanese Malay skin, short black hair, rectangular glasses, tall lean natural adult proportions, soft semi-realistic cel shading and crisp restrained outlines. Portrait 1024x1536 head to mid-thigh; both hands and all hair fully visible, no props. Keep generous blank margins. ONE character only. Background is entirely flat vivid magenta #FF00FF for alpha matting, no checkerboard, gradients, shadows, floor, text or logos. Keep identical dark forest-green overshirt over cream tee and navy trousers. Change only expression and modest pose to: Nervous hesitant expression, slightly drawn brows, mouth about to speak but uncertain; hands loosely together in front, all fingers natural and readable.
```

## aleem-uni-jealous

- Workspace generation master: `art/sources/adulthood/sprites/aleem-uni-jealous-master.png`.
- Identity/outfit reference: `art/sources/adulthood/sprites/aleem-uni-neutral-master.png`.
- Exact variant prompt:

```text
Use case: identity-preserve. Edit the ONE referenced visual-novel character sprite. Preserve exact Aleem face identity, warm brown Boyanese Malay skin, short black hair, rectangular glasses, tall lean natural adult proportions, soft semi-realistic cel shading and crisp restrained outlines. Portrait 1024x1536 head to mid-thigh; both hands and all hair fully visible, no props. Keep generous blank margins. ONE character only. Background is entirely flat vivid magenta #FF00FF for alpha matting, no checkerboard, gradients, shadows, floor, text or logos. Keep identical dark forest-green overshirt over cream tee and navy trousers. Change only expression and modest pose to: Restrained jealous expression: tightened jaw, closed lips, brows subtly drawn and gaze uneasy; no aggression, fists or threatening pose.
```

## aleem-uni-hurt

- Workspace generation master: `art/sources/adulthood/sprites/aleem-uni-hurt-master.png`.
- Identity/outfit reference: `art/sources/adulthood/sprites/aleem-uni-neutral-master.png`.
- Exact variant prompt:

```text
Use case: identity-preserve. Edit the ONE referenced visual-novel character sprite. Preserve exact Aleem face identity, warm brown Boyanese Malay skin, short black hair, rectangular glasses, tall lean natural adult proportions, soft semi-realistic cel shading and crisp restrained outlines. Portrait 1024x1536 head to mid-thigh; both hands and all hair fully visible, no props. Keep generous blank margins. ONE character only. Background is entirely flat vivid magenta #FF00FF for alpha matting, no checkerboard, gradients, shadows, floor, text or logos. Keep identical dark forest-green overshirt over cream tee and navy trousers. Change only expression and modest pose to: Quietly hurt expression, eyes downcast and shoulders lowered, stunned disappointment; no crying theatrics.
```

## aleem-work-smile

- Workspace generation master: `art/sources/adulthood/sprites/aleem-work-smile-master.png`.
- Identity/outfit reference: `art/sources/adulthood/sprites/aleem-work-neutral-master.png`.
- Exact variant prompt:

```text
Use case: identity-preserve. Edit the ONE referenced visual-novel character sprite. Preserve exact Aleem face identity, warm brown Boyanese Malay skin, short black hair, rectangular glasses, tall lean natural adult proportions, soft semi-realistic cel shading and crisp restrained outlines. Portrait 1024x1536 head to mid-thigh; both hands and all hair fully visible, no props. Keep generous blank margins. ONE character only. Background is entirely flat vivid magenta #FF00FF for alpha matting, no checkerboard, gradients, shadows, floor, text or logos. Keep identical muted sage-green collared button-down shirt rolled to forearms and charcoal trousers. Change only expression and modest pose to: Warm relaxed genuine smile, open friendly eyes, shoulders at ease.
```

## aleem-work-nervous

- Workspace generation master: `art/sources/adulthood/sprites/aleem-work-nervous-master.png`.
- Identity/outfit reference: `art/sources/adulthood/sprites/aleem-work-neutral-master.png`.
- Exact variant prompt:

```text
Use case: identity-preserve. Edit the ONE referenced visual-novel character sprite. Preserve exact Aleem face identity, warm brown Boyanese Malay skin, short black hair, rectangular glasses, tall lean natural adult proportions, soft semi-realistic cel shading and crisp restrained outlines. Portrait 1024x1536 head to mid-thigh; both hands and all hair fully visible, no props. Keep generous blank margins. ONE character only. Background is entirely flat vivid magenta #FF00FF for alpha matting, no checkerboard, gradients, shadows, floor, text or logos. Keep identical muted sage-green collared button-down shirt rolled to forearms and charcoal trousers. Change only expression and modest pose to: Hesitant serious expression while confessing feelings, slightly parted lips and anxious brows; both hands loosely together in front.
```

## aleem-work-hurt

- Workspace generation master: `art/sources/adulthood/sprites/aleem-work-hurt-master.png`.
- Identity/outfit reference: `art/sources/adulthood/sprites/aleem-work-neutral-master.png`.
- Exact variant prompt:

```text
Use case: identity-preserve. Edit the ONE referenced visual-novel character sprite. Preserve exact Aleem face identity, warm brown Boyanese Malay skin, short black hair, rectangular glasses, tall lean natural adult proportions, soft semi-realistic cel shading and crisp restrained outlines. Portrait 1024x1536 head to mid-thigh; both hands and all hair fully visible, no props. Keep generous blank margins. ONE character only. Background is entirely flat vivid magenta #FF00FF for alpha matting, no checkerboard, gradients, shadows, floor, text or logos. Keep identical muted sage-green collared button-down shirt rolled to forearms and charcoal trousers. Change only expression and modest pose to: Quiet restrained heartbreak: downcast gaze, lips pressed gently together, shoulders lowered; no exaggerated crying.
```

## aleem-work-drained

- Workspace generation master: `art/sources/adulthood/sprites/aleem-work-drained-master.png`.
- Identity/outfit reference: `art/sources/adulthood/sprites/aleem-work-neutral-master.png`.
- Exact variant prompt:

```text
Use case: identity-preserve. Edit the ONE referenced visual-novel character sprite. Preserve exact Aleem face identity, warm brown Boyanese Malay skin, short black hair, rectangular glasses, tall lean natural adult proportions, soft semi-realistic cel shading and crisp restrained outlines. Portrait 1024x1536 head to mid-thigh; both hands and all hair fully visible, no props. Keep generous blank margins. ONE character only. Background is entirely flat vivid magenta #FF00FF for alpha matting, no checkerboard, gradients, shadows, floor, text or logos. Keep identical muted sage-green collared button-down shirt rolled to forearms and charcoal trousers. Change only expression and modest pose to: Emotionally exhausted expression, subtly tired eyes and defeated lowered shoulders, no tears or dramatic gesture.
```

## aleem-travel-tentative

- Workspace generation master: `art/sources/adulthood/sprites/aleem-travel-tentative-master.png`.
- Identity/outfit reference: `art/sources/adulthood/sprites/aleem-travel-tired-master.png`.
- Exact variant prompt:

```text
Use case: identity-preserve. Edit the ONE referenced visual-novel character sprite. Preserve exact Aleem face identity, warm brown Boyanese Malay skin, short black hair, rectangular glasses, tall lean natural adult proportions, soft semi-realistic cel shading and crisp restrained outlines. Portrait 1024x1536 head to mid-thigh; both hands and all hair fully visible, no props. Keep generous blank margins. ONE character only. Background is entirely flat vivid magenta #FF00FF for alpha matting, no checkerboard, gradients, shadows, floor, text or logos. Keep identical late-twenties face, plain light stone-beige open overshirt, muted teal T-shirt and dark navy trousers. Change only expression and modest pose to: Tentative returning hope, faint uncertain half-smile, thoughtful gaze, shoulders beginning to straighten; hands relaxed.
```

## aleem-travel-hopeful

- Workspace generation master: `art/sources/adulthood/sprites/aleem-travel-hopeful-master.png`.
- Identity/outfit reference: `art/sources/adulthood/sprites/aleem-travel-tired-master.png`.
- Exact variant prompt:

```text
Use case: identity-preserve. Edit the ONE referenced visual-novel character sprite. Preserve exact Aleem face identity, warm brown Boyanese Malay skin, short black hair, rectangular glasses, tall lean natural adult proportions, soft semi-realistic cel shading and crisp restrained outlines. Portrait 1024x1536 head to mid-thigh; both hands and all hair fully visible, no props. Keep generous blank margins. ONE character only. Background is entirely flat vivid magenta #FF00FF for alpha matting, no checkerboard, gradients, shadows, floor, text or logos. Keep identical late-twenties face, plain light stone-beige open overshirt, muted teal T-shirt and dark navy trousers. Change only expression and modest pose to: Quiet hopeful relief on arrival, gentle small smile and softened bright eyes, shoulders relaxed; no triumphant or ecstatic gesture.
```

## jia-wen-smile

- Workspace generation master: `art/sources/adulthood/sprites/jia-wen-smile-master.png`.
- Identity/outfit reference: `art/sources/adulthood/sprites/jia-wen-neutral-master.png`.
- Exact prompt, original generator path and visual findings: [supporting sprite record](adulthood-support-sprites.md#jia-wen-smile).

## jia-wen-amused

- Workspace generation master: `art/sources/adulthood/sprites/jia-wen-amused-master.png`.
- Identity/outfit reference: `art/sources/adulthood/sprites/jia-wen-neutral-master.png`.
- Exact prompt, original generator path and visual findings: [supporting sprite record](adulthood-support-sprites.md#jia-wen-amused).

## jia-wen-surprised

- Workspace generation master: `art/sources/adulthood/sprites/jia-wen-surprised-master.png`.
- Identity/outfit reference: `art/sources/adulthood/sprites/jia-wen-neutral-master.png`.
- Exact prompt, original generator path and visual findings: [supporting sprite record](adulthood-support-sprites.md#jia-wen-surprised).

## jia-wen-concerned

- Workspace generation master: `art/sources/adulthood/sprites/jia-wen-concerned-master.png`.
- Identity/outfit reference: `art/sources/adulthood/sprites/jia-wen-neutral-master.png`.
- Exact prompt, original generator path and visual findings: [supporting sprite record](adulthood-support-sprites.md#jia-wen-concerned).

## claire-smile

- Workspace generation master: `art/sources/adulthood/sprites/claire-smile-master.png`.
- Identity/outfit reference: `art/sources/adulthood/sprites/claire-neutral-master.png`.
- Exact prompt, original generator path and visual findings: [supporting sprite record](adulthood-support-sprites.md#claire-smile).

## claire-amused

- Workspace generation master: `art/sources/adulthood/sprites/claire-amused-master.png`.
- Identity/outfit reference: `art/sources/adulthood/sprites/claire-neutral-master.png`.
- Exact prompt, original generator path and visual findings: [supporting sprite record](adulthood-support-sprites.md#claire-amused).

## claire-firm

- Workspace generation master: `art/sources/adulthood/sprites/claire-firm-master.png`.
- Identity/outfit reference: `art/sources/adulthood/sprites/claire-neutral-master.png`.
- Exact prompt, original generator path and visual findings: [supporting sprite record](adulthood-support-sprites.md#claire-firm).

## claire-reflective

- Workspace generation master: `art/sources/adulthood/sprites/claire-reflective-master.png`.
- Identity/outfit reference: `art/sources/adulthood/sprites/claire-neutral-master.png`.
- Exact prompt, original generator path and visual findings: [supporting sprite record](adulthood-support-sprites.md#claire-reflective).

## imran-encouraging

- Workspace generation master: `art/sources/adulthood/sprites/imran-encouraging-master.png`.
- Identity/outfit reference: `art/sources/adulthood/sprites/imran-neutral-master.png`.
- Exact prompt, original generator path and visual findings: [supporting sprite record](adulthood-support-sprites.md#imran-encouraging).
