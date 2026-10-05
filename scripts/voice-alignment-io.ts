import { createHash } from 'node:crypto';

export interface AlignmentJob {
  readonly lineId: string; readonly chapterId: string; readonly speakerId: string; readonly text: string;
  readonly voiceUrl: string; readonly durationMs: number; readonly audioSha256: string; readonly audioBytes: number;
  readonly textSha256: string; readonly fingerprint: string;
}
export interface AlignmentReceipt extends AlignmentJob {
  readonly provider: 'ElevenLabs'; readonly endpoint: string; readonly responseSha256: string; readonly requestId: string | null;
  readonly completedAt: string; readonly elapsedMs: number; readonly attempts: number; readonly durationSource: string;
}
export const ALIGNMENT_ENDPOINT = 'https://api.elevenlabs.io/v1/forced-alignment';
export const alignmentHash = (value: string | Uint8Array) => createHash('sha256').update(value).digest('hex');

export function requireAlignmentKey(value: string | undefined): string {
  if (!value?.trim()) throw new Error('ELEVENLABS_API_KEY is unavailable in the process environment. No requests made.');
  return value;
}

/** Never retain an SDK error object, request headers or its message. */
export class AlignmentRequestFailure extends Error {
  constructor(readonly status: number, readonly requestId: string | null) {
    super(`Alignment request failed (HTTP ${status || 'network'}).`);
    this.name = 'AlignmentRequestFailure';
  }
}
export interface RetryFailure { readonly attempt: number; readonly status: number; readonly requestId: string | null; readonly retryable: boolean }

export async function callAlignmentProvider(operation: () => Promise<unknown>, responseState: () => { status: number; requestId: string | null }): Promise<void> {
  try { await operation(); }
  catch {
    // SDK exceptions can include credentials in their request data. Keep only
    // the HTTP status and the server-supplied request identifier.
    const { status, requestId } = responseState();
    if (status !== 200) throw new AlignmentRequestFailure(status, requestId);
    // A malformed 200 response is still captured before local validation.
  }
}

export async function withAlignmentRetry<T>(
  operation: (attempt: number) => Promise<T>,
  recordFailure: (failure: RetryFailure) => Promise<void>,
  sleep: (ms: number) => Promise<void> = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
): Promise<T> {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try { return await operation(attempt); }
    catch (error) {
      // Local validation/storage failures, including malformed successful
      // responses, never retry a paid provider operation.
      if (!(error instanceof AlignmentRequestFailure)) throw error;
      const retryable = error.status === 0 || error.status === 429 || error.status >= 500;
      await recordFailure({ attempt, status: error.status, requestId: error.requestId, retryable });
      if (!retryable || attempt === 3) throw error;
      await sleep(attempt * 2000);
    }
  }
  throw new Error('Alignment retry limit reached.');
}

/** Undefined means not started; an interrupted/corrupt capture must never re-request automatically. */
export function validateCachedAlignment(job: AlignmentJob, receiptJson: string | undefined, raw: string | undefined): AlignmentReceipt | undefined {
  if (receiptJson === undefined && raw === undefined) return undefined;
  if (receiptJson === undefined || raw === undefined) throw new Error(`${job.lineId}: interrupted alignment capture; recover preserved provenance before another API request.`);
  const receipt = JSON.parse(receiptJson) as AlignmentReceipt;
  for (const field of Object.keys(job) as (keyof AlignmentJob)[]) {
    if (receipt[field] !== job[field]) throw new Error(`${job.lineId}: stale alignment receipt ${field}.`);
  }
  if (receipt.provider !== 'ElevenLabs' || receipt.endpoint !== ALIGNMENT_ENDPOINT) throw new Error(`${job.lineId}: unexpected alignment provenance.`);
  if (alignmentHash(raw) !== receipt.responseSha256) throw new Error(`${job.lineId}: preserved provider response hash mismatch.`);
  return receipt;
}
