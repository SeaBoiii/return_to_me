import { describe, expect, it } from 'vitest';
import { normalizeAlignment, parseAlignmentResponse, validateAlignmentLine, type AlignmentResponse } from './voice-alignment-core';

function timed(text: string): AlignmentResponse {
  const characters = [...text].map((text, index) => ({ text, start: index * 0.05 + 0.2, end: index * 0.05 + 0.24 }));
  return { characters, words: [{ text, start: 0.2, end: characters.at(-1)!.end, loss: 0.3 }], loss: 0.3 };
}

describe('offline forced-alignment normalization', () => {
  it('reveals complete canonical words, punctuation and spaces at each first speech onset', () => {
    const text = '“Hello,” she said…';
    const result = normalizeAlignment(text, 'voices/a.mp3', 3000, timed('hello she said'));
    expect(result.text).toBe(text);
    expect(result.cues).toEqual([[9, 200], [13, 500], [18, 700]]);
    expect(result.text.slice(0, result.cues[0][0])).toBe('“Hello,” ');
  });

  it('maps decomposition, astral characters, apostrophes and whitespace without changing display text', () => {
    const text = 'Élan 𐐀 — I’m\nready.';
    const result = normalizeAlignment(text, 'voices/a.mp3', 4000, timed('e\u0301lan 𐐨 im ready'));
    expect(result.cues.map(([offset]) => text.slice(0, offset))).toEqual(['Élan ', 'Élan 𐐀 — ', 'Élan 𐐀 — I’m\n', text]);
    expect(result.cues.at(-1)?.[0]).toBe(text.length);
  });

  it('keeps contractions and hyphenated compounds together even when the provider splits them', () => {
    const result = normalizeAlignment("I'm half-asleep.", 'voices/a.mp3', 3000, timed('I m half asleep'));
    expect(result.cues).toHaveLength(2);
    expect(result.cues.map(([offset]) => result.text.slice(0, offset))).toEqual(["I'm ", "I'm half-asleep."]);
  });

  it('does not reveal a word after an em dash before that word is spoken', () => {
    const text = 'Terima kasih—thank you.';
    const result = normalizeAlignment(text, 'voices/a.mp3', 4000, timed(text));
    expect(result.cues.map(([offset]) => text.slice(0, offset))).toEqual(['Terima ', 'Terima kasih—', 'Terima kasih—thank ', text]);
    expect(result.cues[2][1]).toBe(850);
  });

  it.each(['I saw her.', 'I saw a story.', 'story I saw'])('rejects lexical substitutions, insertions and reordering: %s', (providerText) => {
    expect(() => normalizeAlignment('I saw the story.', 'voices/a.mp3', 4000, timed(providerText))).toThrow('lexical characters');
  });

  it('rejects reverse, nonfinite and out-of-duration times', () => {
    for (const invalid of [
      { text: 'b', start: 0.1, end: 0.3 },
      { text: 'b', start: Number.NaN, end: 0.3 },
      { text: 'b', start: 0.4, end: 0.3 },
      { text: 'b', start: 3, end: 4 },
    ]) {
      const response = timed('ab');
      expect(() => normalizeAlignment('ab', 'voices/a.mp3', 1000, { ...response, characters: [response.characters[0], invalid] })).toThrow('timing');
    }
  });

  it('rejects missing or malformed provider responses and nonfinite loss values', () => {
    const response = timed('hello');
    for (const invalid of [null, {}, { ...response, characters: [] }, { ...response, words: [] }, { ...response, loss: Number.NaN }, { ...response, words: [{ ...response.words[0], loss: -1 }] }]) {
      expect(() => parseAlignmentResponse(invalid)).toThrow();
    }
    expect(parseAlignmentResponse(response)).toEqual(response);
  });

  it('rejects split surrogate pairs, partial final text and descending cue times', () => {
    const base = { text: '𐐀 yes', voiceUrl: 'voices/a.mp3', durationMs: 2000 };
    for (const cues of [[[1, 100], [6, 200]], [[2, 100]], [[3, 200], [6, 100]]] as const) {
      expect(() => validateAlignmentLine({ ...base, cues })).toThrow();
    }
  });
});
