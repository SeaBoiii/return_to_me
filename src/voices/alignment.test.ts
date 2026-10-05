import { describe, expect, it, vi } from 'vitest';
import { alignedCharacterCount, getVoiceAlignment, type VoiceAlignment } from './alignment';

vi.mock('./alignment.generated', () => ({ alignedVoiceLines: {
  example: { text: '“Hello,” Nurul. 😊', voiceUrl: 'voices/example.mp3', durationMs: 3500, cues: [[9, 400], [16, 2100], [18, 3100]] },
} }));

const sample: VoiceAlignment = {
  text: 'Hi, Nurul.', voiceUrl: 'voices/example.mp3', durationMs: 4000, cues: [[4, 300], [10, 1800]],
};

describe('voice alignment lookup', () => {
  it('reveals whole words at their measured onset and waits through gaps', () => {
    expect(alignedCharacterCount(sample, 0.299)).toBe(0);
    expect(alignedCharacterCount(sample, 0.3)).toBe(4);
    expect(alignedCharacterCount(sample, 1.799)).toBe(4);
    expect(alignedCharacterCount(sample, 1.8)).toBe(10);
    expect(alignedCharacterCount(sample, 999)).toBe(10);
    expect(alignedCharacterCount(sample, NaN)).toBe(0);
    expect(alignedCharacterCount(sample, -1)).toBe(0);
  });

  it('supports simultaneous onsets and empty cue lists without inventing timing', () => {
    expect(alignedCharacterCount({ ...sample, cues: [[4, 0], [10, 0]] }, 0)).toBe(10);
    expect(alignedCharacterCount({ ...sample, cues: [] }, 2)).toBe(0);
  });

  it('rejects missing, stale-text and replacement-voice alignments', () => {
    expect(getVoiceAlignment('example', '“Hello,” Nurul. 😊', 'voices/example.mp3')).toBeDefined();
    expect(getVoiceAlignment('example', 'Hello Nurul', 'voices/example.mp3')).toBeUndefined();
    expect(getVoiceAlignment('example', '“Hello,” Nurul. 😊', 'voices/replaced.mp3')).toBeUndefined();
    expect(getVoiceAlignment('missing', '“Hello,” Nurul. 😊', undefined)).toBeUndefined();
  });
});
