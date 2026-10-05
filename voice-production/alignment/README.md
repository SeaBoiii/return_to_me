# Deployed voice alignment

This folder records offline ElevenLabs forced alignment for all **775** spoken story lines, including every choice branch. The requests used the final files under `public/voices`, after pitch/tempo processing, normalization, and selected retakes. No audio was regenerated or modified.

The completed set contains **25,044** reveal cues across **9,375,816 ms** (156.26 minutes) of deployed audio. Every request succeeded on its first attempt: six pilot requests followed by 769 remaining requests, with at most three requests running concurrently. The pilot responses were reused in the complete run.

## Files and reproducibility

- `plan.json` binds each canonical text, relative voice URL, imported duration, final MP3 SHA-256, text SHA-256, and request fingerprint.
- `responses/<chapter>/<line>/<fingerprint>/response.json` preserves the provider's complete original response body. `receipt.json` records hashes, endpoint, timestamps, duration source, and request details without credentials.
- `summary.json` aggregates structural validation and provider loss values. `pilot-summary.json` records the six representative pilot clips; the latest pilot check reused these responses offline.
- `quality-review.json` records timing and loss outliers and the limits of automated checking.
- `src/voices/alignment.generated.ts` contains only canonical display text, relative voice URLs, durations, and reveal cues. It contains no API key or provider voice IDs.

The endpoint returned neither `request-id` nor `x-request-id` in the captured responses. Consequently, the receipts explicitly record `requestId: null`; no identifiers were invented. The original response body SHA-256 and request fingerprint provide the local provenance binding.

## Commands

```sh
# Offline: checks all 775 current text/audio hashes, raw responses and generated cues.
npm run voices:alignment:check

# Offline: rebuilds runtime metadata from preserved responses; no API request.
npx tsx scripts/voice-alignment.ts --normalize-only

# API access: generates only missing current-hash alignments, with resumable captures.
# Reads ELEVENLABS_API_KEY from the process environment; never prints it.
npm run voices:align

# Six-clip pilot; never replaces the complete runtime metadata.
npx tsx scripts/voice-alignment.ts --pilot
```

`--check` works without a key and makes no network requests or file changes. This was verified with the key removed and the process's `fetch` replaced by a throwing guard. `--pilot --normalize-only` also passed that guard and left the complete runtime metadata hash unchanged.

Completed responses are reused only when text, audio, URL, duration, and fingerprint match. Corrupt or interrupted response/receipt pairs fail explicitly rather than automatically repeating a paid request. Network errors, HTTP 429, and server errors have at most three attempts with bounded backoff; authorization and validation errors are not retried. Successful but malformed responses are preserved before local validation. Runtime metadata is written atomically only after complete coverage passes.

## Reveal semantics and limitations

Each cue is `[UTF16EndOffset, wordStartMs]`. At that audio time, the reader can reveal the canonical string through the end-exclusive offset. Cues use the first aligned lexical character's onset, retain contractions and hyphenated compounds, and split words separated by em dashes. Intervening punctuation and spaces attach to the preceding cue. Offsets use JavaScript UTF-16 units and never split a surrogate pair. The final cue ends at the exact canonical text length.

Unicode decomposition, case, punctuation, and whitespace are normalized **only for matching**. Canonical display text is unchanged. Inserted, missing, reordered, or substituted lexical characters fail validation. All 775 responses mapped without pronunciation aliases or rewritten alignment input. In particular, `ch11-057` aligned the displayed `Nurul` and lowercase `had` to the selected final audio; the earlier provider delivery spellings are not published as story text.

Forced alignment assumes the supplied transcript. It is not independent proof that every word was pronounced correctly, and provider `loss` is an uncalibrated alignment score, not a probability. Higher-loss lines and unusual gaps are retained for review rather than silently rewritten. Durations come from the already validated imported final-MP3 manifest; raw generation timestamps were never scaled or reused.

The complete timing audit found no lexical mismatches, no timestamps beyond the clip durations, and no zero-duration lexical words. There are 3,967 zero-duration individual characters in the provider's character lattice; these do not produce partial-letter reveals. Two lines (`ch9-031`, `ch11-062`) assign the same onset to `I` and `had`. These may reflect linked speech or contractions; both canonical words reveal together, and no timing was invented to separate them.

The median line loss is 0.5590; the 95th percentile is 0.8431. `ch9-034` (`Again ah?`) has the highest line loss, 1.1631, followed by `ch2-064`, `ch11-052`, and `ch2-011`. The longest inter-word gap is 2.2 seconds in `ch2-073`; its onset-to-onset gap is 2.9 seconds because that also includes the preceding word's duration. These are recorded as listening-review candidates, not established defects. The full report includes the highest-loss words, longest gaps, and trailing silence. No audio or canonical wording was changed to improve the scores.

Provider references: [forced-alignment guide](https://elevenlabs.io/docs/eleven-api/guides/cookbooks/forced-alignment), [API contract](https://elevenlabs.io/docs/api-reference/forced-alignment/create).
