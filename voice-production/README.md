# Static voice production

The deployed game never calls a speech API. Voice acting is imported as licensed,
pre-rendered MP3 files, and the checked-in development manifest intentionally
stays empty until a complete production set is ready. Never put provider API
keys, session cookies, private voice IDs, or runtime text-to-speech code in this
repository or in the deployed application.

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
`voice-import.example.json` demonstrates the fields and seven stable profile
IDs. Its single clip is illustrative only; a real import must contain exactly
one clip for every spoken `LineNode` in the active story.

Keep the import JSON beside its `clips/` folder. Every `sourceFile` must be a
relative path contained by that folder tree; absolute paths, traversal, symlink
escapes, non-MP3 files, and empty files are rejected. Each profile records a
provider and license reference. Each clip records a delivery, invoice, consent,
or other provenance reference suitable for an audit trail. References are
published in the generated TypeScript manifest, so do not place secrets or
personal data in them.

The importer validates:

- the exact story ID and content revision;
- all seven stable profile IDs and their speaker mapping;
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

The import is all-or-nothing. Only after every manifest and media check passes
does it replace the bounded `public/voices/` directory and regenerate
`src/voices/generated.ts`. Output ordering follows story order rather than JSON
input order, URLs are grouped into one offline pack per chapter, durations come
from ffprobe, and expected pack byte sizes come from the delivered files.

Finally run:

```sh
npm run validate:release
```

That release gate rejects incomplete spoken-line coverage, undeclared or missing
files, unknown profiles, bad provenance, revision mismatches, and pack byte-size
mismatches. Ordinary `npm run validate` remains text-only friendly so licensed
clips can be prepared outside the repository without blocking development.

Before publishing, confirm the provider license covers synthetic performance,
static redistribution, public web delivery, and offline caching. Preserve the
license records referenced by the manifest and include the synthetic-voice/no
voice-cloning disclosure in the game's Credits.