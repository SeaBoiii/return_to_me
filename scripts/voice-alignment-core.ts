/** Offline-only conversion from provider character times to canonical JS offsets. */
export interface AlignmentCharacter { readonly text: string; readonly start: number; readonly end: number }
export interface AlignmentWord extends AlignmentCharacter { readonly loss: number }
export interface AlignmentResponse { readonly characters: readonly AlignmentCharacter[]; readonly words: readonly AlignmentWord[]; readonly loss: number }
export interface AlignmentLine {
  readonly text: string;
  readonly voiceUrl: string;
  readonly durationMs: number;
  readonly cues: readonly (readonly [UTF16EndOffset: number, wordStartMs: number])[];
}

const lexical = (text: string) => [...text.normalize('NFKD').toLowerCase()].filter((character) => /[\p{L}\p{N}\p{M}]/u.test(character));

export function parseAlignmentResponse(value: unknown): AlignmentResponse {
  if (!value || typeof value !== 'object') throw new Error('Alignment response must be an object.');
  const data = value as Record<string, unknown>;
  const rows = (value: unknown, label: string): AlignmentCharacter[] => {
    if (!Array.isArray(value) || value.length === 0) throw new Error(`Missing ${label}.`);
    return value.map((item: unknown) => {
      if (!item || typeof item !== 'object') throw new Error(`Invalid ${label} item.`);
      const row = item as Record<string, unknown>;
      if (typeof row.text !== 'string' || typeof row.start !== 'number' || typeof row.end !== 'number') throw new Error(`Invalid ${label} fields.`);
      return { text: row.text, start: row.start, end: row.end };
    });
  };
  const characters = rows(data.characters, 'characters');
  const wordRows = rows(data.words, 'words');
  const words = wordRows.map((row, index) => {
    const loss = (data.words as Record<string, unknown>[])[index].loss;
    if (typeof loss !== 'number' || !Number.isFinite(loss) || loss < 0) throw new Error('Invalid word loss.');
    return { ...row, loss };
  });
  if (typeof data.loss !== 'number' || !Number.isFinite(data.loss) || data.loss < 0) throw new Error('Invalid overall loss.');
  return { characters, words, loss: data.loss };
}

/**
 * Unicode-normalize for comparison only. Display text is never rewritten.
 * Punctuation/case/whitespace changes cannot shift canonical UTF-16 offsets;
 * missing, inserted, or reordered lexical characters are a hard failure.
 */
export function normalizeAlignment(text: string, voiceUrl: string, durationMs: number, response: AlignmentResponse): AlignmentLine {
  if (!text.trim() || !Number.isSafeInteger(durationMs) || durationMs <= 0) throw new Error('Invalid canonical line or duration.');
  for (const [label, rows] of [['character', response.characters], ['word', response.words]] as const) {
    let previous = -1;
    for (const row of rows) {
      if (!Number.isFinite(row.start) || !Number.isFinite(row.end) || row.start < 0 || row.end < row.start || row.start < previous || row.end * 1000 > durationMs + 100) throw new Error(`Invalid or nonmonotonic ${label} timing.`);
      previous = row.start;
    }
  }
  const source = response.characters.flatMap((row) => lexical(row.text).map((character) => ({ character, start: row.start })));
  const target = lexical(text);
  if (source.map((row) => row.character).join('') !== target.join('')) throw new Error('Provider lexical characters do not exactly match canonical text after Unicode/case/punctuation normalization.');
  // Keep contractions and hyphenated compounds whole, but split em-dash/slash
  // separators even when the writer did not insert spaces around them.
  // Intervening punctuation/space is revealed with the preceding word.
  const tokens = [...text.matchAll(/[\p{L}\p{N}\p{M}]+(?:['’\-‐‑][\p{L}\p{N}\p{M}]+)*/gu)];
  if (tokens.length === 0) throw new Error('Canonical line contains no words.');
  let sourceIndex = 0;
  const cues: [number, number][] = [];
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    const letters = lexical(token[0]);
    const start = Math.min(durationMs, Math.round(source[sourceIndex].start * 1000));
    const end = tokens[index + 1]?.index ?? text.length;
    cues.push([end, start]);
    sourceIndex += letters.length;
  }
  const line = { text, voiceUrl, durationMs, cues };
  validateAlignmentLine(line);
  return line;
}

export function validateAlignmentLine(line: AlignmentLine): void {
  if (!Number.isSafeInteger(line.durationMs) || line.durationMs <= 0 || !line.text.trim() || line.cues.length === 0) throw new Error('Invalid aligned line.');
  let previousOffset = 0, previousTime = -1;
  for (const [end, start] of line.cues) {
    if (!Number.isSafeInteger(end) || end <= previousOffset || end > line.text.length) throw new Error('Invalid UTF-16 cue offset.');
    if (!Number.isSafeInteger(start) || start < 0 || start < previousTime || start > line.durationMs) throw new Error('Invalid cue onset.');
    if (end < line.text.length && /[\uD800-\uDBFF]/u.test(line.text[end - 1]) && /[\uDC00-\uDFFF]/u.test(line.text[end])) throw new Error('Cue splits a surrogate pair.');
    previousOffset = end; previousTime = start;
  }
  if (previousOffset !== line.text.length) throw new Error('Final cue does not reveal the complete text.');
}
