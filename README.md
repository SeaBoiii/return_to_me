# Return to Me

A responsive, installable visual novel following Aleem from school and National Service in Singapore through university, working life, his January 2026 Umrah journey, and a new beginning with Nurulain. Twenty-five reflective choices change immediate dialogue while preserving the remembered milestones.

**The Story I Wasn’t In** and its university arrival sequence lead into **Almost Us**, **Just Friends**, and **A Different Journey**. Chapters 10–11, **The Same Girl** and **What I Could Finally Put Down**, continue through Makkah and then Madinah: a reunion with Nadiah, the two climbs, a private prayer, and a quiet decision. The final chapter, **A New Book**, follows Mariam’s introduction through messages, Yakiniku, Kazakhstan, meeting Nurul’s parents, and a sunset confession beside Kallang River. **Still Being Written** closes with their engagement and wedding preparations.

The story revision is `school-years-6.0.0`, with 14 chapter entries, 803 nodes, and 22 speaking identities. Saves at the v5 introduction or continuation ending resume at **A New Book**. Earlier replay positions and choices are preserved, with the final chapter unlocked when the old ending was reached. Earlier migration chains retain their first unread expansion: merged v4 and adulthood v3 arrival endings resume at **The Same Girl**, first-edition readers at Chapter 3, JC-edition readers at National Service, and NS-only v3 readers at **Almost Us**. The story ID, storage keys, save format, and installation identity remain stable.

## Local development

Use Node.js 24 and npm. From a fresh clone:

```bash
npm ci
npx playwright install chromium
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
npm run test
npm run test:e2e
npm run build
```

Voice files are optional during development and for a subtitles-only deployment. The game remains fully playable through subtitles and never calls a runtime speech service.

## GitHub Pages

The repository includes pull-request CI and a Pages workflow for pushes to `main` and manual dispatches. In the GitHub repository, set **Settings → Pages → Build and deployment → Source** to **GitHub Actions**.

The workflow discovers the repository base path, executes the complete check suite, validates the selected audio state, builds `dist`, uploads the Pages artifact, and deploys to the `github-pages` environment. With zero imported production clips it publishes a subtitles-only edition. Once any production clip is imported, deployment requires complete licensed coverage, preventing an accidental partial-voice release.

The same build supports a custom domain or a repository subpath. Test a nested path locally with:

```powershell
$env:BASE_PATH = '/owner/return-to-me/'
npm run build
npm run preview
```

Vite normalizes the base path; story art, voice packs, the web manifest, and the service worker remain beneath it.

## Offline install

The application shell, UI, story data, and visual assets are precached after the first online visit. Voice audio is excluded from the initial installation and can be downloaded, verified, retried, cancelled, and removed one chapter at a time from the in-game manager.

Service workers run in production builds over HTTPS or on localhost. Use the in-game Install button when the browser offers installation. A waiting service-worker revision is activated only after the player accepts the update prompt.

The PNG icons are reproducible from their code-native source:

```bash
npm run generate:icons
```

## Production voices

The provider-neutral, all-or-nothing voice workflow is documented in [voice-production/README.md](voice-production/README.md). It derives the active speaking cast and spoken-line count from the story, then checks every profile and line, licenses and provenance, chapter pack sizes, and normalized MP3 properties through ffmpeg/ffprobe.

```bash
npm run voices:check -- voice-production/production.voice-import.json
npm run voices:import -- voice-production/production.voice-import.json
npm run validate:release
```

Use `npm run validate:deploy` for the Pages-compatible gate: an empty production manifest is accepted as subtitles-only, while a non-empty manifest must cover every spoken line. `npm run validate:release` remains the stricter gate for an explicitly voiced edition.

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

Before publishing, complete [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md), including the manual character/background approval and factual/tone read-through. The currently generated art is intentionally age-appropriate, uses fictional schools, and avoids readable generated text, trademarks, and copied game interfaces.

## Content and rights

This project is inspired by remembered events and is told from Aleem's perspective. Names, dialogue, schools, and some details are fictionalized or reconstructed. Nadiah, Aisyah, Hakim, Jia Wen, Claire, Imran, Kak Mariam, Abang Yusuf, and other former-partner or friend names are pseudonyms; exact grades and personal identifiers are omitted. The other men remain unnamed. Nadiah's familiar warmth and perceived longing are Aleem's impressions; her hijab is not a moral judgement. The private doa reconstructs its meaning, and Jabal Rahmah's association with Adam and Hawa is presented as a tradition Aleem knows. Nurulain’s early impressions are presented as things she later shared with Aleem; her first impression that he was a narcissist is not a diagnosis. Their mutual growth leads to an engagement, with their wedding still ahead. The Kazakhstan friends and Nurul’s parents remain unnamed.

Narrative, generated artwork, and imported voice assets are all rights reserved by default unless a specific license record states otherwise. There is no backend, account, analytics, or tracking.
