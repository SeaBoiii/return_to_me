# Static voice production

The deployed game never calls a speech API. Voice acting is imported as
pre-rendered MP3 files, with provider and licence references. Imports may cover
complete chapters while the remaining story stays subtitle-only. The first
production batch contains 64 ElevenLabs clips for the prologue and Chapter 1,
using the user's selected library voices. Never put provider API
keys, session cookies, private voice IDs, or runtime text-to-speech code in this
repository or in the deployed application.

For rough timing and interface fixtures on Windows, see
[DEVELOPMENT_VOICES.md](DEVELOPMENT_VOICES.md). That isolated workflow cannot
populate the production manifest.
## Audio target

Install `ffmpeg` so both `ffmpeg` and `ffprobe` are available on `PATH`. Normalize
each licensed source to mono MP3 at 48 kHz, approximately 96 kbps, -16 LUFS
integrated loudness, and no higher than -1 dBTP true peak. A typical preparation
command is:

```sh
ffmpeg -i raw-input.wav -af "loudnorm=I=-16:TP=-1:LRA=11" -ar 48000 -ac 1 -codec:a libmp3lame -b:a 96k clips/prologue-003.mp3
```

For critical masters, use ffmpeg's documented two-pass `loudnorm` workflow and
supply the first pass measurements to the second pass. The importer independently
measures every delivered clip. It accepts 80-112 kbps average bitrate and -16
LUFS +/- 0.6, while enforcing mono, 48 kHz, MP3, positive duration, and a true
peak at or below -1 dBTP.

## Import manifest

`voice-import.schema.json` is the machine-readable input contract.
`voice-import.example.json` demonstrates the fields and stable profile IDs for
the active speaking cast. Its single clip is illustrative only. Without
`chapterIds`, a real import must contain exactly one clip for every spoken
`LineNode` in the active story.

To import chapter by chapter, set the optional `chapterIds` array to the
complete cumulative set of chapters to include:

```json
"chapterIds": ["prologue", "chapter-1"]
```

Include exactly one clip for every spoken line in every selected chapter,
including every choice branch. Silent notices and other lines without a
speaker do not receive clips. List the profiles used by those chapters.
Unknown or duplicate chapter IDs and incomplete selected chapters are rejected.
Chapters outside the selection remain subtitle-only.

The selection is cumulative, not an append operation. When Chapter 2 is ready,
add its ID and clips to the existing prologue/Chapter 1 manifest and retain
the earlier clips and profiles. Omitting a previously imported chapter from
the next manifest is rejected to preserve its deployed files and offline pack.

Keep the import JSON beside its `clips/` folder. Every `sourceFile` must be a
relative path contained by that folder tree; absolute paths, traversal, symlink
escapes, non-MP3 files, and empty files are rejected. Each profile records a
provider and license reference. Each clip records a delivery, invoice, consent,
or other provenance reference suitable for an audit trail. References are
published in the generated TypeScript manifest, so do not place secrets or
personal data in them.

The importer validates:

- the exact story ID and content revision;
- every stable profile ID and its speaker mapping;
- every line, speaker, and profile relationship;
- duplicate, unknown, missing, and silent-line clip IDs;
- source containment and deployed filename safety;
- codec, sample rate, channels, bitrate, duration, loudness, and peak level.

Run a non-writing check first:

```sh
npm run voices:check -- voice-production/production.voice-import.json
```

Then install the same, unchanged manifest:

```sh
npm run voices:import -- voice-production/production.voice-import.json
```

Each import is all-or-nothing. Only after every manifest and media check passes
does it replace the bounded `public/voices/` directory and regenerate
`src/voices/generated.ts`. Output ordering follows story order rather than JSON
input order, URLs are grouped into one offline pack per chapter, durations come
from ffprobe, and expected pack byte sizes come from the delivered files.

Finally run the chapter-complete deployment check:

```sh
npm run validate:deploy
```

The GitHub Pages gate accepts an empty production manifest as a subtitles-only
edition or complete voiced chapters alongside later subtitle-only chapters.
It rejects incomplete imported chapters, undeclared or missing files, unknown
profiles, missing provenance, revision mismatches, and pack byte-size mismatches.
`npm run validate:release` is the stricter full-story voiced-release gate and
requires every spoken line in every chapter. Its failure is expected while
later chapters remain unvoiced. Ordinary `npm run validate` remains text-only
friendly during development.

The Offline & install panel lists only available chapter packs. The story and
artwork install separately; players can download, verify, and remove voice
packs individually. Imported lines stream when online and play from the voice
cache once downloaded. Unvoiced lines retain subtitles and a disabled Replay
voice control. Failure to load a clip never prevents reading or advancing.

Automated checks confirm that provenance fields and files are present; they do
not verify provider licensing rights. Keep private source files, voice IDs,
generation records, and account evidence in the ignored local production area.
Before publishing, confirm the provider license covers synthetic performance,
static redistribution, public web delivery, and offline caching. Preserve the
license records referenced by the manifest and include the synthetic-voice/no
voice-cloning disclosure in the game's Credits.
