# Chapter 1 sprite production candidates

Generated on 25 August 2026 with OpenAI's built-in image-generation tool. The
tool did not expose an exact model name or version, so the generator is recorded
as **unspecified**. These are second-gate candidates only. They are not matted,
normalized, deployed, or referenced by the story.

## Final candidate status

The final set contains **19 candidates**: 16 selected identity-preserving edits
and three byte-for-byte approved-anchor reuses.

| Family | Approved anchor | Final candidates | Source status |
| --- | --- | --- | --- |
| Primary 6 Aleem | `art/proofs/school-years-refresh/aleem-p6-anchor.png` | `characters/aleem-p6/{neutral,smile,cheerful,surprised,nervous,reflective}.png` | `neutral` is the exact anchor; five generated edits |
| Alya, school uniform | `art/proofs/school-years-refresh/alya-p6-anchor.png` | `characters/alya/{neutral,smile,playful,shy,hopeful}.png` | `neutral` is the exact anchor; four generated edits |
| Young Aleem, home clothes | `art/proofs/school-years-refresh/aleem-young-home-anchor.png` | `characters/aleem-young-home/{neutral,smile,waiting,startled,hurt}.png` | `neutral` is the exact anchor; four generated edits |
| Young Alya, home clothes | `art/proofs/school-years-refresh/alya-young-home-anchor.png` | `characters/alya-young-home/{startled,apologetic,sad}.png` | three generated edits |

All relative candidate paths above are rooted at
`art/candidates/school-years-refresh/`.

## Canonical edit prompt

Each non-neutral candidate used exactly one approved family anchor as the sole
image reference. The common prompt contract was:

```text
Use case: identity-preserve
Asset type: Chapter 1 visual-novel expression sprite candidate
Input image: Image 1 is the sole authoritative identity, outfit, rendering,
scale, framing, and chroma-background anchor.
Primary request: Edit the exact same character into the named expression and a
small, natural face/hand/upper-body pose that remains clear at mobile size.
Style/medium: preserve the anchor's soft semi-realistic cel-shaded visual-novel
rendering, crisp silhouette, restrained outlines, palette, and polish.
Scene/backdrop: edge-to-edge vivid magenta chroma field; no checkerboard,
environment, floor, texture, cast shadow, glow, or extra element.
Invariants: preserve exact identity, age, face, skin tone, hair, body build,
outfit, proportions, glasses where present, and family-specific framing. Keep
the full head and hair plus both complete arms, hands, and fingers in canvas.
For Alya, keep both complete forward braids and braid ends. Keep all treatment
wholesome and age-appropriate.
Constraints: one character only; no props or phone; no text, badge, crest,
logo, trademark, signature, watermark, jewellery, makeup, extra person,
mature romance, outfit change, identity drift, cropped anatomy, or fake
transparency pattern.
```

## Expression deltas

| Candidate | Requested face and posture delta |
| --- | --- |
| `aleem-p6/smile` | Warm closed-mouth smile, brighter eyes and cheeks, relaxed open posture |
| `aleem-p6/cheerful` | Broad joyful grin, crescenting eyes, lifted shoulders, hands lightly clasped |
| `aleem-p6/surprised` | Wide eyes, raised brows, small open mouth, one hand lifted near the chest |
| `aleem-p6/nervous` | Side glance, pinched brows, uncertain mouth, hunched shoulders, fidgeting hands |
| `aleem-p6/reflective` | Soft downcast side glance, tipped head, one hand resting over the upper torso |
| `alya/smile` | Brighter eyes and clear warm smile, hands gently together |
| `alya/playful` | Raised eyebrow and lively grin, one hand at hip and one friendly presenting gesture |
| `alya/shy` | Side glance, bashful small smile, lowered head, modestly clasped hands |
| `alya/hopeful` | Soft upward gaze, sincere small smile, open shoulders, hands together at waist |
| `aleem-young-home/smile` | Unmistakable happy open-mouth grin, brighter eyes, hands loosely clasped |
| `aleem-young-home/waiting` | Hopeful but uneasy side gaze, restrained mouth, one hand holding the opposite wrist |
| `aleem-young-home/startled` | Wide eyes and open mouth, slight recoil, one hand raised near the collar |
| `aleem-young-home/hurt` | Downcast glassy eyes, uneven pressed lips, folded shoulders, one hand holding a forearm |
| `alya-young-home/startled` | Sudden-realization expression, open mouth, lifted shoulders, one hand raised |
| `alya-young-home/apologetic` | Remorseful downcast eyes, bowed head, inward shoulders, hands modestly clasped |
| `alya-young-home/sad` | Quiet downcast sadness, slight frown, lowered head, relaxed hands at sides |

## Selection and QA record

- Every selected PNG was physically reviewed at native resolution. The four
  families retain their approved faces, builds, outfits, hair silhouettes, skin
  tones, and age treatment. Aleem's glasses and Alya's two complete braids remain
  consistent across their respective families.
- Heads, hair, arms, hands, and required braid ends remain inside the frame. The
  visible fingers and gestures are plausible at production scale. No candidate
  contains a prop, phone, extra person, text, school identifier, logo,
  trademark, signature, or watermark.
- `aleem-young-home/smile` received one targeted identity-preserving revision
  because its first successful edit read too close to neutral. Only the clearer
  revised grin is retained in the candidate set.
- The first `alya/hopeful` wording was rejected by the image service's input
  moderation before any image was created. A semantically equivalent wholesome
  school-sprite prompt with the hands at waist level succeeded; the selected
  candidate preserves the approved specification.
- The RGB chroma fields contain no checkerboard, scene, floor, or subject shadow,
  but—like the approved proofs—the generated magenta is not one mathematically
  constant RGB value and darkens slightly toward some corners. Production must
  use border-connected tolerant magenta matting, despill, and edge inspection
  against black, white, and teal before promotion.
- Primary 6 and home-clothes Aleem retain their approved 1086×1448 native
  framing; Alya candidates are 1024×1536. These are source candidates, not the
  required normalized 1024×1536 transparent masters or 768×1152 deployed
  sprites.
- Nothing from this candidate set has been copied to `public` or connected to
  story stages.
