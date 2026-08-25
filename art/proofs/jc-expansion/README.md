# JC expansion art proofs

Generated on 25 August 2026 with OpenAI's built-in image generation tool.
These files are approval proofs, not deployed game assets. The revised batch
was approved by the project owner on 25 August 2026, authorising production of
the documented expression sheets, backgrounds, and CGs. Approval date:
`2026-08-25`.

## Shared direction

- Soft, semi-realistic cel-shaded visual-novel art matching the existing art
  bible, with crisp silhouettes and age-appropriate nonsexual treatment.
- Fictional JC uniform: white shirt or blouse, charcoal bottoms, muted-teal
  tie, and no name, crest, badge, logo, or readable text.
- The original character proofs use a green backdrop. Revised Aleem and Mei Lin
  proofs use a non-green magenta key so their green/teal clothing remains
  separable during later matting.
- The existing secondary-school Aleem and Hana sheets were used as identity or
  style references; the existing bus-stop and language-classroom masters were
  used as environment-style references.

## Proofs

- `aleem-jc-proof.png`: identity-preserving age progression of Aleem to 17–18,
  showing the JC uniform and planned zoo-day casual outfit.
- `aleem-jc-proof-v3-magenta.png`: revised Aleem anchor with stronger
  secondary-school identity continuity, subtler ageing, visible hands, and a
  non-green key.
- `syafiqa-proof.png`: tall Malay JC student with long dark hair in a low
  ponytail, no glasses, shown neutral and smiling.
- `mei-lin-proof.png`: very short Chinese JC student with long straight dark
  hair and round glasses, shown in uniform and planned zoo-day casual clothes.
- `mei-lin-proof-v3-magenta.png`: revised Mei Lin anchor with older-teen
  proportions, no notebook, visible hands, and a non-green key.
- `bus-interior-proof.png`: empty generic Singapore public-bus interior around
  2014, with morning light and space for later character staging.

## Approval record

- [x] Aleem remains recognisably continuous with the secondary-school anchor.
- [x] Syafiqa's height, face, hair, uniform, and age treatment are approved.
- [x] Mei Lin's short stature, face, hair, glasses, outfits, and age treatment
  are approved.
- [x] The fictional uniform palette is approved.
- [x] The bus composition and period/style cues are approved.
- [x] No proof contains unwanted text, branding, badges, watermarks, or mature
  framing.

Approval covers the visual direction and anchor relationships only. Every
derived image still requires expression/identity review, deterministic
processing, physical-file validation, and light/dark/in-scene composite QA
before it can be treated as release-ready.

## Internal visual QA before approval

- Syafiqa's identity and the bus's period/style direction pass.
- Revised Aleem passes identity continuity, JC-age treatment, build, outfit,
  and hand-visibility review.
- Revised Mei Lin passes older-teen treatment, distinct identity, outfit,
  hand-visibility, and no-prop review.
- The revised proofs are opaque RGB rather than transparent, and the magenta is
  not a single exact colour. They are safe identity anchors, not deployable
  sprites. Production cutouts require tolerant colour-distance/HSV matting,
  magenta-spill cleanup, and edge checks on white, black, and in-scene
  backgrounds.
- Final character masters must use one scale-calibrated canvas so Syafiqa reads
  tall and Mei Lin very short when the engine renders sprites at a common
  height.
- Final expression review must reject ambiguous fingers, pink hair/glasses
  fringes, and eroded dark outlines.
- The bus proof works as narration/CG art. If it will carry standing sprites,
  revise the foreground seats and poles to leave believable character lanes.

The built-in generator was asked for true transparency, but produced unusable
opaque backgrounds. Those attempts were excluded. The selected magenta proofs
are the approved technical fallback for later tolerant matting; switching to
the API/CLI transparency fallback would require separate user authorisation.

## Post-approval production status

The approved expression-sheet sources now present in `art/sources/characters`
are:

- `aleem-jc-expression-master.png`
- `syafiqa-expression-master.png`
- `mei-lin-jc-expression-master.png`
- `aleem-zoo-expression-master.png`
- `mei-lin-zoo-expression-master.png`
- `mei-lin-zoo-relaxed-master.png`, a corrected hands-visible source intended
  to replace the rejected hidden-hands relaxed pose on the zoo sheet

Their generation and intended cell-to-asset mappings are recorded in
[`art/prompts/jc-production.md`](../../prompts/jc-production.md). All nine
background and three CG masters named there are also present in `art/sources`.
All 39 deployed files and the normalized source masters pass the documented
physical-file validator; the focused manifest test also passes. Final manual
review of the black, white, and teal sprite composites, high-resolution risky
hands/edges, and all 12 scenes/CGs also passed on 25 August 2026. The accepted
shared-earpiece CG keeps Aleem and Syafiqa visibly separate while they doze; the
accepted zoo-distance CG restores Aleem's approved green/cream and Mei Lin's
yellow casual outfits. The production batch is release-ready.
