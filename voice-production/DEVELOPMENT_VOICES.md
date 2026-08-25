# Development-only SAPI voices

The development job exporter derives its spoken-line and voice-profile counts from the active story. It can render timing and interface fixtures with the two desktop voices bundled on this Windows machine. These generic adult US English voices do not authentically represent the Singaporean cast and have not been cleared for public redistribution or offline caching.

The existing ignored development directory may still contain clips generated for the earlier story revision. They remain untouched unless a generation command is explicitly run and do not provide coverage for newly added chapters.

Nothing in this workflow changes `src/voices/generated.ts` or `public/voices`. All output is written beneath the ignored `voice-production/development/` directory, so `validate:release` continues to reject the project until a genuinely licensed production set is imported. This does not block a subtitles-only GitHub Pages deployment, which uses `validate:deploy`.

## Portable audio tools

The generator needs `ffmpeg` and the audit needs `ffprobe`. They may be installed normally on `PATH`, or downloaded into the ignored workspace tool directory without changing `package.json`:

```powershell
npm install --prefix tmp/audio-tools --no-package-lock --no-save ffmpeg-static ffprobe-static
```

## Generate and review

First export the current job plan, then render one representative line for each registered profile:

```powershell
npm run voices:dev:plan
npm run voices:dev:sapi:proof
```

Then open `voice-production/development/preview.html` and review the profile samples. If their placeholder quality is sufficient for development, render the complete set:

```powershell
npm run voices:dev:sapi
npm run voices:dev:check
```

Generation is resumable. A SHA-256 sidecar records each line's story revision, text, profile, voice, and rate; unchanged clips are reused. Pass `-Force` directly to `scripts/generate-sapi-dev-voices.ps1` to regenerate existing files.

The generated MP3s are mono, 48 kHz, approximately 96 kbps, processed toward −16 LUFS, and limited below −1 dBTP. `voices:dev:check` runs the same technical media audit used by the production importer, but in non-writing mode.

The development manifest contains explicit `DEVELOPMENT-ONLY` markers. The production importer refuses such a manifest even if all media checks pass. Replace it with provider and licence records that truly allow synthetic performance, static web redistribution, and offline caching before production import.
