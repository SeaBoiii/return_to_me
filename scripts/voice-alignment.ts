import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { story } from '../src/story';
import { generatedVoiceEntries } from '../src/voices/generated';
import { normalizeAlignment, parseAlignmentResponse, type AlignmentLine, type AlignmentResponse } from './voice-alignment-core';
import { ALIGNMENT_ENDPOINT as endpoint, alignmentHash as hash, callAlignmentProvider, requireAlignmentKey, validateCachedAlignment, withAlignmentRetry, type AlignmentJob as Job, type AlignmentReceipt as Receipt } from './voice-alignment-io';

const root = fileURLToPath(new URL('../', import.meta.url));
const outputRoot = resolve(root, 'voice-production/alignment');
const generatedPath = resolve(root, 'src/voices/alignment.generated.ts');
const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;
const check = process.argv.includes('--check');
const pilot = process.argv.includes('--pilot');
const normalizeOnly = process.argv.includes('--normalize-only');
const args = process.argv.slice(2);
if (args.some((arg) => !['--check', '--pilot', '--normalize-only'].includes(arg))) throw new Error('Usage: tsx scripts/voice-alignment.ts [--pilot | --check | --normalize-only]');
if (check && (pilot || normalizeOnly)) throw new Error('--check cannot be combined with generation modes.');

interface Result { job: Job; line: AlignmentLine; response: AlignmentResponse; receipt: Receipt; reused: boolean }

async function atomic(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.partial`;
  await writeFile(temporary, content);
  await rename(temporary, path);
}
async function optional(path: string): Promise<string | undefined> {
  try { return await readFile(path, 'utf8'); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined; throw error; }
}
function jobDirectory(job: Job): string { return resolve(outputRoot, 'responses', job.chapterId, job.lineId, job.fingerprint); }

const spoken = story.nodes.filter((node) => node.type === 'line' && node.speakerId !== null);
if (spoken.length !== 775 || generatedVoiceEntries.length !== 775) throw new Error(`Expected all 775 spoken lines and clips, received ${spoken.length}/${generatedVoiceEntries.length}.`);
if (new Set(generatedVoiceEntries.map((entry) => entry.lineId)).size !== 775) throw new Error('Duplicate imported voice lines.');
const jobs: Job[] = [];
for (const node of spoken) {
  if (node.type !== 'line' || node.speakerId === null) throw new Error('Unexpected nonspoken node.');
  const voice = generatedVoiceEntries.find((entry) => entry.lineId === node.id);
  if (!voice || voice.speakerId !== node.speakerId) throw new Error(`Missing/mismatched voice for ${node.id}.`);
  const audio = await readFile(resolve(root, 'public', voice.url));
  const base = { lineId: node.id, chapterId: node.chapterId, speakerId: node.speakerId, text: node.text, voiceUrl: voice.url, durationMs: voice.durationMs,
    audioSha256: hash(audio), audioBytes: audio.byteLength, textSha256: hash(node.text) };
  jobs.push({ ...base, fingerprint: hash(json({ endpoint, ...base })) });
}
const plan = { schemaVersion: 1, storyId: story.id, storyRevision: story.revision, endpoint, source: 'Final deployed public MP3s and exact canonical display text; no generation tags or pronunciation respellings.', jobs };
if (check && await readFile(resolve(outputRoot, 'plan.json'), 'utf8') !== json(plan)) throw new Error('Alignment plan does not match all current canonical texts and deployed MP3 hashes.');
if (!check && !normalizeOnly) await atomic(resolve(outputRoot, 'plan.json'), json(plan));

const key = process.env.ELEVENLABS_API_KEY;
if (!check && !normalizeOnly) requireAlignmentKey(key);
let fatal = false;

async function align(job: Job): Promise<Result> {
  const folder = jobDirectory(job);
  const receiptPath = resolve(folder, 'receipt.json');
  const responsePath = resolve(folder, 'response.json');
  const raw = await optional(responsePath);
  const receipt = validateCachedAlignment(job, await optional(receiptPath), raw);
  if (receipt && raw !== undefined) {
    const response = parseAlignmentResponse(JSON.parse(raw) as unknown);
    return { job, receipt, response, line: normalizeAlignment(job.text, job.voiceUrl, job.durationMs, response), reused: true };
  }
  if (check || normalizeOnly) throw new Error(`${job.lineId}: missing alignment receipt for current audio/text hashes.`);
  if (fatal) throw new Error('Stopped after provider authorization failure.');
  await mkdir(folder, { recursive: true });
  const audio = await readFile(resolve(root, 'public', job.voiceUrl));
  if (hash(audio) !== job.audioSha256) throw new Error(`${job.lineId}: audio changed since preflight.`);
  return withAlignmentRetry(async (attempt) => {
    const started = Date.now();
    let rawBody = '';
    let requestId: string | null = null;
    let status = 0;
    const client = new ElevenLabsClient({ apiKey: key, maxRetries: 0, timeoutInSeconds: 120,
      fetch: async (input, init) => {
        const response = await fetch(input, init);
        status = response.status;
        requestId = response.headers.get('request-id') ?? response.headers.get('x-request-id');
        rawBody = await response.clone().text();
        return response;
      },
    });
    await callAlignmentProvider(() => client.forcedAlignment.create({ file: new File([audio], `${job.lineId}.mp3`, { type: 'audio/mpeg' }), text: job.text }), () => ({ status, requestId }));
      // Preserve successful raw response before any local normalization. A local
      // mapping failure never causes another paid request on resume.
      const receipt: Receipt = { ...job, provider: 'ElevenLabs', endpoint, responseSha256: hash(rawBody), requestId,
        completedAt: new Date().toISOString(), elapsedMs: Date.now() - started, attempts: attempt,
        durationSource: 'Imported deployment manifest; previously measured from this final MP3.' };
      await atomic(responsePath, rawBody);
      await atomic(receiptPath, json(receipt));
      const response = parseAlignmentResponse(JSON.parse(rawBody) as unknown);
      return { job, receipt, response, line: normalizeAlignment(job.text, job.voiceUrl, job.durationMs, response), reused: false };
  }, async (failure) => {
    if (failure.status === 401 || failure.status === 403) fatal = true;
    const stamp = new Date().toISOString();
    await atomic(resolve(folder, `attempt-${stamp.replaceAll(':', '-')}-${failure.attempt}-error.json`), json({ lineId: job.lineId, attemptedAt: stamp, ...failure }));
  });
}

const pilotIds = new Set(['prologue-003', 'ch1-004', 'ch2-011', 'ch9-044', 'ch11-057', 'epilogue-005']);
const selected = pilot ? jobs.filter((job) => pilotIds.has(job.lineId)) : jobs;
const results: Result[] = [];
const failures: { lineId: string; message: string }[] = [];
let cursor = 0;
await Promise.all(Array.from({ length: 3 }, async () => {
  while (cursor < selected.length && !fatal) {
    const job = selected[cursor++];
    try {
      const result = await align(job);
      results.push(result);
      if (!check) process.stdout.write(`${results.length + failures.length}/${selected.length} ${job.lineId} ${result.reused ? 'reused' : 'aligned'} loss=${result.response.loss.toFixed(3)} cues=${result.line.cues.length}\n`);
    } catch (error) {
      failures.push({ lineId: job.lineId, message: error instanceof Error ? error.message : 'Unknown alignment failure.' });
      process.stderr.write(`${job.lineId}: ${failures[failures.length - 1].message}\n`);
    }
  }
}));
results.sort((a, b) => jobs.indexOf(a.job) - jobs.indexOf(b.job));
if (!check) await atomic(resolve(outputRoot, pilot ? 'pilot-summary.json' : 'summary.json'), json({
  schemaVersion: 1, generatedAt: new Date().toISOString(), storyRevision: story.revision, expected: selected.length,
  completed: results.length, failures, allPassed: results.length === selected.length && failures.length === 0,
  method: 'ElevenLabs forced alignment against final deployed MP3 bytes. Loss is an uncalibrated alignment score, not proof of spoken wording.',
  totalDurationMs: results.reduce((sum, item) => sum + item.job.durationMs, 0),
  lines: results.map(({ job, receipt, response, line, reused }) => ({ lineId: job.lineId, fingerprint: job.fingerprint, audioSha256: job.audioSha256,
    textSha256: job.textSha256, responseSha256: receipt.responseSha256, requestId: receipt.requestId, durationMs: job.durationMs, loss: response.loss,
    maxWordLoss: Math.max(...response.words.map((word) => word.loss)), wordCount: response.words.length, cueCount: line.cues.length, reused,
    firstCueMs: line.cues[0][1], lastCueMs: line.cues.at(-1)![1] })),
}));
if (failures.length > 0 || results.length !== selected.length) throw new Error(`Alignment incomplete: ${results.length}/${selected.length}; ${failures.length} failures. Existing provider responses retained.`);
if (pilot) { process.stdout.write(`Pilot passed for ${results.length} final deployed clips. Run without --pilot for all 775.\n`); }
else {
  const entries = Object.fromEntries(results.map((result) => [result.job.lineId, result.line]));
  const generated = `/** Generated by scripts/voice-alignment.ts. Do not hand-edit. */\nexport interface GeneratedVoiceAlignment {\n  readonly text: string;\n  readonly voiceUrl: string;\n  readonly durationMs: number;\n  readonly cues: readonly (readonly [UTF16EndOffset: number, wordStartMs: number])[];\n}\nexport const alignedVoiceLines: Readonly<Record<string, GeneratedVoiceAlignment>> = ${JSON.stringify(entries)};\n`;
  if (check) {
    if (await readFile(generatedPath, 'utf8') !== generated) throw new Error('Runtime alignment metadata is stale. Run --normalize-only; no API calls required.');
    process.stdout.write(`Validated 775 canonical texts, deployed MP3 hashes, preserved responses, bounded UTF-16 cues, and exact runtime metadata.\n`);
  } else {
    await atomic(generatedPath, generated);
    process.stdout.write(`Generated ${results.length} aligned lines (${Buffer.byteLength(generated)} bytes).\n`);
  }
}
