# School Years cinematic refresh — first approval gate

Status: **first gate approved on 25 August 2026; production completed**. The
proof files themselves are not deployed; their approved production derivatives
are represented in the story graph and promoted asset batch.

This gate contains the eight required identity/outfit anchors and four empty
environment proofs. Built-in transparent generation returned baked RGB
checkerboards for every character; those outputs were rejected. The selected
anchors use the established flat-magenta fallback and passed
`python -B scripts/validate-school-years-proofs.py`.

## Review sheets

- [Character anchors](characters-contact.jpg)
- [Environment proofs](environments-contact.jpg)

## Character anchors

- [Primary 6 Aleem](aleem-p6-anchor.png)
- [Alya](alya-p6-anchor.png)
- [Young Aleem at home](aleem-young-home-anchor.png)
- [Alya at home](alya-young-home-anchor.png)
- [Secondary-school Aleem](aleem-sec-anchor.png)
- [Secondary-school Aleem at home](aleem-home-anchor.png)
- [Hana](hana-anchor.png)
- [Faris — revised round/compact proof](faris-anchor.png)

The superseded lean Faris candidate is retained as
`faris-anchor-v1-lean.png` for provenance and must not be used as an identity
anchor.

## Environment proofs

- [Primary canteen](bg-primary-canteen-proof.png)
- [Warm 2009 bedroom](bg-bedroom-2009-warm-proof.png)
- [Late language classroom](bg-language-classroom-late-proof.png)
- [Results hall v2](bg-results-hall-v2-proof.png)

The scene proofs are native 1672×941 RGB images. The approved production
pipeline normalized the selected scenes to 2048×1152 masters and 1600×900
deployed WebPs while retaining these original proofs for provenance.

## Prompt and QA records

- [Chapter 1 characters](chapter-1-prompts.md)
- [Chapter 2 characters](chapter-2-prompts.md)
- [Environment scenes](scene-prompts.md)

This first-gate approval authorized identity-preserving expression sheets,
remaining backgrounds, and CG production. The complete 75-asset batch later
received separate promotion approval after its second-gate QA package was
prepared.
