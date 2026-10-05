import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AudioManager, type AudioElementLike } from '../engine';
import { testVoices } from '../engine/testFixtures';
import type { VoiceAlignment } from '../voices/alignment';
import { usePassageReveal } from './usePassageReveal';

class TimedAudio extends EventTarget implements AudioElementLike {
  currentTime = 0;
  duration = 4;
  volume = 1;
  muted = false;
  preload = '';
  play() { return Promise.resolve(); }
  pause() { /* The test controls media time explicitly. */ }
  emit(event: string) { this.dispatchEvent(new Event(event)); }
}

const alignment: VoiceAlignment = {
  text: 'Hello, Nurul. Thank you.', voiceUrl: 'voices/line-1.mp3', durationMs: 4000,
  cues: [[7, 500], [14, 1300], [20, 2400], [24, 3300]],
};
let audio: AudioManager;
let elements: TimedAudio[];
const options = () => ({ audio, text: alignment.text, alignment, lineId: 'line-1', replay: 0, speed: 24, paused: false, followVoice: true });
async function tick(ms = 20) { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); }
async function start() { await act(async () => { void audio.playLine('line-1'); await Promise.resolve(); }); }

beforeEach(() => {
  vi.useFakeTimers(); elements = [];
  audio = new AudioManager(testVoices, { factory: () => { const element = new TimedAudio(); elements.push(element); return element; } });
});
afterEach(() => { cleanup(); audio.dispose(); vi.useRealTimers(); });

describe('narrated passage reveal', () => {
  it('follows the media clock, including pauses between words, rather than elapsed wall time', async () => {
    const { result } = renderHook(usePassageReveal, { initialProps: options() });
    await start(); await tick(2000);
    expect(result.current.text).toBe('');
    elements[0]!.currentTime = 0.5; await tick();
    expect(result.current.text).toBe('Hello, ');
    await tick(2000);
    expect(result.current.text).toBe('Hello, ');
    elements[0]!.currentTime = 2.4; await tick();
    expect(result.current.text).toBe('Hello, Nurul. Thank ');
    elements[0]!.currentTime = 0.6; await tick();
    expect(result.current.text).toBe('Hello, ');
  });

  it('suspends with a menu and buffering, then resumes from the audio position', async () => {
    const { result, rerender } = renderHook(usePassageReveal, { initialProps: options() });
    await start(); elements[0]!.currentTime = 0.7; await tick();
    act(() => audio.pause()); rerender({ ...options(), paused: true });
    await tick(4000); expect(result.current.text).toBe('Hello, ');
    rerender(options()); await act(async () => { await audio.resume(); });
    elements[0]!.currentTime = 1.5; await tick();
    expect(result.current.text).toBe('Hello, Nurul. ');
    act(() => elements[0]!.emit('waiting'));
    elements[0]!.currentTime = 2.5; await tick(4000);
    expect(result.current.text).toBe('Hello, Nurul. ');
    act(() => elements[0]!.emit('playing')); await tick();
    expect(result.current.text).toBe('Hello, Nurul. Thank ');
  });

  it('honors manual reveal until explicit replay and completes on ended', async () => {
    const { result, rerender } = renderHook(usePassageReveal, { initialProps: options() });
    await start(); act(() => result.current.reveal()); await tick(500);
    expect(result.current.text).toBe(alignment.text);
    rerender({ ...options(), replay: 1 }); await start(); await tick();
    expect(result.current.text).toBe('');
    act(() => elements[1]!.emit('ended')); await tick();
    expect(result.current.text).toBe(alignment.text);
    expect(result.current.complete).toBe(true);
  });

  it('continues silent fallback from the revealed word instead of restarting', async () => {
    const { result, rerender } = renderHook(usePassageReveal, { initialProps: options() });
    await start(); elements[0]!.currentTime = 0.8; await tick();
    rerender({ ...options(), followVoice: false }); act(() => audio.stop());
    await tick(24); expect(result.current.text).toBe('Hello, N');
  });

  it('keeps Instant and reduced-motion text immediate and ignores old-line clocks', async () => {
    const { result, rerender } = renderHook(usePassageReveal, { initialProps: { ...options(), speed: 0 } });
    expect(result.current.text).toBe(alignment.text);
    await start(); elements[0]!.currentTime = 3; await tick();
    rerender({ ...options(), lineId: 'line-2' }); await tick();
    expect(result.current.text).toBe('');
    act(() => elements[0]!.emit('ended')); await tick();
    expect(result.current.text).toBe('');
  });

  it('falls back to the chosen reading speed when alignment is unavailable', async () => {
    const { result } = renderHook(() => usePassageReveal({ ...options(), alignment: undefined }));
    await tick(24); expect(result.current.text).toBe('H');
    await tick(24); expect(result.current.text).toBe('He');
  });

  it('does not rerender instant text for each native playback timestamp', async () => {
    let renders = 0;
    renderHook(() => { renders += 1; return usePassageReveal({ ...options(), speed: 0 }); });
    await start(); await tick();
    const before = renders;
    for (const time of [0.5, 0.8, 1.5, 2.5]) {
      elements[0]!.currentTime = time;
      act(() => elements[0]!.emit('timeupdate'));
      await tick();
    }
    expect(renders).toBe(before);
  });
});
