# Production release checklist

This checklist records the human approvals that automation cannot infer. Keep every box unchecked until the named review has actually happened.

## Story and privacy

- [ ] Aleem has completed the factual and tone read-through.
- [ ] Alya and Hana remain empathetic pseudonymous portrayals rather than villains.
- [ ] Schools, badges, exact grades, and personal identifiers remain absent.
- [ ] The relationship breakdown, withdrawal, and O-Level setback remain mild and do not invent diagnoses, self-harm, or severe events.
- [ ] Nurul appears by name only and is not framed as a cure or reward.

## Character and scene art

- [ ] Primary 6 Aleem and Alya identity/style proof approved.
- [ ] Secondary-uniform Aleem, home-clothes Aleem, Hana, and Faris anchors approved.
- [ ] Every background and CG reviewed for period cues, composition, and story tone.
- [ ] Expression variants checked for identity, age, outfit, body shape, hair, and glasses consistency.
- [ ] Transparent edges checked on light and dark stages, especially long, braided, and fluffy hair.
- [ ] No real badge, readable generated text, watermark, trademark, copied Minecraft asset, screenshot, texture, or interface is present.
- [ ] HTML SMS, server, and results overlays remain legible with screen readers and at mobile sizes.

## Release format

Choose one publication path and complete only its checks.

### Subtitles-only edition

- [ ] Production voice entries and offline voice packs are empty.
- [ ] Credits and the offline manager clearly identify the edition as subtitles-only.
- [ ] Every line can be read and advanced with voice replay unavailable.

### Fully voiced edition

- [ ] All seven non-cloned synthetic profiles approved and age-appropriate.
- [ ] Provider licenses permit synthetic performance, redistribution, public web delivery, and offline caching.
- [ ] Every profile and clip has a publishable license/provenance reference with no secret or personal data.
- [ ] `npm run voices:check -- voice-production/production.voice-import.json` passes.
- [ ] `npm run voices:import -- voice-production/production.voice-import.json` completes without warnings.
- [ ] `npm run validate:release` passes with complete spoken-line coverage.
- [ ] Synthetic-voice disclosure and generated provider/license records display correctly in Credits.

## Quality and deployment

- [ ] Desktop keyboard and mobile touch play-throughs completed.
- [ ] Autosave, Continue, chapter unlocks, history, settings, auto, seen skip, voice replay, and reset checked manually.
- [ ] Install, offline shell, and update prompt checked in a production preview; for a voiced edition, chapter voice download, cancellation, retry, verification, and removal are also checked.
- [ ] `npm ci`, `npx playwright install chromium`, and `npm run check` pass from a clean checkout.
- [ ] `npm run validate:deploy` passes for the selected release format.
- [ ] GitHub Pages source is set to GitHub Actions and the `main` deployment succeeds at its repository subpath.
