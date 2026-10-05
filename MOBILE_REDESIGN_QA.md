# Mobile redesign validation

Validated on 5 October 2026. The production artifact in `dist/` is built for
`/return_to_me/`. This record covers implementation and technical verification;
it does not replace the author approvals in [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md).

## Results

| Check | Result |
| --- | --- |
| `npm run check` | Passed after voice alignment: lint, TypeScript, content validation, 306 unit tests, production build, 177 browser tests |
| Browser matrix | Desktop Chromium, mobile Chromium, mobile WebKit; 18 intentional project-specific skips |
| `npm run voices:alignment:check` | Passed: 775 recordings, 25,044 cues, exact text/audio hashes and preserved provider responses |
| `npm run art:mobile:check` | Passed: 12 portrait exports, 79 reviewed scenes, six pipeline regression tests |
| `npm run validate:deploy` | Passed: 803 nodes, 220 canonical art assets, 775/775 voiced lines |
| `npm run validate:release` | Passed: complete voice coverage |
| `npm run test:offline-upgrade` | Passed: real worker upgrades, interrupted migration, changed artwork, preserved voices and native offline MP3 playback |
| `npm run test:offline-upgrade -- --webkit` | Cache, migration, hash refresh and range checks passed; native offline playback has the runner limitation below |
| Production subpath smoke test | Passed: title/reader, decoded hashed artwork, manifest identity/icons and controlling service worker; no page errors or failed responses |

Browser skips avoid repeating the full story route, background inventory and
touch-only cases in every project. CPU/network measurement needs Chromium CDP.
The Windows WebKit native offline-audio case is explicitly excluded; it is not
reported as a playback pass.

The synchronized reader was checked against native narrator, processed child and
finale recordings in all three engines, including pause/resume and replay.
Downloaded narration with bundled timing metadata passed offline checks in
Chromium. Instant text, muted fallback, manual Reveal, buffering, stale callbacks
and completed-audio reveal are covered. The [alignment record](voice-production/alignment/README.md)
documents production, timing outliers and structural-versus-listening validation.

## Reader and artwork coverage

- All 22 illustrated scenes checked in desktop presentation and both mobile
  orientations, with protected subject bounds and the appropriate source variant.
- All 57 backgrounds checked inside the portrait reader. Individual framing
  metadata and contact sheets also cover all 79 scenes.
- All 25 reflective choices checked at 320×568 with 24px text; the longest choices
  and passages also checked at 390×844, 768×1024 and 844×390.
- 18/21/24px preferences, 48px controls, passage scrolling, tap/reveal/advance,
  double-tap selection, full-art viewing and reduced motion checked.
- Automated WCAG checks cover the notice, title, reader, menu, settings, artwork
  viewer and offline library in all three browser projects.
- Modal tests cover focus containment/restoration, scroll locking and late-arriving
  background controls. Playback tests cover nested suspension, hidden-tab Resume,
  pending audio, stale callbacks and rapid navigation.
- Replay tests preserve main-save bytes across replay, reload and chapter completion;
  corrupt replay data, locked chapters, resets and older migration chains are covered.
- Runtime sprite checks preserve adult Nurul/Aleem proportions and compensate for
  the inherited Primary 6 Alya/Aleem canvas difference without editing originals.

The [portrait production record](art/mobile-portrait/README.md) retains generation
masters, exact prompts, approved references, provenance and composition reviews.
Twelve 960×1200 WebPs add 1,977,714 bytes; the largest is 249,276 bytes.

## Loading and offline evidence

One cold production-preview measurement at 1.6 Mbps, 150ms latency and 4× CPU
throttling reached the opening screen in **2,883ms** and decoded its artwork in
**3,332ms** after the voice-alignment integration. First contentful paint was 2,836ms. It requested exactly one title
image and zero voice clips. This is a lab observation, not a field-performance
guarantee. Repeat it with the cold-start case in `e2e/art-backgrounds.spec.ts`.

The shell precache contains 13 entries, approximately 1.54 MiB, including timing
metadata for all 775 voices. The earlier reader-only build measured 1,989ms to
the opening screen; bundled timing metadata adds approximately 164 kB compressed
and keeps synchronized narration available offline. Artwork loads on
demand into a bounded reading cache; retained chapter artwork and voice downloads
are separate. Tests cover close/reopen, partial cancellation/retry, shared-file
removal, storage failures, orientation changes and legacy-cache adoption.

The update harness activates a legacy worker, a current worker and a second
current build with changed artwork on one real origin. Both engines preserve
the exact cached MP3 bytes and return correct offline artwork/audio ranges with
zero origin asset requests during the offline proof.

**Device check remaining:** Windows Playwright WebKit bypasses service-worker
responses with `setOffline`, so its harness uses origin network refusal. That
runner also rejects MP3 Blob playback even online without a worker. Chromium
proves native offline playback, and the application has a bounded original-URL
fallback, but native downloaded-voice playback and airplane-mode rotation still
need verification on a physical iPhone/iPad Safari device.

## Compatibility audit

Compared byte-for-byte against commit `02e4fa6f1e51d92a40f4431752ab1bc55999addd`:

- All 220 original images and all 775 approved recordings remain unchanged.
- Story text and voice assignments, 803 node IDs, the `school-years-6.0.0` revision
  and existing migration chains remain unchanged.
- Main save/settings keys, save format v1, voice URLs/cache identity and PWA
  installation identity remain unchanged.

New data is limited to artwork metadata/manifests, additive reading preferences,
replay storage and playback/download state. The final build uses the repository's
existing GitHub Pages path and is ready for deployment.
