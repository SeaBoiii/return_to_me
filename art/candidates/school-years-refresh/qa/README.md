# Chapters 1–2 final-approval QA

These sheets review the complete candidate-only batch. Nothing in this folder
is referenced by the deployed application.

- `01-sprites-overview.jpg`: all 47 aligned sprites.
- `02-backgrounds-overview.jpg`: all 20 retained/new backgrounds.
- `03-cgs-overview.jpg`: all eight CGs.
- `04-sprites-black.png`, `05-sprites-white.png`, and
  `06-sprites-teal.png`: all sprites composited over edge-revealing colours.
- `07-stature-lineup.png`: common-scale stature and baseline comparison.
- `08-close-braids.png`: Alya's school and home braids.
- `09-close-long-fluffy-hair.png`: Hana's long hair and Faris's fluffy hair.
- `10-close-glasses.png`: representative frame/lens/eye crops.
- `11-close-hands.png`: representative pose and hand crops.
- `12-close-alpha-edges.png`: identical silhouette crops on checkerboard,
  black, white, and teal.

Regenerate after processing with:

```powershell
npm run art:school-years:qa
```

Physical checks (inventory, dimensions, alpha, corners, baselines, centering,
relative stature, matte residue, detached fragments, and file-size budgets)
run separately with `npm run art:school-years:validate`. Identity, anatomy,
tone, age treatment, forbidden text, and scene meaning still require the final
human approval gate before promotion to `art/sources` or `public`.
