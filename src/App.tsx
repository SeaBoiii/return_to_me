import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AudioManager,
  getCurrentNode,
  getDialogueHistory,
  type OfflinePackManifest,
  type StagePosition,
  type StageTransition,
  type StoryNode,
} from "./engine";
import {
  createInstallPromptController,
  OfflinePackCancelledError,
  OfflinePackManager,
  type InstallAvailability,
  type OfflinePackStatus,
  registerReturnToMeServiceWorker,
  type ServiceWorkerUpdateState,
} from "./pwa";
import { story } from "./story";
import { getAssetEntry } from "./art/manifest";
import {
  offlinePackManifests,
  productionVoiceManifest,
  voiceEntries,
  voiceProfiles,
} from "./voices";
import { Modal } from "./app/Modal";
import { useStory } from "./app/StoryContext";
import styles from "./app/App.module.css";

type Panel =
  | "chapters"
  | "history"
  | "settings"
  | "offline"
  | "credits"
  | "help"
  | null;

const speakerNames = new Map<string, string>(
  story.speakers.map((speaker) => [speaker.id, speaker.name]),
);

const positionMap: Record<
  Exclude<StagePosition, { readonly x: number; readonly y: number }>,
  { x: number; y: number }
> = {
  "far-left": { x: 10, y: 100 },
  left: { x: 28, y: 100 },
  center: { x: 50, y: 100 },
  right: { x: 72, y: 100 },
  "far-right": { x: 90, y: 100 },
};
const stageTransitionClasses: Record<StageTransition, string> = {
  none: styles.stageTransitionNone!,
  cut: styles.stageTransitionCut!,
  fade: styles.stageTransitionFade!,
  dissolve: styles.stageTransitionDissolve!,
  slide: styles.stageTransitionSlide!,
};

function stagePositionStyle(
  position: StagePosition,
  layer = 1,
  flipHorizontal = false,
): CSSProperties {
  const point =
    typeof position === "string" ? positionMap[position] : position;
  return {
    left: `${point.x}%`,
    bottom: `${100 - point.y}%`,
    zIndex: layer,
    transform: `translateX(-50%)${flipHorizontal ? " scaleX(-1)" : ""}`,
  };
}

function Stage({ node, reducedMotion }: { node: StoryNode; reducedMotion: boolean }) {
  const background = getAssetEntry(node.stage.backgroundId);

  return (
    <figure
      className={`${styles.stage} ${
        reducedMotion
          ? styles.noMotion
          : stageTransitionClasses[node.stage.transition]
      }`}
      data-transition={node.stage.transition}
      aria-label={`Scene: ${node.stage.mood}`}
    >
      {background !== undefined ? (
        <img
          className={styles.background}
          src={background.url}
          alt=""
          width={background.width}
          height={background.height}
          style={{
            objectPosition: `${background.focalPoint.x * 100}% ${
              background.focalPoint.y * 100
            }%`,
          }}
          draggable={false}
        />
      ) : (
        <div className={styles.missingBackground} aria-hidden="true" />
      )}

      <div className={styles.sceneTint} data-mood={node.stage.mood} />

      <div className={styles.spriteLayer} aria-hidden="true">
        {node.stage.sprites.map((sprite) => {
          const asset = getAssetEntry(sprite.assetId);
          if (asset === undefined) {
            return null;
          }
          const isSpeaker =
            node.type !== "line" ||
            node.speakerId === null ||
            node.speakerId === sprite.characterId ||
            node.speakerId === "adult-aleem";
          const facing = sprite.facing ?? "right";
          const flipHorizontal =
            (facing === "left") !== (sprite.mirror ?? false);
          return (
            <img
              key={sprite.id}
              className={`${styles.sprite} ${
                isSpeaker ? styles.spriteFocused : styles.spriteResting
              }`}
              src={asset.url}
              alt=""
              width={asset.width}
              height={asset.height}
              style={{
                ...stagePositionStyle(
                  sprite.position,
                  sprite.layer,
                  flipHorizontal,
                ),
                objectPosition: `${asset.focalPoint.x * 100}% ${
                  asset.focalPoint.y * 100
                }%`,
              }}
              data-facing={facing}
              data-mirrored={flipHorizontal ? "true" : "false"}
              draggable={false}
            />
          );
        })}
      </div>

      {node.stage.overlay !== undefined && (
        <section
          className={`${styles.stageOverlay} ${
            styles[`overlay_${node.stage.overlay.kind}`]
          }`}
          aria-label={node.stage.overlay.label}
        >
          {node.stage.overlay.title !== undefined && (
            <h3>{node.stage.overlay.title}</h3>
          )}
          {node.stage.overlay.lines.map((line, index) => (
            <p key={`${line}-${index}`}>{line}</p>
          ))}
        </section>
      )}
      <figcaption className={styles.srOnly}>{node.stage.mood}</figcaption>
    </figure>
  );
}

function useTypewriter(
  text: string,
  nodeId: string,
  speedMs: number,
  reducedMotion: boolean,
) {
  const effectiveSpeed = reducedMotion ? 0 : speedMs;
  const [progress, setProgress] = useState({
    nodeId,
    visibleCharacters: effectiveSpeed === 0 ? text.length : 0,
  });
  const visibleCharacters =
    effectiveSpeed === 0
      ? text.length
      : progress.nodeId === nodeId
        ? progress.visibleCharacters
        : 0;

  useEffect(() => {
    if (effectiveSpeed === 0) {
      return;
    }

    const interval = window.setInterval(() => {
      setProgress((current) => {
        const count =
          current.nodeId === nodeId ? current.visibleCharacters : 0;
        if (count >= text.length) {
          window.clearInterval(interval);
          return { nodeId, visibleCharacters: text.length };
        }
        return { nodeId, visibleCharacters: count + 1 };
      });
    }, effectiveSpeed);
    return () => window.clearInterval(interval);
  }, [effectiveSpeed, nodeId, text]);

  return {
    visibleText: text.slice(0, visibleCharacters),
    complete: visibleCharacters >= text.length,
    reveal: () => setProgress({ nodeId, visibleCharacters: text.length }),
  };
}

function Notice({ onContinue }: { onContinue: () => void }) {
  return (
    <Modal
      title="A note before we begin"
      eyebrow="Inspired by real events"
    >
      <div className={styles.noticeCopy}>
        <p>
          Names, dialogue, schools, and some details have been fictionalised.
          This is a reflective retelling, not a complete portrait of any real
          person.
        </p>
        <div className={styles.contentNote}>
          <span>Content note</span>
          <p>
            Relationship breakdown, academic disappointment, and a period of
            emotional withdrawal. Exact examination grades are not shown.
          </p>
        </div>
        <p className={styles.smallPrint}>
          The young characters are portrayed in age-appropriate,
          nonsexualised scenes.
        </p>
      </div>
      <button
        className={styles.primaryButton}
        type="button"
        onClick={onContinue}
        autoFocus
      >
        Continue to title
      </button>
    </Modal>
  );
}

interface TitleScreenProps {
  readonly unlockedChapters: readonly string[];
  readonly canContinue: boolean;
  readonly storageMessage?: string;
  readonly installState: InstallAvailability;
  readonly onNewGame: () => void;
  readonly onContinue: () => void;
  readonly onOpenPanel: (panel: Exclude<Panel, null>) => void;
  readonly onInstall: () => void;
}

function TitleScreen({
  unlockedChapters,
  canContinue,
  storageMessage,
  installState,
  onNewGame,
  onContinue,
  onOpenPanel,
  onInstall,
}: TitleScreenProps) {
  const dawn = getAssetEntry("bg-dawn-window");
  return (
    <main id="main-content" className={styles.titleScreen}>
      {dawn !== undefined && (
        <img
          className={styles.titleBackground}
          src={dawn.url}
          alt=""
          width={dawn.width}
          height={dawn.height}
          style={{
            objectPosition: `${dawn.focalPoint.x * 100}% ${
              dawn.focalPoint.y * 100
            }%`,
          }}
        />
      )}
      <div className={styles.titleWash} />
      <div className={styles.titleContent}>
        <div className={styles.titleMark} aria-hidden="true">
          <span />
          <i />
          <span />
        </div>
        <p className={styles.titleKicker}>A reflective visual novel</p>
        <h1>
          Return <em>to</em> Me
        </h1>
        <p className={styles.subtitle}>The School Years</p>
        <p className={styles.titleSummary}>
          Before Nurul, there were school corridors, glowing screens, first
          loves—and the difficult work of becoming.
        </p>

        {storageMessage !== undefined && (
          <p className={styles.warning} role="status">
            {storageMessage} Progress will continue for this session.
          </p>
        )}

        <div className={styles.titleActions}>
          <button
            className={styles.primaryButton}
            type="button"
            onClick={onNewGame}
          >
            New Game
          </button>
          <button
            className={styles.secondaryButton}
            type="button"
            onClick={onContinue}
            disabled={!canContinue}
          >
            Continue
          </button>
        </div>

        <nav className={styles.titleNav} aria-label="Game options">
          <button
            type="button"
            onClick={() => onOpenPanel("chapters")}
            disabled={unlockedChapters.length === 0}
          >
            Chapters
          </button>
          <button type="button" onClick={() => onOpenPanel("settings")}>
            Settings
          </button>
          <button type="button" onClick={() => onOpenPanel("offline")}>
            Offline &amp; install
          </button>
          <button type="button" onClick={() => onOpenPanel("credits")}>
            Credits
          </button>
        </nav>

        {installState === "available" && (
          <button
            className={styles.installPill}
            type="button"
            onClick={onInstall}
          >
            Install app
          </button>
        )}
        {installState === "installed" && (
          <p className={styles.installedPill}>Installed for offline play</p>
        )}
      </div>
      <p className={styles.titleFooter}>
        Singapore · 2009–2013 <span aria-hidden="true">•</span> No analytics
      </p>
    </main>
  );
}

interface GameScreenProps {
  readonly onTitle: () => void;
  readonly onOpenPanel: (panel: Exclude<Panel, null>) => void;
}

function GameScreen({ onTitle, onOpenPanel }: GameScreenProps) {
  const { state, settings, dispatch, updateSettings } = useStory();
  const node = getCurrentNode(story, state);
  const audio = useMemo(() => new AudioManager(voiceEntries), []);
  const playbackRef = useRef<ReturnType<AudioManager["playLine"]> | undefined>(
    undefined,
  );
  const [voiceFeedback, setVoiceFeedback] = useState<
    { readonly nodeId: string; readonly message: string } | undefined
  >(undefined);

  const lineText =
    node?.type === "line"
      ? node.text
      : node?.type === "choice"
        ? node.prompt
        : node?.text ?? "";
  const typewriter = useTypewriter(
    lineText,
    node?.id ?? "none",
    settings.textSpeedMs,
    settings.reducedMotion,
  );

  useEffect(() => {
    audio.setVolume(settings.volume);
  }, [audio, settings.volume]);

  useEffect(() => {
    audio.setMuted(settings.muted);
  }, [audio, settings.muted]);

  useEffect(() => {
    audio.stop();
    if (node?.type === "line" && audio.hasVoice(node.id)) {
      playbackRef.current = audio.playLine(node.id);
      void playbackRef.current.then((result) => {
        if (result.status === "blocked") {
          setVoiceFeedback({
            nodeId: node.id,
            message: "Select replay to enable voice playback.",
          });
        } else if (result.status === "error") {
          setVoiceFeedback({
            nodeId: node.id,
            message: "Voice unavailable; subtitles remain active.",
          });
        }
      });
    } else {
      playbackRef.current = undefined;
    }
    return () => audio.stop();
  }, [audio, node]);

  const advance = useCallback(() => {
    if (node?.type !== "line") {
      return;
    }
    if (!typewriter.complete) {
      typewriter.reveal();
      return;
    }
    audio.stop();
    dispatch({ type: "ADVANCE" });
  }, [audio, dispatch, node, typewriter]);

  useEffect(() => {
    const handleShortcut = (event: globalThis.KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.repeat ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        document.querySelector("[role='dialog']") !== null
      ) {
        return;
      }

      const target = event.target;
      if (
        target instanceof Element &&
        target.closest(
          "button, input, select, textarea, a, summary, [role='button'], [role='link'], [contenteditable='true']",
        ) !== null
      ) {
        return;
      }

      const key = event.key.toLowerCase();
      if (
        node?.type === "line" &&
        (event.key === "Enter" || event.key === " " || event.code === "Space")
      ) {
        event.preventDefault();
        advance();
      } else if (key === "h") {
        event.preventDefault();
        onOpenPanel("history");
      } else if (key === "a") {
        event.preventDefault();
        updateSettings({ autoMode: !settings.autoMode });
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [advance, node?.type, onOpenPanel, settings.autoMode, updateSettings]);

  useEffect(() => {
    if (
      node?.type !== "line" ||
      !settings.skipSeen ||
      !state.seenNodeIds.includes(node.id)
    ) {
      return;
    }

    const timeout = window.setTimeout(() => {
      audio.stop();
      dispatch({ type: "ADVANCE" });
    }, 120);
    return () => window.clearTimeout(timeout);
  }, [audio, dispatch, node, settings.skipSeen, state.seenNodeIds]);

  useEffect(() => {
    if (
      node?.type !== "line" ||
      !settings.autoMode ||
      !typewriter.complete ||
      (settings.skipSeen && state.seenNodeIds.includes(node.id))
    ) {
      return;
    }

    let cancelled = false;
    const waitForReading = async () => {
      const words = node.text.trim().split(/\s+/).length;
      await new Promise<void>((resolve) => {
        window.setTimeout(
          resolve,
          Math.min(5_500, Math.max(1_200, words * 190)),
        );
      });
    };
    const continueAfterVoice = async () => {
      const playback = playbackRef.current;
      if (playback === undefined) {
        await waitForReading();
      } else {
        const result = await playback;
        if (result.status === "stopped") {
          return;
        }
        if (
          result.status === "blocked" ||
          result.status === "error" ||
          result.status === "missing"
        ) {
          await waitForReading();
        }
      }
      if (!cancelled) {
        dispatch({ type: "ADVANCE" });
      }
    };
    void continueAfterVoice();
    return () => {
      cancelled = true;
    };
  }, [
    dispatch,
    node,
    settings.autoMode,
    settings.skipSeen,
    state.seenNodeIds,
    typewriter.complete,
  ]);

  useEffect(() => () => audio.dispose(), [audio]);

  if (node === undefined) {
    return (
      <main className={styles.fatalState}>
        <h1>We lost our place.</h1>
        <p>The current story node could not be restored safely.</p>
        <button className={styles.primaryButton} type="button" onClick={onTitle}>
          Return to title
        </button>
      </main>
    );
  }

  const chapter = story.chapters.find(
    (candidate) => candidate.id === node.chapterId,
  );
  const speaker =
    node.type === "line" && node.speakerId !== null
      ? speakerNames.get(node.speakerId)
      : undefined;
  const hasVoice = node.type === "line" && audio.hasVoice(node.id);


  return (
    <main
      id="main-content"
      className={styles.gameScreen}
    >
      <Stage
        key={node.id}
        node={node}
        reducedMotion={settings.reducedMotion}
      />

      <header className={styles.gameHeader}>
        <button
          className={styles.menuButton}
          type="button"
          onClick={() => onOpenPanel("chapters")}
          aria-label="Open chapter menu"
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
        <div className={styles.chapterTitle}>
          <span>{chapter?.period}</span>
          <strong>{chapter?.title}</strong>
        </div>
        <button
          className={styles.titleReturn}
          type="button"
          onClick={onTitle}
        >
          Title
        </button>
      </header>

      <div className={styles.quickControls} aria-label="Reading controls">
        <button
          type="button"
          aria-pressed={settings.autoMode}
          onClick={() =>
            updateSettings({ autoMode: !settings.autoMode })
          }
          title="Auto mode (A)"
        >
          Auto <span>{settings.autoMode ? "on" : "off"}</span>
        </button>
        <button
          type="button"
          aria-pressed={settings.skipSeen}
          onClick={() =>
            updateSettings({ skipSeen: !settings.skipSeen })
          }
          title="Skip previously seen text"
        >
          Skip <span>{settings.skipSeen ? "on" : "off"}</span>
        </button>
      </div>

      {node.type === "end" ? (
        <section className={styles.endCard} aria-labelledby="ending-title">
          <p className={styles.eyebrow}>End of The School Years</p>
          <h1 id="ending-title">{node.title}</h1>
          {node.text !== undefined && <p>{node.text}</p>}
          <div className={styles.endActions}>
            <button
              className={styles.primaryButton}
              type="button"
              onClick={onTitle}
            >
              Return to title
            </button>
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={() => onOpenPanel("chapters")}
            >
              Chapter select
            </button>
          </div>
        </section>
      ) : (
        <section
          className={styles.dialogueArea}
          aria-label={node.type === "choice" ? "Choice" : "Dialogue"}
        >
          <div className={styles.dialogueToolbar}>
            <button
              type="button"
              onClick={() => onOpenPanel("history")}
              title="Dialogue history (H)"
            >
              History
            </button>
            <button
              type="button"
              onClick={() => {
                if (node.type === "line" && hasVoice) {
                  void audio.playLine(node.id);
                }
              }}
              disabled={!hasVoice}
              title={
                hasVoice
                  ? "Replay this line"
                  : "No voice clip is included for this line"
              }
            >
              Replay voice
            </button>
            <button type="button" onClick={() => onOpenPanel("settings")}>
              Settings
            </button>
            <button type="button" onClick={() => onOpenPanel("help")}>
              Keys
            </button>
          </div>

          <div className={styles.dialogueBox}>
            {speaker !== undefined && (
              <p className={styles.speakerName}>{speaker}</p>
            )}
            <p className={styles.srOnly} aria-live="polite" aria-atomic="true">
              {speaker === undefined ? "" : `${speaker}: `}
              {lineText}
            </p>
            <p className={styles.dialogueText} aria-hidden="true">
              {typewriter.visibleText}
              {!typewriter.complete && (
                <span className={styles.textCursor} aria-hidden="true" />
              )}
            </p>

            {node.type === "choice" ? (
              <div className={styles.choices}>
                {node.choices.map((option, index) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() =>
                      dispatch({ type: "CHOOSE", optionId: option.id })
                    }
                  >
                    <span aria-hidden="true">{index + 1}</span>
                    {option.label}
                  </button>
                ))}
              </div>
            ) : (
              <button
                className={styles.advanceButton}
                type="button"
                onClick={advance}
                aria-label={
                  typewriter.complete ? "Advance dialogue" : "Reveal full line"
                }
              >
                <span aria-hidden="true">›</span>
              </button>
            )}
          </div>
          {voiceFeedback?.nodeId === node.id && (
            <p className={styles.voiceStatus} role="status">
              {voiceFeedback.message}
            </p>
          )}
        </section>
      )}
    </main>
  );
}

function ChapterPanel({
  unlocked,
  onSelect,
  onClose,
}: {
  readonly unlocked: readonly string[];
  readonly onSelect: (chapterId: string) => void;
  readonly onClose: () => void;
}) {
  return (
    <Modal
      title="Chapter select"
      eyebrow="The School Years"
      onClose={onClose}
    >
      <ol className={styles.chapterList}>
        {story.chapters.map((chapter, index) => {
          const available = unlocked.includes(chapter.id);
          return (
            <li key={chapter.id}>
              <button
                type="button"
                disabled={!available}
                onClick={() => onSelect(chapter.id)}
              >
                <span>{String(index).padStart(2, "0")}</span>
                <span>
                  <strong>{chapter.title}</strong>
                  <small>{chapter.period}</small>
                </span>
                <i aria-hidden="true">{available ? "›" : "Locked"}</i>
              </button>
            </li>
          );
        })}
      </ol>
      <p className={styles.panelHint}>
        Chapters unlock naturally as you reach them. Choices change immediate
        dialogue and later recollections, but every route returns to the true
        milestones.
      </p>
    </Modal>
  );
}

function HistoryPanel({ onClose }: { readonly onClose: () => void }) {
  const { state } = useStory();
  const history = getDialogueHistory(story, state.history);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => endRef.current?.scrollIntoView({ block: "end" }), []);

  return (
    <Modal title="Dialogue history" onClose={onClose} wide>
      {history.length === 0 ? (
        <p className={styles.emptyState}>No completed dialogue yet.</p>
      ) : (
        <div className={styles.historyList}>
          {history.map((item) => (
            <article key={item.id} data-kind={item.kind}>
              <p>{item.speaker ?? (item.kind === "choice" ? "You chose" : "Narration")}</p>
              <blockquote>{item.text}</blockquote>
            </article>
          ))}
          <div ref={endRef} />
        </div>
      )}
    </Modal>
  );
}

function SettingsPanel({
  onClose,
  onReset,
}: {
  readonly onClose: () => void;
  readonly onReset: () => void;
}) {
  const { settings, updateSettings, resetProgress, savedProgress } = useStory();
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <Modal title="Settings" onClose={onClose}>
      <div className={styles.settingsGrid}>
        <label>
          <span>
            Text speed <small>{settings.textSpeedMs === 0 ? "Instant" : `${settings.textSpeedMs} ms`}</small>
          </span>
          <input
            type="range"
            min="0"
            max="60"
            step="6"
            value={settings.textSpeedMs}
            onChange={(event) =>
              updateSettings({ textSpeedMs: Number(event.currentTarget.value) })
            }
          />
        </label>
        <label>
          <span>
            Voice volume <small>{Math.round(settings.volume * 100)}%</small>
          </span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.volume}
            onChange={(event) =>
              updateSettings({ volume: Number(event.currentTarget.value) })
            }
          />
        </label>
        <label className={styles.toggleRow}>
          <span>
            Mute voices
            <small>Subtitles always remain visible</small>
          </span>
          <input
            type="checkbox"
            checked={settings.muted}
            onChange={(event) =>
              updateSettings({ muted: event.currentTarget.checked })
            }
          />
        </label>
        <label className={styles.toggleRow}>
          <span>
            Auto mode
            <small>Advance after speech or reading time</small>
          </span>
          <input
            type="checkbox"
            checked={settings.autoMode}
            onChange={(event) =>
              updateSettings({ autoMode: event.currentTarget.checked })
            }
          />
        </label>
        <label className={styles.toggleRow}>
          <span>
            Skip seen text
            <small>Only lines completed before are skipped</small>
          </span>
          <input
            type="checkbox"
            checked={settings.skipSeen}
            onChange={(event) =>
              updateSettings({ skipSeen: event.currentTarget.checked })
            }
          />
        </label>
        <label className={styles.toggleRow}>
          <span>
            Reduce motion
            <small>Disables scene and interface transitions</small>
          </span>
          <input
            type="checkbox"
            checked={settings.reducedMotion}
            onChange={(event) =>
              updateSettings({ reducedMotion: event.currentTarget.checked })
            }
          />
        </label>
      </div>

      <div className={styles.dangerZone}>
        {!confirmReset ? (
          <button
            type="button"
            className={styles.textButton}
            disabled={savedProgress.status !== "ok"}
            onClick={() => setConfirmReset(true)}
          >
            Reset story progress
          </button>
        ) : (
          <div role="alert">
            <p>Delete this browser’s save and chapter unlocks?</p>
            <button
              className={styles.dangerButton}
              type="button"
              onClick={() => {
                resetProgress();
                setConfirmReset(false);
                onReset();
              }}
            >
              Yes, reset
            </button>
            <button type="button" onClick={() => setConfirmReset(false)}>
              Cancel
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

const formatBytes = (bytes: number): string => {
  if (bytes <= 0) {
    return "Size pending";
  }
  const megabytes = bytes / (1024 * 1024);
  return `${megabytes >= 10 ? megabytes.toFixed(0) : megabytes.toFixed(1)} MB`;
};

function PackRow({
  manifest,
  manager,
}: {
  readonly manifest: OfflinePackManifest;
  readonly manager: OfflinePackManager;
}) {
  const [status, setStatus] = useState<OfflinePackStatus>({
    packId: manifest.id,
    state: "checking",
    cachedFiles: 0,
    totalFiles: manifest.voiceUrls.length,
    cachedBytes: 0,
    expectedBytes: manifest.expectedBytes,
  });

  useEffect(() => {
    let active = true;
    void manager.status(manifest).then((next) => {
      if (active) {
        setStatus(next);
      }
    });
    const unsubscribe = manager.subscribe((next) => {
      if (next.packId === manifest.id) {
        setStatus(next);
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [manager, manifest]);

  const progress =
    status.totalFiles === 0
      ? 0
      : Math.round((status.cachedFiles / status.totalFiles) * 100);
  const isDownloading = status.state === "downloading";

  return (
    <article className={styles.packRow}>
      <div>
        <h3>{manifest.title}</h3>
        <p>
          {formatBytes(manifest.expectedBytes)} · {status.cachedFiles}/
          {status.totalFiles} clips
        </p>
      </div>
      <progress max="100" value={progress}>
        {progress}%
      </progress>
      <p className={styles.packStatus} role="status">
        {status.state.replace("-", " ")}
        {status.error === undefined ? "" : ` — ${status.error}`}
      </p>
      <div className={styles.packActions}>
        {isDownloading ? (
          <button type="button" onClick={() => manager.cancel(manifest.id)}>
            Cancel
          </button>
        ) : status.state === "ready" ? (
          <>
            <button
              type="button"
              onClick={() => void manager.verify(manifest)}
            >
              Verify
            </button>
            <button
              type="button"
              onClick={() => void manager.remove(manifest)}
            >
              Remove
            </button>
          </>
        ) : status.state === "error" || status.state === "partial" ? (
          <>
            <button
              type="button"
              onClick={() => {
                void manager
                  .download(manifest)
                  .catch((error: unknown) => {
                    if (!(error instanceof OfflinePackCancelledError)) {
                      setStatus((current) => ({
                        ...current,
                        state: "error",
                        error:
                          error instanceof Error
                            ? error.message
                            : "Download failed.",
                      }));
                    }
                  });
              }}
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => void manager.remove(manifest)}
            >
              Remove
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => {
              void manager
                .download(manifest)
                .catch((error: unknown) => {
                  if (!(error instanceof OfflinePackCancelledError)) {
                    setStatus((current) => ({
                      ...current,
                      state: "error",
                      error:
                        error instanceof Error
                          ? error.message
                          : "Download failed.",
                    }));
                  }
                });
            }}
          >
            Download
          </button>
        )}
      </div>
    </article>
  );
}

function OfflinePanel({
  installState,
  onInstall,
  onClose,
}: {
  readonly installState: InstallAvailability;
  readonly onInstall: () => void;
  readonly onClose: () => void;
}) {
  const manager = useMemo(
    () => new OfflinePackManager({ basePath: import.meta.env.BASE_URL }),
    [],
  );

  return (
    <Modal title="Offline & install" onClose={onClose} wide>
      <section className={styles.installSection}>
        <div>
          <p className={styles.eyebrow}>App shell</p>
          <h3>Take the story with you</h3>
          <p>
            The interface, story, and artwork are cached with the installed
            app. Voice is optional and downloaded one chapter at a time.
          </p>
        </div>
        <button
          className={styles.secondaryButton}
          type="button"
          onClick={onInstall}
          disabled={installState !== "available"}
        >
          {installState === "installed"
            ? "Installed"
            : installState === "available"
              ? "Install app"
              : "Use browser install menu"}
        </button>
      </section>

      <section className={styles.packsSection}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>Optional downloads</p>
            <h3>Chapter voice packs</h3>
          </div>
          <p>Synthetic voice · subtitles always included</p>
        </div>
        {offlinePackManifests.length === 0 ? (
          <div className={styles.voicePending}>
            <strong>Voice packs are not included in this edition.</strong>
            <p>
              The complete story remains playable with subtitles. Chapter
              packs will appear here if approved 48 kHz mono MP3 files and
              their licence records are added.
            </p>
          </div>
        ) : (
          <div className={styles.packList}>
            {offlinePackManifests.map((manifest) => (
              <PackRow
                key={manifest.id}
                manifest={manifest}
                manager={manager}
              />
            ))}
          </div>
        )}
      </section>
    </Modal>
  );
}

interface VoiceCreditRecord {
  readonly provider: string;
  readonly license: string;
  readonly profiles: readonly string[];
  readonly sourceReferences: readonly string[];
}

const voiceProfileNames = new Map<string, string>(
  voiceProfiles.map((profile) => [profile.id, profile.displayName]),
);

const voiceCreditRecords: readonly VoiceCreditRecord[] = (() => {
  const grouped = new Map<
    string,
    {
      provider: string;
      license: string;
      profiles: Set<string>;
      sourceReferences: Set<string>;
    }
  >();

  for (const entry of voiceEntries) {
    const { provider, license, profile, sourceReference } = entry.provenance;
    const key = `${provider}\u0000${license}`;
    const record = grouped.get(key) ?? {
      provider,
      license,
      profiles: new Set<string>(),
      sourceReferences: new Set<string>(),
    };
    record.profiles.add(voiceProfileNames.get(profile) ?? profile);
    if (sourceReference !== undefined && sourceReference.trim().length > 0) {
      record.sourceReferences.add(sourceReference);
    }
    grouped.set(key, record);
  }

  return [...grouped.values()].map((record) => ({
    provider: record.provider,
    license: record.license,
    profiles: [...record.profiles].sort(),
    sourceReferences: [...record.sourceReferences].sort(),
  }));
})();
function CreditsPanel({ onClose }: { readonly onClose: () => void }) {
  return (
    <Modal title="Credits & provenance" onClose={onClose} wide>
      <div className={styles.credits}>
        <section>
          <p className={styles.eyebrow}>Story</p>
          <h3>Return to Me: The School Years</h3>
          <p>
            Inspired by Aleem’s life journey. Former-partner names are
            pseudonyms; schools and identifying details remain fictionalised.
            Nurul appears by name only.
          </p>
        </section>
        <section>
          <p className={styles.eyebrow}>Artwork</p>
          <h3>Original generated illustrations</h3>
          <p>
            Created for this project with OpenAI’s built-in image generation
            workflow, then cropped, keyed, and optimised locally. No school
            badges, generated readable text, copied game UI, screenshots, or
            trademarks are used.
          </p>
        </section>
        <section>
          <p className={styles.eyebrow}>Voice disclosure</p>
          <h3>Provider-neutral synthetic voice pipeline</h3>
          <p>{productionVoiceManifest.disclosure}</p>
          {voiceEntries.length === 0 ? (
            <p className={styles.voiceCreditNote}>
              This subtitles-only edition intentionally ships without voice
              clips. Every line remains available as text; a voiced edition
              requires a licensed clip and provenance record for every spoken
              line.
            </p>
          ) : (
            <div className={styles.voiceCreditList}>
              <p className={styles.voiceCreditNote}>
                {voiceEntries.length} licensed synthetic clips are imported.
                Provider and licence details are grouped below so repeated
                line-level records remain readable.
              </p>
              {voiceCreditRecords.map((record) => (
                <article
                  className={styles.voiceCreditRecord}
                  key={`${record.provider}-${record.license}`}
                >
                  <h4>{record.provider}</h4>
                  <dl>
                    <div>
                      <dt>Licence</dt>
                      <dd>{record.license}</dd>
                    </div>
                    <div>
                      <dt>Profiles</dt>
                      <dd>{record.profiles.join(", ")}</dd>
                    </div>
                  </dl>
                  {record.sourceReferences.length > 0 && (
                    <details>
                      <summary>
                        {record.sourceReferences.length} unique clip provenance
                        {record.sourceReferences.length === 1 ? " record" : " records"}
                      </summary>
                      <ul>
                        {record.sourceReferences.map((reference) => (
                          <li key={reference}>{reference}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
        <section>
          <p className={styles.eyebrow}>Technology</p>
          <p>
            React, TypeScript, Vite, Workbox, and vite-plugin-pwa. Progress and
            preferences stay in this browser. There is no backend, account, or
            analytics.
          </p>
        </section>
        <p className={styles.rights}>
          Narrative, original art, and imported voice assets are all rights
          reserved unless a specific licence record states otherwise.
        </p>
      </div>
    </Modal>
  );
}

function HelpPanel({ onClose }: { readonly onClose: () => void }) {
  return (
    <Modal title="Keyboard controls" onClose={onClose}>
      <dl className={styles.keyList}>
        <div>
          <dt>Space / Enter</dt>
          <dd>Reveal or advance dialogue</dd>
        </div>
        <div>
          <dt>A</dt>
          <dd>Toggle auto mode</dd>
        </div>
        <div>
          <dt>H</dt>
          <dd>Open dialogue history</dd>
        </div>
        <div>
          <dt>Escape</dt>
          <dd>Close the current dialog</dd>
        </div>
      </dl>
      <p className={styles.panelHint}>
        All actions are also available through touch-friendly buttons. Focus
        indicators remain visible for keyboard navigation.
      </p>
    </Modal>
  );
}

export default function App() {
  const {
    state,
    savedProgress,
    storageMessage,
    dispatch,
    startNew,
    continueGame,
  } = useStory();
  const [screen, setScreen] = useState<"title" | "game">("title");
  const [panel, setPanel] = useState<Panel>(null);
  const [showNotice, setShowNotice] = useState(true);
  const [confirmNew, setConfirmNew] = useState(false);
  const [installState, setInstallState] =
    useState<InstallAvailability>("unavailable");
  const installControllerRef =
    useRef<ReturnType<typeof createInstallPromptController> | undefined>(
      undefined,
    );
  const [updateState, setUpdateState] = useState<ServiceWorkerUpdateState>({
    offlineReady: false,
    updateAvailable: false,
  });
  const updateControllerRef =
    useRef<ReturnType<typeof registerReturnToMeServiceWorker> | undefined>(
      undefined,
    );

  useEffect(() => {
    const controller = createInstallPromptController(window);
    installControllerRef.current = controller;
    const unsubscribe = controller.subscribe(setInstallState);
    return () => {
      unsubscribe();
      controller.dispose();
    };
  }, []);

  useEffect(() => {
    if (import.meta.env.DEV || !("serviceWorker" in navigator)) {
      return;
    }
    const controller = registerReturnToMeServiceWorker();
    updateControllerRef.current = controller;
    return controller.subscribe((next) => setUpdateState({ ...next }));
  }, []);

  const unlocked =
    savedProgress.status === "ok"
      ? savedProgress.save.unlockedChapters
      : state.unlockedChapters;

  const launchNew = () => {
    startNew();
    setConfirmNew(false);
    setPanel(null);
    setScreen("game");
  };

  const launchContinue = () => {
    if (continueGame()) {
      setPanel(null);
      setScreen("game");
    }
  };

  const selectChapter = (chapterId: string) => {
    if (state.status === "idle" && savedProgress.status === "ok") {
      dispatch({ type: "LOAD_SAVE", save: savedProgress.save });
    }
    dispatch({ type: "JUMP_TO_CHAPTER", chapterId });
    setPanel(null);
    setScreen("game");
  };

  const promptInstall = () => {
    void installControllerRef.current?.prompt();
  };

  return (
    <div className={styles.app}>
      {screen === "title" ? (
        <TitleScreen
          unlockedChapters={unlocked}
          canContinue={savedProgress.status === "ok"}
          {...(storageMessage === undefined ? {} : { storageMessage })}
          installState={installState}
          onNewGame={() => {
            if (savedProgress.status === "ok") {
              setConfirmNew(true);
            } else {
              launchNew();
            }
          }}
          onContinue={launchContinue}
          onOpenPanel={setPanel}
          onInstall={promptInstall}
        />
      ) : (
        <GameScreen
          onTitle={() => setScreen("title")}
          onOpenPanel={setPanel}
        />
      )}

      {showNotice && <Notice onContinue={() => setShowNotice(false)} />}

      {confirmNew && (
        <Modal
          title="Begin again?"
          eyebrow="New Game"
          onClose={() => setConfirmNew(false)}
        >
          <p>
            Your current position will be replaced. Unlocked chapters and seen
            text stay available for replay.
          </p>
          <div className={styles.confirmActions}>
            <button
              className={styles.primaryButton}
              type="button"
              onClick={launchNew}
            >
              Start New Game
            </button>
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={() => setConfirmNew(false)}
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}

      {panel === "chapters" && (
        <ChapterPanel
          unlocked={unlocked}
          onSelect={selectChapter}
          onClose={() => setPanel(null)}
        />
      )}
      {panel === "history" && (
        <HistoryPanel onClose={() => setPanel(null)} />
      )}
      {panel === "settings" && (
        <SettingsPanel
          onClose={() => setPanel(null)}
          onReset={() => {
            setPanel(null);
            setScreen("title");
          }}
        />
      )}
      {panel === "offline" && (
        <OfflinePanel
          installState={installState}
          onInstall={promptInstall}
          onClose={() => setPanel(null)}
        />
      )}
      {panel === "credits" && (
        <CreditsPanel onClose={() => setPanel(null)} />
      )}
      {panel === "help" && <HelpPanel onClose={() => setPanel(null)} />}

      {updateState.updateAvailable && (
        <aside className={styles.updateToast} role="status">
          <div>
            <strong>A new story build is ready.</strong>
            <span>Your saved place will be kept.</span>
          </div>
          <button
            type="button"
            onClick={() => void updateControllerRef.current?.applyUpdate()}
          >
            Update now
          </button>
        </aside>
      )}
      {updateState.offlineReady && !updateState.updateAvailable && (
        <p className={styles.srOnly} role="status">
          Return to Me is ready for offline play.
        </p>
      )}
    </div>
  );
}
