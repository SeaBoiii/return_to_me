import { alignedVoiceLines } from './alignment.generated';

export interface VoiceAlignment {
  readonly text: string;
  readonly voiceUrl: string;
  readonly durationMs: number;
  /** UTF-16 substring end offset, followed by the spoken word's start in milliseconds. */
  readonly cues: readonly (readonly [number, number])[];
}

/** Never apply timings to edited text or a different recording. Build checks verify hashes. */
export function getVoiceAlignment(lineId: string, text: string, voiceUrl: string | undefined): VoiceAlignment | undefined {
  const alignment = alignedVoiceLines[lineId];
  return alignment?.text === text && alignment.voiceUrl === voiceUrl ? alignment : undefined;
}

export function alignedCharacterCount(alignment: VoiceAlignment, seconds: number): number {
  if (!Number.isFinite(seconds) || seconds < 0) return 0;
  const timeMs = seconds * 1000;
  let low = 0;
  let high = alignment.cues.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (alignment.cues[middle]![1] <= timeMs) low = middle + 1;
    else high = middle;
  }
  return low > 0 ? alignment.cues[low - 1]![0] : 0;
}
