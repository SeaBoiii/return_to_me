import { useCallback, useEffect, useState } from 'react';
import type { AudioManager } from '../engine';
import { alignedCharacterCount, type VoiceAlignment } from '../voices/alignment';

interface RevealOptions {
  readonly audio: AudioManager;
  readonly text: string;
  readonly lineId: string;
  readonly replay: number;
  readonly speed: number;
  readonly paused: boolean;
  readonly followVoice: boolean;
  readonly alignment: VoiceAlignment | undefined;
}

/** Audio owns narrated text's clock. The timer remains a fallback for silent reading. */
export function usePassageReveal({ audio, text, lineId, replay, speed, paused, followVoice, alignment }: RevealOptions) {
  const key = `${lineId}:${replay}`;
  const [progress, setProgress] = useState({ key, count: 0, revealed: false });
  const [clock, setClock] = useState(() => audio.snapshot);
  useEffect(() => {
    let previous: typeof audio.snapshot | undefined;
    return audio.subscribeSnapshot(next => {
      if (previous?.nodeId === next.nodeId && previous?.playbackId === next.playbackId
        && previous?.state === next.state && previous?.ended === next.ended) return;
      previous = next;
      setClock(next);
    });
  }, [audio]);

  const current = progress.key === key ? progress : undefined;
  const instant = speed === 0;
  const synchronized = followVoice && alignment !== undefined;
  const count = instant || current?.revealed ? text.length : current?.count ?? 0;

  useEffect(() => {
    if (!synchronized || !alignment || instant || paused || current?.revealed) return;
    let frame: number | undefined;
    let cancelled = false;
    const sample = () => {
      if (cancelled) return;
      const now = audio.snapshot;
      if (now.nodeId !== lineId) return;
      if (now.ended || now.state === 'playing') {
        const next = now.ended ? text.length : alignedCharacterCount(alignment, audio.currentTime);
        setProgress(previous => previous.key === key && (previous.revealed || previous.count === next)
          ? previous : { key, count: next, revealed: false });
      }
      if (!now.ended && now.state === 'playing') frame = requestAnimationFrame(sample);
    };
    // Sample outside the effect body, including a terminal event between frames.
    queueMicrotask(sample);
    return () => { cancelled = true; if (frame !== undefined) cancelAnimationFrame(frame); };
  }, [audio, alignment, synchronized, lineId, key, text.length, instant, paused, current?.revealed,
    clock.nodeId, clock.playbackId, clock.state, clock.ended]);

  useEffect(() => {
    if (synchronized || instant || paused || count >= text.length) return;
    const timer = window.setTimeout(() => setProgress(previous => ({
      key, count: Math.min(text.length, (previous.key === key ? previous.count : 0) + 1), revealed: false,
    })), speed);
    return () => clearTimeout(timer);
  }, [synchronized, instant, paused, count, text.length, key, speed]);

  const reveal = useCallback(() => setProgress({ key, count: text.length, revealed: true }), [key, text.length]);
  return { text: text.slice(0, count), complete: count >= text.length, reveal, synchronized: synchronized && !instant };
}
