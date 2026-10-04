import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { AudioManager, getCurrentNode } from '../engine';
import { getAssetEntry } from '../art/manifest';
import { getArtUrl } from '../pwa/artContent';
import { story } from '../story';
import { voiceEntries } from '../voices';
import { useStory } from './StoryContext';
import { ReadingStage } from './ReadingStage';
import { usePortrait } from './usePortrait';
import { Modal } from './Modal';
import type { Panel } from './panels';
import common from './App.module.css';
import styles from './Reader.module.css';

function useTypewriter(text: string, id: string, speed: number, paused: boolean) {
  const [progress, setProgress] = useState({ id, count: 0 });
  const count = speed === 0 ? text.length : progress.id === id ? progress.count : 0;
  useEffect(() => {
    if (!speed || paused || count >= text.length) return;
    const timer = window.setTimeout(() => setProgress(current => ({
      id, count: Math.min(text.length, (current.id === id ? current.count : 0) + 1),
    })), speed);
    return () => clearTimeout(timer);
  }, [text, id, speed, paused, count]);
  const reveal = useCallback(() => setProgress({ id, count: text.length }), [id, text.length]);
  return { text: text.slice(0, count), complete: count >= text.length, reveal };
}

/** Suspension preserves the remaining delay, including nested menu/visibility pauses. */
function useReadingTimer(id: string, delay: number, enabled: boolean, paused: boolean, onFire: () => void) {
  const budget = useRef<{ id: string; delay: number; remaining: number; fired: boolean } | undefined>(undefined);
  useEffect(() => {
    if (!enabled) { budget.current = undefined; return; }
    if (budget.current?.id !== id || budget.current.delay !== delay) {
      budget.current = { id, delay, remaining: delay, fired: false };
    }
    const clock = budget.current;
    if (paused || clock.fired) return;
    const started = performance.now();
    const timer = window.setTimeout(() => { clock.fired = true; onFire(); }, clock.remaining);
    return () => { clearTimeout(timer); clock.remaining = Math.max(0, clock.remaining - (performance.now() - started)); };
  }, [id, delay, enabled, paused, onFire]);
}

export function Reader({ onTitle, onOpenPanel, panelOpen, pauseRequest = 0 }: {
  onTitle: () => void; onOpenPanel: (panel: Exclude<Panel, null>) => void; panelOpen: boolean; pauseRequest?: number;
}) {
  const { state, settings, dispatch, updateSettings, sessionMode, replayComplete, returnToMain, storageMessage } = useStory();
  const node = getCurrentNode(story, state);
  const audio = useMemo(() => new AudioManager(voiceEntries), []);
  const [audioState, setAudioState] = useState(audio.state);
  const [manualPaused, setManualPaused] = useState(false);
  const [resumedPauseRequest, setResumedPauseRequest] = useState(pauseRequest);
  const requestedPause = resumedPauseRequest !== pauseRequest;
  const [needsResume, setNeedsResume] = useState(false);
  const [hidden, setHidden] = useState(document.hidden);
  const [artOpen, setArtOpen] = useState(false);
  const [voiceDone, setVoiceDone] = useState<string>();
  const [feedback, setFeedback] = useState<{ id: string; text: string }>();
  const [replayCounter, setReplayCounter] = useState(0);
  const [moreBelow, setMoreBelow] = useState(false);
  const readerRef = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ x: number; y: number; scroll: number; time: number } | undefined>(undefined);
  const pendingTap = useRef<number | undefined>(undefined);
  const portrait = usePortrait();
  const paused = panelOpen || artOpen || hidden || needsResume || manualPaused || requestedPause || replayComplete;
  const lineText = node?.type === 'line' ? node.text : node?.type === 'choice' ? node.prompt : node?.text ?? '';
  const reduced = settings.reducedMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const typewriter = useTypewriter(lineText, node?.id ?? '', reduced ? 0 : settings.textSpeedMs, paused);
  const hasVoice = node?.type === 'line' && audio.hasVoice(node.id);
  const measurePassage = useCallback(() => {
    const element = readerRef.current;
    setMoreBelow(Boolean(element && element.scrollHeight - element.scrollTop - element.clientHeight > 8));
  }, [setMoreBelow]);
  useEffect(() => {
    const frame = requestAnimationFrame(measurePassage);
    const element = readerRef.current;
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(measurePassage);
    if (element) observer?.observe(element);
    return () => { cancelAnimationFrame(frame); observer?.disconnect(); };
  }, [measurePassage, typewriter.text, settings.textSize, node?.id]);

  useEffect(() => audio.subscribe(setAudioState), [audio]);
  useEffect(() => {
    const visibility = () => {
      setHidden(document.hidden);
      if (document.hidden) setNeedsResume(true);
    };
    document.addEventListener('visibilitychange', visibility);
    return () => document.removeEventListener('visibilitychange', visibility);
  }, []);
  useEffect(() => { audio.setVolume(settings.volume); }, [audio, settings.volume]);
  useEffect(() => { audio.setMuted(settings.muted); }, [audio, settings.muted]);

  useEffect(() => {
    audio.stop();
    if (node?.type !== 'line' || settings.muted || replayComplete || !audio.hasVoice(node.id)) return;
    let cancelled = false;
    queueMicrotask(() => { if (!cancelled) { setVoiceDone(undefined); setFeedback(undefined); } });
    void audio.playLine(node.id).then(result => {
      if (cancelled || result.status === 'stopped') return;
      if (result.status === 'ended') setVoiceDone(`${node.id}:${replayCounter}`);
      else setFeedback({ id: node.id, text: result.status === 'blocked'
        ? 'Tap Play to hear this passage.' : 'Voice unavailable; subtitles remain active.' });
    });
    return () => { cancelled = true; audio.stop(); };
  }, [audio, node?.id, node?.type, settings.muted, replayCounter, replayComplete]);
  useEffect(() => {
    if (paused) audio.pause();
    else if (audio.state === 'paused') void audio.resume();
  }, [audio, paused, node?.id, settings.muted, replayCounter]);
  useEffect(() => () => audio.dispose(), [audio]);
  useEffect(() => { if (readerRef.current) readerRef.current.scrollTop = 0; }, [node?.id]);
  useEffect(() => {
    const cancelTap = () => { clearTimeout(pendingTap.current); pendingTap.current = undefined; };
    const selectionChanged = () => { if (window.getSelection()?.toString()) cancelTap(); };
    document.addEventListener('selectionchange', selectionChanged);
    return () => { cancelTap(); document.removeEventListener('selectionchange', selectionChanged); };
  }, [node?.id, paused]);

  const { complete, reveal } = typewriter;
  const manualAdvance = useCallback(() => {
    clearTimeout(pendingTap.current); pendingTap.current = undefined;
    if (paused || node?.type !== 'line') return;
    updateSettings({ autoMode: false, skipSeen: false });
    if (!complete) reveal();
    else { audio.stop(); dispatch({ type: 'ADVANCE' }); }
  }, [paused, node?.type, updateSettings, complete, reveal, audio, dispatch]);
  const automaticAdvance = useCallback(() => { audio.stop(); dispatch({ type: 'ADVANCE' }); }, [audio, dispatch]);
  const skipping = node?.type === 'line' && settings.skipSeen && state.seenNodeIds.includes(node.id);
  const voiceToken = `${node?.id}:${replayCounter}`;
  const voiceFailed = audioState === 'blocked' || audioState === 'error';
  const textTiming = settings.muted || !hasVoice || voiceFailed;
  const canAuto = node?.type === 'line' && settings.autoMode && typewriter.complete
    && !skipping && (textTiming || voiceDone === voiceToken);
  const readingDelay = Math.max(1500, lineText.trim().split(/\s+/).length * 230);
  useReadingTimer(`${sessionMode}:${node?.id}:skip`, 120, Boolean(skipping), paused, automaticAdvance);
  useReadingTimer(`${sessionMode}:${voiceToken}:auto`, textTiming ? readingDelay : 500, Boolean(canAuto), paused, automaticAdvance);

  const playPause = () => {
    if (needsResume || manualPaused || requestedPause) {
      setNeedsResume(false); setManualPaused(false); setResumedPauseRequest(pauseRequest); return;
    }
    if (settings.muted) { updateSettings({ muted: false }); return; }
    if (audioState === 'playing' || audioState === 'loading') setManualPaused(true);
    else if (audioState === 'paused') void audio.resume();
    else setReplayCounter(value => value + 1);
  };
  const replayVoice = () => {
    setManualPaused(false); setNeedsResume(false);
    setResumedPauseRequest(pauseRequest);
    updateSettings({ muted: false });
    setReplayCounter(value => value + 1);
  };
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || event.altKey || event.ctrlKey || event.metaKey || paused) return;
      if (event.target instanceof Element && event.target.closest('button,input,select,textarea,a,summary,[contenteditable="true"]')) return;
      if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); manualAdvance(); }
      else if (event.key.toLowerCase() === 'h') { event.preventDefault(); onOpenPanel('history'); }
      else if (event.key.toLowerCase() === 'a') { event.preventDefault(); updateSettings({ autoMode: !settings.autoMode, skipSeen: false }); }
    };
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  }, [paused, manualAdvance, onOpenPanel, updateSettings, settings.autoMode]);

  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (pendingTap.current !== undefined) {
      clearTimeout(pendingTap.current); pendingTap.current = undefined; gesture.current = undefined;
      return; // A second tap belongs to the browser's text-selection gesture.
    }
    if (event.button !== 0 || node?.type !== 'line' || (event.target as Element).closest('button,a,input,select')) return;
    gesture.current = { x: event.clientX, y: event.clientY, scroll: event.currentTarget.scrollTop, time: performance.now() };
  };
  const pointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = gesture.current; gesture.current = undefined;
    if (!start || (event.target as Element).closest('button,a,input,select')) return;
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8
      || Math.abs(event.currentTarget.scrollTop - start.scroll) > 1
      || performance.now() - start.time > 450 || window.getSelection()?.toString()) return;
    pendingTap.current = window.setTimeout(() => {
      pendingTap.current = undefined;
      if (!window.getSelection()?.toString()) manualAdvance();
    }, 300);
  };

  if (!node) return <main id="main-content"><p>The saved passage is unavailable.</p><button onClick={onTitle}>Return to title</button></main>;
  const chapter = story.chapters.find(item => item.id === node.chapterId);
  const speaker = node.type === 'line' ? story.speakers.find(item => item.id === node.speakerId)?.name : undefined;
  const background = getAssetEntry(node.stage.backgroundId);
  const viewingArt = (portrait ? background?.mobile : undefined) ?? background;
  const ending = node.type === 'end' || replayComplete;
  const voiceLabel = needsResume || manualPaused || requestedPause ? 'Resume reading'
    : settings.muted ? 'Enable voices' : audioState === 'playing' || audioState === 'loading' ? 'Pause voice' : 'Play voice';

  return <main id="main-content" className={styles.reader} data-reduced-motion={reduced} data-ended={ending} data-choice={node.type === 'choice'} data-replay={sessionMode === 'replay' && !ending}
    style={{ '--reading-size': `${(settings.textSize ?? 18) / 16}rem` } as CSSProperties}>
    <header className={styles.header}>
      <button className={styles.headerButton} onClick={() => onOpenPanel('menu')} aria-label="Open reading menu">
        <span aria-hidden="true">☰</span>
      </button>
      <button className={styles.chapterHeading} onClick={() => onOpenPanel('chapters')} aria-label="Open chapter menu">
        <span>{sessionMode === 'replay' ? 'Chapter replay' : chapter?.period}</span><strong>{chapter?.title}</strong>
      </button>
      {sessionMode === 'replay' && !ending && <button className={`${styles.control} ${styles.returnMain}`}
        onClick={() => returnToMain()} aria-label="Return to main story" title="Return to main story">
        <span aria-hidden="true">↩</span><span>Main</span>
      </button>}
      <button className={styles.headerButton} onClick={() => setArtOpen(true)} aria-label="View artwork" disabled={!background}>
        <span aria-hidden="true">⛶</span>
      </button>
    </header>
    <ReadingStage node={node} reducedMotion={reduced} />
    {ending ? <section className={styles.ending} aria-label={replayComplete ? 'Replay complete' : node.type === 'end' ? node.title : 'The End'}>
      <p className={styles.eyebrow}>{story.title}</p>
      <h1>{replayComplete ? 'Chapter revisited' : node.type === 'end' ? node.title : 'The End'}</h1>
      <p>{replayComplete ? 'Your main story is waiting exactly where you left it.' : node.type === 'end' ? node.text : ''}</p>
      <div className={styles.endActions}>
        {sessionMode === 'replay' && <button className={styles.primary} onClick={() => returnToMain()}>Return to main story</button>}
        <button className={sessionMode === 'replay' ? styles.control : styles.primary} onClick={onTitle}>Return to title</button>
        <button className={styles.control} onClick={() => onOpenPanel('chapters')}>Chapter select</button>
      </div>
    </section> : <section className={styles.readingPanel} aria-label={node.type === 'choice' ? 'Choice' : 'Dialogue'}>
      <div className={styles.passageHeader}>
        <p className={styles.speaker}>{speaker ?? (node.type === 'choice' ? 'A moment to reflect' : 'Return to Me')}
          {moreBelow && <span className={styles.scrollHint}>More below ↓</span>}</p>
        {hasVoice && <button className={styles.replayButton} disabled={panelOpen || artOpen || hidden}
          onClick={replayVoice} aria-label="Replay voice">Replay <span aria-hidden="true">↻</span></button>}
      </div>
      <div ref={readerRef} className={styles.passage} tabIndex={0} aria-label="Passage text"
        onScroll={() => { clearTimeout(pendingTap.current); pendingTap.current = undefined; measurePassage(); }}
        onPointerDown={pointerDown} onPointerUp={pointerUp} onPointerCancel={() => { gesture.current = undefined; }}>
        <p className={common.srOnly} aria-live="polite" aria-atomic="true">{speaker ? `${speaker}: ` : ''}{lineText}</p>
        <p className={styles.text} aria-hidden="true">{typewriter.text}</p>
        {node.type === 'choice' && <div className={styles.choices}>
          {node.choices.map((option, index) => <button key={option.id} disabled={paused} onClick={() => {
            updateSettings({ autoMode: false, skipSeen: false });
            dispatch({ type: 'CHOOSE', optionId: option.id });
          }}><span aria-hidden="true">{index + 1}</span><span>{option.label}</span></button>)}
        </div>}
      </div>
      {feedback?.id === node.id && voiceFailed && <p className={styles.feedback} role="status">{feedback.text}</p>}
      {needsResume && <p className={styles.feedback} role="status">Paused while you were away. Resume when you’re ready.</p>}
      {storageMessage && <p className={styles.saveWarning} role="status">{storageMessage} Your place may not survive closing this browser.</p>}
      <nav className={styles.controls} aria-label="Reading controls">
        <button className={styles.control} onClick={() => onOpenPanel('history')}><span aria-hidden="true">≡</span><span>History</span></button>
        <button className={styles.control} onClick={playPause} aria-label={voiceLabel} disabled={!hasVoice && !needsResume && !manualPaused && !requestedPause}>
          <span aria-hidden="true">{voiceLabel.startsWith('Pause') ? 'Ⅱ' : '▷'}</span><span>{audioState === 'loading' ? 'Loading' : voiceLabel.startsWith('Pause') ? 'Pause' : needsResume || manualPaused || requestedPause ? 'Resume' : 'Play'}</span>
        </button>
        <button className={styles.control} aria-label={`Auto ${settings.autoMode ? 'on' : 'off'}`} aria-pressed={settings.autoMode}
          onClick={() => updateSettings({ autoMode: !settings.autoMode, skipSeen: false })}><span aria-hidden="true">∞</span><span>Auto</span></button>
        <button className={styles.next} disabled={paused || node.type !== 'line'} onClick={manualAdvance}
          aria-label={node.type === 'choice' ? 'Choose a response' : typewriter.complete ? 'Advance dialogue' : 'Reveal full line'}>
          {node.type === 'choice' ? 'Choose' : typewriter.complete ? 'Next' : 'Reveal'}<span aria-hidden="true"> →</span>
        </button>
      </nav>
    </section>}
    {artOpen && <Modal title="Artwork" onClose={() => setArtOpen(false)} wide>
      {viewingArt && <img className={styles.fullArt} src={getArtUrl(viewingArt.url)} alt={background?.alt ?? 'Current story illustration'}
        width={viewingArt.width} height={viewingArt.height} />}
      <p className={styles.artCaption}>{background?.alt}</p>
    </Modal>}
  </main>;
}
