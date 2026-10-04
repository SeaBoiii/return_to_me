import { describe, expect, it } from 'vitest';
import { rangedAudioResponse } from './mediaRange';

describe('cached audio ranges', () => {
  it.each([['bytes=0-1', 'ab', 'bytes 0-1/6'], ['bytes=2-', 'cdef', 'bytes 2-5/6'], ['bytes=-2', 'ef', 'bytes 4-5/6']])('serves %s', async (range, body, contentRange) => {
    const response = await rangedAudioResponse(new Request('https://example.test/voice.mp3', { headers: { range } }), new Response('abcdef', { headers: { 'content-type': 'audio/mpeg' } }));
    expect(response.status).toBe(206);
    expect(response.headers.get('content-range')).toBe(contentRange);
    expect(await response.text()).toBe(body);
  });
  it('rejects unsatisfiable ranges without poisoning the complete response', async () => {
    const complete = new Response('abcdef');
    const response = await rangedAudioResponse(new Request('https://example.test/voice.mp3', { headers: { range: 'bytes=10-20' } }), complete.clone());
    expect(response.status).toBe(416);
    expect(await complete.text()).toBe('abcdef');
  });
});
