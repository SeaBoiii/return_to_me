import { describe, expect, it, vi } from 'vitest';
import { ALIGNMENT_ENDPOINT, AlignmentRequestFailure, alignmentHash, callAlignmentProvider, requireAlignmentKey, validateCachedAlignment, withAlignmentRetry, type AlignmentJob, type AlignmentReceipt } from './voice-alignment-io';

const job: AlignmentJob = { lineId: 'line', chapterId: 'chapter', speakerId: 'narrator', text: 'Hello.', voiceUrl: 'voices/line.mp3', durationMs: 1500,
  audioSha256: alignmentHash('audio'), audioBytes: 5, textSha256: alignmentHash('Hello.'), fingerprint: 'fingerprint' };
const raw = '{"characters":[]}';
const receipt: AlignmentReceipt = { ...job, provider: 'ElevenLabs', endpoint: ALIGNMENT_ENDPOINT, responseSha256: alignmentHash(raw), requestId: null,
  completedAt: '2026-10-05T00:00:00Z', elapsedMs: 10, attempts: 1, durationSource: 'Imported final MP3 duration.' };

describe('forced-alignment request and resume safety', () => {
  it('requires an environment key before a provider request and never includes its value in errors', () => {
    expect(() => requireAlignmentKey(undefined)).toThrow('No requests made');
    expect(() => requireAlignmentKey('  ')).toThrow('No requests made');
    expect(requireAlignmentKey('test-secret')).toBe('test-secret');
  });

  it('strips SDK request secrets, error messages and causes at the provider boundary', async () => {
    const sdkError = Object.assign(new Error('failed test-secret'), { request: { headers: { 'xi-api-key': 'test-secret' } }, cause: 'test-secret' });
    const failure = await callAlignmentProvider(() => Promise.reject(sdkError), () => ({ status: 401, requestId: 'request-1' })).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(AlignmentRequestFailure);
    expect(String(failure)).not.toContain('test-secret');
    expect(JSON.stringify(failure)).not.toContain('test-secret');
    expect((failure as Error).cause).toBeUndefined();
  });

  it('preserves malformed successful responses for local validation instead of repeating paid requests', async () => {
    await expect(callAlignmentProvider(() => Promise.reject(new Error('malformed provider body')), () => ({ status: 200, requestId: null }))).resolves.toBeUndefined();
  });

  it('retries transient failures at most three times with bounded backoff', async () => {
    const operation = vi.fn<(attempt: number) => Promise<string>>()
      .mockRejectedValueOnce(new AlignmentRequestFailure(429, 'first'))
      .mockRejectedValueOnce(new AlignmentRequestFailure(503, 'second'))
      .mockResolvedValueOnce('captured');
    const record = vi.fn(() => Promise.resolve());
    const sleep = vi.fn(() => Promise.resolve());
    await expect(withAlignmentRetry(operation, record, sleep)).resolves.toBe('captured');
    expect(operation.mock.calls).toEqual([[1], [2], [3]]);
    expect(sleep.mock.calls).toEqual([[2000], [4000]]);
    expect(record.mock.calls).toEqual([[{ attempt: 1, status: 429, requestId: 'first', retryable: true }], [{ attempt: 2, status: 503, requestId: 'second', retryable: true }]]);
  });

  it('does not exceed the retry cap for persistent network failures', async () => {
    const operation = vi.fn(() => Promise.reject(new AlignmentRequestFailure(0, null)));
    await expect(withAlignmentRetry(operation, () => Promise.resolve(), () => Promise.resolve())).rejects.toThrow('network');
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it.each([401, 403, 422])('does not retry terminal HTTP %i', async (status) => {
    const operation = vi.fn(() => Promise.reject(new AlignmentRequestFailure(status, null)));
    const sleep = vi.fn(() => Promise.resolve());
    await expect(withAlignmentRetry(operation, () => Promise.resolve(), sleep)).rejects.toThrow(`HTTP ${status}`);
    expect(operation).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it('does not repeat requests for local mapping or storage failures', async () => {
    const operation = vi.fn(() => Promise.reject(new Error('lexical mismatch')));
    const record = vi.fn(() => Promise.resolve());
    await expect(withAlignmentRetry(operation, record)).rejects.toThrow('lexical mismatch');
    expect(operation).toHaveBeenCalledTimes(1);
    expect(record).not.toHaveBeenCalled();
  });

  it('resumes only exact text/audio/metadata hashes and unchanged raw responses', () => {
    expect(validateCachedAlignment(job, JSON.stringify(receipt), raw)).toEqual(receipt);
    for (const changed of [{ ...job, audioSha256: 'new' }, { ...job, text: 'Changed.' }, { ...job, durationMs: 2000 }, { ...job, fingerprint: 'new' }]) {
      expect(() => validateCachedAlignment(changed, JSON.stringify(receipt), raw)).toThrow('stale');
    }
    expect(() => validateCachedAlignment(job, JSON.stringify(receipt), `${raw} `)).toThrow('response hash');
  });

  it('distinguishes an unstarted job from interrupted pairs and never treats a partial capture as permission to re-request', () => {
    expect(validateCachedAlignment(job, undefined, undefined)).toBeUndefined();
    expect(() => validateCachedAlignment(job, undefined, raw)).toThrow('interrupted');
    expect(() => validateCachedAlignment(job, JSON.stringify(receipt), undefined)).toThrow('interrupted');
  });
});
