# School Years scene production candidates

Generated on 25 August 2026 with OpenAI's built-in image-generation tool.
The tool exposed no exact model name or version, so the generator is recorded
as **unspecified**. These PNGs were the second-gate inputs for the batch whose
processed masters and deploy WebPs were approved and promoted on 25 August
2026. The application serves the promoted copies, not these raw inputs.

## Inventory and lineage

All paths in the table are relative to
`art/candidates/school-years-refresh/scenes/`.

| Candidate | Kind | Reference or production relationship |
| --- | --- | --- |
| `backgrounds/bg-primary-canteen.png` | background | Exact approved proof copy from `art/proofs/school-years-refresh/bg-primary-canteen-proof.png` |
| `backgrounds/bg-bedroom-2009-warm.png` | background | Exact approved proof copy; identity-preserving lighting edit of `art/sources/bg-bedroom-2009-master.png` |
| `backgrounds/bg-alya-bedroom-2010.png` | background | Fresh generation in the approved bedroom style |
| `backgrounds/bg-boys-school-corridor.png` | background | Fresh generation in the approved school style |
| `backgrounds/bg-boys-classroom-overcast.png` | background | Identity-preserving weather/lighting edit of `art/sources/bg-boys-classroom-master.png` |
| `backgrounds/bg-language-classroom-late.png` | background | Exact approved proof copy; identity-preserving lighting edit of `art/sources/bg-language-classroom-master.png` |
| `backgrounds/bg-language-corridor-rain.png` | background | Byte-for-byte copy of the pre-refresh `art/sources/bg-results-hall-master.png` composition (Git blob `82fe2a617534576ffd8531ead53748833895267b`); this candidate preserves that old corridor after the canonical results-hall path received its approved replacement |
| `backgrounds/bg-results-hall.png` | background | Exact approved replacement proof copy from `art/proofs/school-years-refresh/bg-results-hall-v2-proof.png` |
| `cg/cg-wrong-message.png` | CG | Identity-preserving composition using young-home Aleem and the 2009 bedroom; a second edit removed an unwanted generated dialogue panel |
| `cg/cg-first-confession.png` | CG | Composition using the approved Primary 6 Aleem and Alya anchors plus the primary corridor source |
| `cg/cg-graduation-promise.png` | CG | Composition using the approved Primary 6 anchors plus the graduation-gate source |
| `cg/cg-server-night.png` | CG | Composition using the approved home Aleem anchor plus the PC-bedroom night source |
| `cg/cg-results.png` | CG | Composition using the approved secondary Aleem anchor plus the approved replacement results hall |
| `cg/cg-faris-wingman.png` | CG | Composition using approved secondary Aleem, Hana, and Faris anchors plus the language courtyard source |
| `cg/cg-hana-breakup.png` | CG | Composition using approved secondary Aleem and Hana anchors plus the late-classroom candidate |
| `cg/cg-o-level-exam.png` | CG | Composition using approved secondary Aleem plus the exam-hall source; a second edit removed readable clock numerals and signage |

The 12 retained Chapter 1-2 backgrounds are reprocessed from their existing
`art/sources/*-master.png` files. The shared dawn-window art remains unchanged
and is deliberately outside this 75-asset refresh batch.

## Shared production contract

Every newly generated scene used this common direction, with the scene delta
below added to it:

```text
Create a polished wide 16:9 cinematic visual-novel illustration for Return to
Me. Match the approved soft semi-realistic cel-shaded rendering, crisp
silhouettes, restrained painterly texture, and period-conscious generic
Singapore setting. Preserve every referenced character's exact identity, age,
skin tone, face, hair, glasses, build, outfit, and relative stature. Keep
essential faces, hands, props, and action inside the central mobile-safe area.
Keep the lower 38 percent naturally calm and low-detail for the separate HTML
dialogue interface, but do not draw any interface, panel, frame, or caption
inside the artwork. Treatment must remain wholesome and age-appropriate. Use
clean anatomy and complete hands. Do not generate readable text, grades,
school identifiers, badges, crests, brands, copied game UI, logos, trademarks,
signatures, watermarks, or unrelated featured people.
```

## Background deltas

- `bg-alya-bedroom-2010`: Empty fictionalized modest Singapore home corner in
  cool 2010 evening light, lavender accents, a physical-keypad feature phone,
  complete visual distinction from Aleem's room, and no smartphone or readable
  phone display.
- `bg-boys-school-corridor`: Empty generic open-air Singapore secondary-school
  corridor with white walls, restrained pale-blue trim, louvred classroom
  windows, tropical greenery, clear sprite lanes, and no school identity.
- `bg-boys-classroom-overcast`: Preserve the existing boys-classroom camera,
  geometry, desks, windows, fans, and fixtures; change only the atmosphere to
  cool overcast blue-grey daylight with restrained fluorescent fill.

The four approved proof prompts and their first-gate QA remain canonical in
`art/proofs/school-years-refresh/scene-prompts.md`.

## CG deltas

- `cg-wrong-message`: Primary 6 home-clothes Aleem sits alone in the modest
  2009 bedroom just after reading an unexpected SMS on a small physical-keypad
  phone. His reaction is startled and quietly hurt; cool phone light meets the
  last warm room light. The screen contains abstract light only. The initial
  successful generation incorrectly drew an empty UI box; the selected edit
  removes it and naturally reconstructs the bed, floor, and shadows.
- `cg-first-confession`: Primary 6 Aleem clutches a plain schoolbook during a
  shy, sincere after-class corridor conversation. Alya responds with pleasantly
  surprised warmth. They keep comfortable space and use small friendly
  gestures in nostalgic late-afternoon gold.
- `cg-graduation-promise`: Aleem and Alya pause outside the fictional graduation
  gate before taking different routes, each with a plain school bag. Golden
  light and a subtly forking path make the hopeful memory bittersweet.
- `cg-server-night`: Tall, skinny teenage home-clothes Aleem leans into late-
  night server administration while schoolbooks sit neglected nearby. The
  screens contain original abstract voxel-inspired maps, status blocks, and
  unreadable shapes only; electric blue monitor light dominates.
- `cg-results`: Teenage Aleem opens an O-Level results paper in the generic
  fluorescent hall. His quiet contained shock is shown through a slightly
  folded posture and distant gaze. The page contains blurred abstract lines
  only and no exact result.
- `cg-faris-wingman`: Short, round, fluffy-haired Faris speaks to Hana with a
  complete friendly open-hand gesture while tall, skinny Aleem waits nervously
  several steps away. Hana listens with shy curiosity. All three retain their
  approved uniforms and calibrated height relationship; Faris is warm and
  capable, never caricatured.
- `cg-hana-breakup`: Aleem and Hana receive equal visual weight across the end
  of a classroom desk after class. Hana is apologetic and emotionally distant,
  not cruel; Aleem is hurt, guilty, and listening. Cool late light carries a
  faint warm rim and neither character is villainized.
- `cg-o-level-exam`: Teenage Aleem sits mid-paper with his pen hovering as a
  wall clock and empty desks amplify time pressure. His tired expression is
  serious and restrained. The selected revision replaces clock numerals with
  unlabeled ticks, removes the exit lettering, and leaves the paper abstract.

## Generator output provenance

The built-in tool retained its original outputs outside the repository under
`C:/Users/alsiddiq/.codex/generated_images/019f919b-ebd3-7fa0-8cfe-316408c844a8/`.
Selected source filenames are:

| Candidate | Built-in output filename |
| --- | --- |
| `bg-alya-bedroom-2010` | `exec-bf848a23-926f-4ae3-9ff4-c09e6288b666.png` |
| `bg-boys-school-corridor` | `exec-d8b2ffd8-524d-4e06-a615-855832ea467a.png` |
| `bg-boys-classroom-overcast` | `exec-d2b756dc-2df1-4b5b-9cd2-f8a6286c3dfb.png` |
| `cg-wrong-message` | `exec-4781fd12-5535-4910-a77b-9e11acfb42b4.png` |
| `cg-first-confession` | `exec-57962caa-2d81-4808-bdff-b7bda6713213.png` |
| `cg-graduation-promise` | `exec-10de38f3-f26d-4885-8bd5-6476123c8769.png` |
| `cg-server-night` | `exec-50097902-9dba-460b-bf58-8ad8578bcf37.png` |
| `cg-results` | `exec-4692fc65-76f7-4964-b487-871f4c3bca3f.png` |
| `cg-faris-wingman` | `exec-28cc707d-7382-4bc2-bfed-9bafd28d8fed.png` |
| `cg-hana-breakup` | `exec-749c2c1b-39c7-4268-8a89-4d0fbc3822d3.png` |
| `cg-o-level-exam` | `exec-859d4a8f-ef1c-4f22-bd98-9d4c808c0134.png` |

The three other new-background output filenames are recorded because those
files were copied byte-for-byte into the candidate folder. Approved proof and
retained-source lineage is recorded by repository path rather than generator
cache path.

## Initial QA

- All eight selected CGs and all eight new/replacement background candidates
  were visually inspected at full generated resolution.
- Character identities, glasses, hair, uniforms, relative statures, hands, and
  age treatment are consistent with the approved anchors.
- Alya and Hana are presented with empathy. Faris is not caricatured. No
  offscreen mutual friend, other romantic interest, real school identity, exact
  grade, or branded game imagery is shown.
- Phone, paper, server, and results content remains visually unreadable so the
  accessible HTML overlays remain authoritative.
- The wrong-message and exam CGs were deliberately revised after inspection;
  only the corrected versions are in the candidate set.
- These raw RGB scene inputs were deterministically cropped/resized and
  included in the documented contact-sheet QA before promotion. Any regenerated
  scene must repeat those steps and receive a new promotion approval.
