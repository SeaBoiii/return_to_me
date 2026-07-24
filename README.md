# Return to Me: The School Years

A responsive, installable visual novel about Aleem's school years before meeting Nurul. This first release contains a 4,500–5,500-word branching script whose reflective choices alter dialogue and later recollections while preserving the real-life milestones.

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

The provider-neutral, all-or-nothing voice workflow is documented in [voice-production/README.md](voice-production/README.md). It checks the seven profiles, all 209 spoken lines, licenses and provenance, chapter pack sizes, and normalized MP3 properties through ffmpeg/ffprobe.

```bash
npm run voices:check -- voice-production/production.voice-import.json
npm run voices:import -- voice-production/production.voice-import.json
npm run validate:release
```

Use `npm run validate:deploy` for the Pages-compatible gate: an empty production manifest is accepted as subtitles-only, while a non-empty manifest must cover every spoken line. `npm run validate:release` remains the stricter gate for an explicitly voiced edition.

No API keys, private provider identifiers, or runtime TTS belong in the repository or deployed application.

## Art and release review

Generated masters, prompts, anchor relationships, processing notes, and provenance are recorded in [art/prompts/provenance.md](art/prompts/provenance.md). Deployed artwork lives in `public/assets/art`; the source material remains in `art/sources`.

Before publishing, complete [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md), including the manual character/background approval and factual/tone read-through. The currently generated art is intentionally age-appropriate, uses fictional schools, and avoids readable generated text, trademarks, and copied game interfaces.

## Content and rights

This project is inspired by remembered events. Names, dialogue, schools, and some details are fictionalized. Former-partner names are pseudonyms; exact grades and personal identifiers are omitted; Nurul appears only by name in the epilogue.

Narrative, generated artwork, and imported voice assets are all rights reserved by default unless a specific license record states otherwise. There is no backend, account, analytics, or tracking.