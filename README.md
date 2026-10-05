# Return to Me

The mobile redesign's completed checks, measurements and device-testing limits are
recorded in [MOBILE_REDESIGN_QA.md](MOBILE_REDESIGN_QA.md).

A responsive, installable visual novel following Aleem from school and National Service in Singapore through university, working life, his January 2026 Umrah journey, and a new beginning with Nurulain. Twenty-five reflective choices change immediate dialogue while preserving the remembered milestones.

**The Story I Wasn’t In** and its university arrival sequence lead into **Almost Us**, **Just Friends**, and **A Different Journey**. Chapters 10–11, **The Same Girl** and **What I Could Finally Put Down**, continue through Makkah and then Madinah: a reunion with Nadiah, the two climbs, a private prayer, and a quiet decision. The final chapter, **A New Book**, follows Mariam’s introduction through messages, Yakiniku, Kazakhstan, meeting Nurul’s parents, and a sunset confession beside Kallang River. **Still Being Written** closes with their engagement and wedding preparations.

The story revision is `school-years-6.0.0`, with 14 chapter entries, 803 nodes, and 22 speaking identities. Saves at the v5 introduction or continuation ending resume at **A New Book**. Earlier replay positions and choices are preserved, with the final chapter unlocked when the old ending was reached. Earlier migration chains retain their first unread expansion: merged v4 and adulthood v3 arrival endings resume at **The Same Girl**, first-edition readers at Chapter 3, JC-edition readers at National Service, and NS-only v3 readers at **Almost Us**. The story ID, storage keys, save format, and installation identity remain stable.

## Local development

Use Node.js 24 and npm. From a fresh clone:

```bash
npm ci
npx playwright install chromium webkit
npm run dev
```

Run the complete local quality gate with:

```bash
npm run check
```

The build itself runs content validation before TypeScript and Vite. Useful focused commands are:

```bash
npm run lint
npm run typecheck
npm run validate
npm run validate:deploy
npm run validate:release
npm run test
npm run test:e2e
npm run test:offline-upgrade
npm run test:offline-upgrade -- --webkit
npm run art:mobile:check
npm run build
```

Development builds can omit voice files, and the deployment workflow also supports subtitles-only editions. The game remains fully playable through subtitles and never calls a runtime speech service.

## GitHub Pages

The repository includes pull-request CI and a Pages workflow for pushes to `main` and manual dispatches. In the GitHub repository, set **Settings → Pages → Build and deployment → Source** to **GitHub Actions**.

The workflow discovers the repository base path, executes the complete check suite, validates the selected audio state, builds `dist`, uploads the Pages artifact, and deploys to the `github-pages` environment. It supports a subtitles-only edition or complete voiced chapters alongside later subtitle-only chapters. Every imported chapter must include all its spoken lines, including choice branches.

The same build supports a custom domain or a repository subpath. Test a nested path locally with:

```powershell
$env:BASE_PATH = '/owner/return-to-me/'
npm run build
npm run preview
```

Vite normalizes the base path; story art, voice packs, the web manifest, and the service worker remain beneath it.

## Reading and replay

Portrait phones and tablets use separate artwork, dialogue, and control areas.
Short landscape screens put the scene beside the passage. Reading sizes of
18, 21, and 24 pixels persist between visits. Tap a passage to reveal it, then
tap again or use Next to continue; scrolling and text selection do not advance.
The artwork button opens the complete illustration.

History, voice playback, Auto, and Next remain within thumb reach. The reading
menu contains chapter replay, settings, downloads, Skip, and the content note.
Menus, artwork viewing, and manual pause suspend narration, text animation, and
automatic progression together. Returning from a hidden tab requires Resume.
Auto and Skip start off on every reading session.

Continue always opens the main bookmark. Chapter replay has an independent
persisted slot, choices, and history, ends at its chapter boundary, and cannot
unlock unread chapters. Resume replay is offered separately. The main save key
and schema are unchanged; replay uses `return-to-me:replay:v1`.

## Offline install

Only application code, story text, essential metadata, and icons are precached.
Artwork loads as needed, using the appropriate orientation variant and a
content hash. After the visible scene loads, the reader can warm the next known
scene; it stops at choices and respects the browser's data-saving preference.
The automatic reading cache is capped at 32 MiB. No voices are fetched in muted
mode.

Offline & install offers 14 chapter artwork packs and 14 voice packs. Artwork
packs contain every branch and both orientations. Shared files are deduplicated
and retained while another downloaded pack needs them. A shared two-transfer
queue continues after closing the panel; progress, remaining bytes, cancellation,
retry, and verification remain available on reopening. Retained downloads are
separate from the automatic reading cache.

Older cached artwork is verified and adopted before legacy cache cleanup, with
resumable migration and no new network downloads during adoption. Existing voice
downloads keep their cache identities. Installation, offline text, artwork, and
voices have separate status indicators; missing media never blocks story text.

Service workers run in production builds over HTTPS or on localhost. Use the in-game Install button when the browser offers installation. A waiting service-worker revision is activated only after the player accepts the update prompt.

On iPhone or iPad, use Safari's Share menu → Add to Home Screen. Chrome and Edge
offer Install app or Add to Home Screen in their browser menu. The offline panel
also supplies these instructions when an automatic install prompt is unavailable.

The PNG icons are reproducible from their code-native source:

```bash
npm run generate:icons
```

## Production voices

The provider-neutral voice workflow is documented in [voice-production/README.md](voice-production/README.md). The complete edition supplies 775 pre-rendered ElevenLabs clips covering every spoken line in the prologue, Chapters 1–12, and epilogue, including every choice branch, using the user's selected library voices. The game plays imported lines automatically and offers Replay voice, volume, mute, and 14 optional offline voice packs.

Voiced passages reveal whole words at their measured speech onset using
[ElevenLabs forced alignment](https://elevenlabs.io/docs/eleven-api/guides/cookbooks/forced-alignment).
All 775 final MP3s have been aligned; the recordings and story text remain unchanged.
Text follows the audio's actual position through buffering, pause/resume and replay.
Muted or unavailable voices retain the chosen text speed. Instant text, reduced
motion and manual Reveal still show the complete passage immediately.

Alignment metadata ships with the offline app; readers never contact ElevenLabs.
`npm run voices:alignment:check` verifies full coverage, current audio/text hashes,
preserved provider responses and exact generated cues, and runs automatically in
`npm run validate`. `npm run voices:align` uses the local `ELEVENLABS_API_KEY` environment variable to
produce missing timings; completed, matching responses are reused. See the
[alignment production record](voice-production/alignment/README.md) for provenance,
regeneration and quality-review limits.

Imports are atomic and may cover the full story or complete chapters selected with `chapterIds`. The current manifest includes all 14 chapter entries. Each import replaces the deployed voice set, so subsequent imports must retain all previously imported chapters and their clips. The importer checks profiles, line coverage, provenance references, chapter pack sizes, and normalized MP3 properties through ffmpeg/ffprobe.

```bash
npm run voices:check -- voice-production/production.voice-import.json
npm run voices:import -- voice-production/production.voice-import.json
npm run validate:deploy
npm run validate:release
```

Use `npm run validate:deploy` for the Pages-compatible gate: an empty production manifest is accepted as subtitles-only, while each imported chapter must cover every spoken line. `npm run validate:release` requires voice coverage for the entire story. The complete 775-clip edition passes both gates. Automated provenance checks verify record completeness, not provider licensing rights; keep the underlying delivery and licence records locally.

No API keys, private provider identifiers, or runtime TTS belong in the repository or deployed application.

## Art and release review

Generated masters, prompts, anchor relationships, processing notes, and provenance are recorded in [art/prompts/provenance.md](art/prompts/provenance.md). Deployed artwork lives in `public/assets/art`; the source material remains in `art/sources`.

The approved JC expansion proof batch is in [art/proofs/jc-expansion](art/proofs/jc-expansion/README.md). The complete 27-sprite, nine-background, and three-CG production brief and QA record are in [art/prompts/jc-production.md](art/prompts/jc-production.md). The processed batch passed physical validation, manifest coverage, and final manual visual/tone QA on 25 August 2026 and is release-ready.

The complete School Years refresh (47 sprites, 20 backgrounds, and eight CGs)
passed physical validation and received owner approval for promotion on
25 August 2026. Its
[production and approval record](art/candidates/school-years-refresh/README.md)
and [QA sheets](art/candidates/school-years-refresh/qa/README.md) remain with
the reproducible candidate inputs; approved masters and deploy WebPs are
promoted to `art/sources` and `public/assets/art` respectively.

Chapter 6, **The Story I Wasn’t In**, uses a separate candidate and QA batch so
the locked School Years inventory remains reproducible. Its National Service,
Hari Raya, relationship, and university-threshold visuals follow the same
proof, approval, deterministic processing, contact-sheet QA, and promotion
gates without copying social-media interfaces, logos, unit insignia, or
identifying text. All 26 assets passed physical validation and the nine-sheet
QA review before promotion on 25 August 2026; the reproducible
[batch record](art/candidates/chapter-six/README.md) and
[prompt record](art/candidates/chapter-six/generation-prompts.md) remain in the
repository.

After processing JC art, run `python -B scripts/validate-jc-art.py` to verify
source/deployed dimensions, sprite alpha and transparent corners, relative
stature calibration, alignment, and precache-size limits. Manual visual and
tone review remains part of the release checklist for future regenerations.

The adulthood batch adds 26 sprites, 11 backgrounds, and two illustrated scenes.
Its shared inventory drives the app manifest and the independent art pipeline:

```bash
npm run art:adulthood:check
```

This processes the generation masters, checks dimensions, transparent sprite
edges, stature, alignment, and the 8 MiB per-file precache limit, then creates
light/dark character contact sheets and a scene overview in `art/qa/adulthood`.
Use `npm run art:adulthood:validate` to check existing output without rewriting it.

The independent Umrah batch adds 16 sprites, seven backgrounds, and three
illustrated scenes. Its [production record](art/prompts/umrah-production.md)
links the exact built-in image-generator prompts, identity references, and
source provenance. Reproduce processing, physical validation, and light/dark
contact sheets with:

```bash
npm run art:umrah:check
```

The `art:umrah:process`, `art:umrah:validate`, and `art:umrah:qa` commands also
run separately. The batch uses the established master and deployment sizes,
calibrated stature, transparent sprite edges, and 8 MiB per-file precache limit.

The finale adds seven Nurulain sprites, four backgrounds, and three illustrated
scenes. Nurul’s 165 cm stature is calibrated against Aleem’s 183 cm stature;
her full hijab and loose, opaque clothing remain consistent across expressions
and scenes. Her parents appear in the restaurant illustration. The
[finale production record](art/prompts/finale-production.md) documents the
generation references, prompts, processing, and review:

```bash
npm run art:finale:check
```

The `art:finale:process`, `art:finale:validate`, and `art:finale:qa` commands
also run separately. Art processing requires Python with Pillow and NumPy.
The isolated pipeline preserves earlier art batches and generates light/dark
character contact sheets and a scene overview under `art/qa/finale`.

The mobile redesign adds twelve independent **960×1200 portrait illustrations**
and individual framing metadata for all 22 illustrated scenes and 57 backgrounds.
All 220 original image files remain unchanged. The renderer crops only when the
recorded faces, gestures, and story props stay visible; otherwise it contains
the illustration. New portraits total 1,977,714 bytes (about 1.89 MiB).
The [mobile production record](art/mobile-portrait/README.md) links native
masters, exact prompts, approved reference hashes, provenance, protected bounds,
and contact sheets. Run `npm run art:mobile:check` to reproduce exports and QA;
`npm run art:mobile:validate` checks existing outputs without rewriting them.

Builds regenerate the content-hashed chapter artwork inventory. Validation
rejects stale hashes, missing orientation variants, invalid subject bounds,
and files above 8 MiB. Browser tests use desktop Chromium, mobile Chromium,
and mobile WebKit; the offline upgrade harness builds and activates workers
on a real local origin. Playwright WebKit's `setOffline` bypasses service-worker
responses, so its offline proof uses origin network refusal instead. This does
not substitute for a physical-device Safari check. Windows WebKit also cannot
decode the downloaded MP3 as a Blob even when the same HTTP file plays. Cached
voices therefore have a bounded original-URL fallback; unavailable offline audio
keeps subtitles and navigation working. Chromium tests exercise actual downloaded
audio from every chapter and cast profile, plus playback through worker updates.

Before publishing, complete [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md), including the manual character/background approval and factual/tone read-through. The currently generated art is intentionally age-appropriate, uses fictional schools, and avoids readable generated text, trademarks, and copied game interfaces.

## Content and rights

This project is inspired by remembered events and is told from Aleem's perspective. Names, dialogue, schools, and some details are fictionalized or reconstructed. Nadiah, Aisyah, Hakim, Jia Wen, Claire, Imran, Kak Mariam, Abang Yusuf, and other former-partner or friend names are pseudonyms; exact grades and personal identifiers are omitted. The other men remain unnamed. Nadiah's familiar warmth and perceived longing are Aleem's impressions; her hijab is not a moral judgement. The private doa reconstructs its meaning, and Jabal Rahmah's association with Adam and Hawa is presented as a tradition Aleem knows. Nurulain’s early impressions are presented as things she later shared with Aleem; her first impression that he was a narcissist is not a diagnosis. Their mutual growth leads to an engagement, with their wedding still ahead. The Kazakhstan friends and Nurul’s parents remain unnamed.

Narrative, generated artwork, and imported voice assets are all rights reserved by default unless a specific license record states otherwise. There is no backend, account, analytics, or tracking.
