import { useEffect, useRef, useState } from "react";
import { getDialogueHistory } from "./engine";
import {
  createInstallPromptController,
  type InstallAvailability,
  registerReturnToMeServiceWorker,
  type ServiceWorkerUpdateState,
} from "./pwa";
import { getArtUrl, protectActiveArt } from "./pwa/artContent";
import { story } from "./story";
import { getAssetEntry } from "./art/manifest";
import { offlinePackManifests, productionVoiceManifest, voiceEntries, voiceProfiles } from "./voices";
import { Modal } from "./app/Modal";
import { Reader } from "./app/Reader";
import { OfflineLibrary } from "./app/OfflineLibrary";
import { useStory } from "./app/StoryContext";
import type { Panel } from "./app/panels";
import styles from "./app/App.module.css";

const voicedChapterIds = new Set(
  offlinePackManifests.map((manifest) => manifest.chapterId),
);
const voicedChapterTitles = story.chapters
  .filter((chapter) => voicedChapterIds.has(chapter.id))
  .map((chapter) => chapter.title)
  .join(", ");
const hasUnvoicedChapters = story.chapters.some(
  (chapter) => !voicedChapterIds.has(chapter.id),
);

function Notice({ onContinue, label = "Continue to title" }: { onContinue: () => void; label?: string }) {
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
            Family pressure, repeated romantic rejection, relationship
            breakdown and perceived deception, academic disappointment,
            prejudicial thoughts involving ethnicity and religious dress,
            panic-like physical distress, and periods of emotional withdrawal.
            Harmful conclusions are presented as Aleem’s thoughts, not as facts,
            and no medical diagnosis is made. Exact examination grades are not
            shown.
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
      >
        {label}
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
  readonly onResumeReplay: () => void;
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
  onResumeReplay,
}: TitleScreenProps) {
  const { savedProgress, replayProgress } = useStory();
  const savedChapter = savedProgress.status === "ok" ? story.chapters.find(chapter =>
    story.nodes.some(node => node.id === savedProgress.save.currentNodeId && node.chapterId === chapter.id)) : undefined;
  const dawn = getAssetEntry("bg-dawn-window");
  useEffect(() => { if (dawn) protectActiveArt([getArtUrl(dawn.url)]); }, [dawn]);
  return (
    <main id="main-content" className={styles.titleScreen}>
      {dawn !== undefined && (
        <img
          className={styles.titleBackground}
          src={getArtUrl(dawn.url)}
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
        {story.subtitle && <p className={styles.subtitle}>{story.subtitle}</p>}
        <p className={styles.titleSummary}>
          From school corridors to a sunset by the Kallang River. Follow Aleem
          through love, disappointment, faith, and a new beginning with Nurul.
        </p>

        {storageMessage !== undefined && (
          <p className={styles.warning} role="status">
            {storageMessage} Progress will continue for this session.
          </p>
        )}

        <div className={styles.titleActions}>
          <button className={canContinue ? styles.primaryButton : styles.secondaryButton}
            type="button" onClick={onContinue} disabled={!canContinue} aria-label="Continue">
            Continue {savedChapter && <small className={styles.resumeChapter}>{savedChapter.title}</small>}
          </button>
          <button className={canContinue ? styles.secondaryButton : styles.primaryButton}
            type="button" onClick={onNewGame}>New Game</button>
        </div>
        {replayProgress.status === "ok" && !replayProgress.replay.completed && unlockedChapters.includes(replayProgress.replay.chapterId) &&
          <button className={styles.textButton} onClick={onResumeReplay}>Resume replay</button>}

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
          <p className={styles.installedPill}>App installed</p>
        )}
      </div>
      <p className={styles.titleFooter}>
        Singapore · 2009–2026 <span aria-hidden="true">•</span> No analytics
      </p>
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
  const { savedProgress, replayProgress } = useStory();
  const savedNode = savedProgress.status === "ok" ? story.nodes.find(node => node.id === savedProgress.save.currentNodeId) : undefined;
  const completedChapters = new Set(savedProgress.status === 'ok' ? story.nodes.filter(node => {
    if (node.type === 'end') return savedProgress.save.status === 'ended' && savedProgress.save.currentNodeId === node.id;
    return node.type === 'line' && savedProgress.save.seenNodeIds.includes(node.id)
      && story.nodes.some(next => next.id === node.next && next.chapterId !== node.chapterId);
  }).map(node => node.chapterId) : []);
  return (
    <Modal
      title="Chapter select"
      eyebrow={story.subtitle ?? story.title}
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
                <span>{index === 0 ? "P" : chapter.id === "epilogue" ? "E" : String(index).padStart(2, "0")}</span>
                <span>
                  <strong>{chapter.title}</strong>
                  <small>{chapter.period}</small>
                </span>
                <i>{!available ? "Locked" : savedNode?.chapterId === chapter.id && !completedChapters.has(chapter.id)
                  ? "Current · Replay" : completedChapters.has(chapter.id) ? "Completed · Replay" : "Replay"}</i>
              </button>
            </li>
          );
        })}
      </ol>
      {replayProgress.status === "ok" && !replayProgress.replay.completed && <p className={styles.panelHint}>Starting a different replay replaces only the replay in progress.</p>}
      <p className={styles.panelHint}>
        Replay chapters without changing your main reading position. Chapters unlock naturally as you reach them. Choices change immediate
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
        <label><span>Reading size</span>
          <select value={settings.textSize ?? 18} onChange={event => updateSettings({ textSize: Number(event.currentTarget.value) as 18 | 21 | 24 })}>
            <option value={18}>Standard — 18</option><option value={21}>Large — 21</option><option value={24}>Extra large — 24</option>
          </select>
        </label>
        <label>
          <span>
            Text speed <small>{settings.textSpeedMs === 0 ? "Instant" : `${settings.textSpeedMs} ms`}</small>
          </span>
          <input
            type="range"
            aria-describedby="text-speed-help"
            min="0"
            max="60"
            step="6"
            value={settings.textSpeedMs}
            onChange={(event) =>
              updateSettings({ textSpeedMs: Number(event.currentTarget.value) })
            }
          />
        </label>
        <p id="text-speed-help" className={styles.smallPrint}>Text follows the voice as each word is spoken. This speed applies to muted or unavailable voices. Choose Instant to show the full passage immediately.</p>
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
          <h3>{story.title}{story.subtitle ? `: ${story.subtitle}` : ""}</h3>
          <p>
            Inspired by Aleem’s life journey from 2009 to 2026. Former-partner
            and friend names are pseudonyms; dialogue is reconstructed, and
            schools and identifying details remain fictionalised. The story
            distinguishes observed, reported, and inferred details without
            treating ethnicity or religious dress as moral evidence. It closes
            with Aleem and Nurul engaged and preparing for their wedding.
          </p>
        </section>
        <section>
          <p className={styles.eyebrow}>Artwork</p>
          <h3>Original generated illustrations</h3>
          <p>
            Created for this project with OpenAI’s built-in image generation
            workflow, then cropped, keyed, and optimised locally. No school
            badges, unit insignia, generated readable text, copied social-media
            or game UI, screenshots, logos, or trademarks are used.
          </p>
        </section>
        <section>
          <p className={styles.eyebrow}>Voice disclosure</p>
          <h3>Synthetic character voices</h3>
          <p>{productionVoiceManifest.disclosure}</p>
          {voiceEntries.length === 0 ? (
            <p className={styles.voiceCreditNote}>
              This subtitles-only edition intentionally ships without voice
              clips. The complete story remains available as text.
            </p>
          ) : (
            <div className={styles.voiceCreditList}>
              <p className={styles.voiceCreditNote}>
                {voiceEntries.length} synthetic clips are included for:
                {" "}{voicedChapterTitles}.
                {hasUnvoicedChapters && " Other chapters remain subtitle-only."}
                {" "}All dialogue remains available as text. Provider and
                supplied licence references are listed below.
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
    settings,
    sessionMode,
    replayChapterId,
    startReplay,
    resumeReplay,
    returnToMain,
    updateSettings,
    startNew,
    continueGame,
  } = useStory();
  const [screen, setScreen] = useState<"title" | "game">("title");
  const [panel, setPanel] = useState<Panel>(null);
  const [showNotice, setShowNotice] = useState(() => {
    try { return localStorage.getItem("return-to-me:notice:v1") !== "acknowledged"; } catch { return true; }
  });
  const [readerSession, setReaderSession] = useState(0);
  const [pauseRequest, setPauseRequest] = useState(0);
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
    setReaderSession(value => value + 1);
    setConfirmNew(false);
    setPanel(null);
    setScreen("game");
  };

  const launchContinue = () => {
    if (continueGame()) {
      setReaderSession(value => value + 1);
      setPanel(null);
      setScreen("game");
    }
  };

  const selectChapter = (chapterId: string) => {
    if (startReplay(chapterId)) {
      setReaderSession(value => value + 1);
      setPanel(null);
      setScreen("game");
    }
  };
  const launchReplay = () => {
    if (resumeReplay()) {
      setReaderSession(value => value + 1);
      setPanel(null); setScreen("game");
    }
  };
  const acknowledge = () => {
    try { localStorage.setItem("return-to-me:notice:v1", "acknowledged"); } catch { /* Reading remains available. */ }
    setShowNotice(false); setPanel(null);
  };

  const promptInstall = () => {
    void installControllerRef.current?.prompt();
  };

  return (
    <div className={styles.app} data-reduced-motion={settings.reducedMotion}>
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
          onResumeReplay={launchReplay}
          onOpenPanel={setPanel}
          onInstall={promptInstall}
        />
      ) : (
        <Reader
          key={`${readerSession}:${sessionMode}:${replayChapterId ?? ""}`}
          panelOpen={panel !== null || showNotice || confirmNew}
          pauseRequest={pauseRequest}
          onTitle={() => setScreen("title")}
          onOpenPanel={setPanel}
        />
      )}

      {(showNotice || panel === "notice") && <Notice onContinue={acknowledge} label={screen === 'game' ? 'Back to story' : 'Continue to title'} />}

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

      {panel === "menu" && <Modal title="Reading menu" onClose={() => setPanel(null)}>
        <div className={styles.readingMenu}>
          <button onClick={() => { setPauseRequest(value => value + 1); setPanel(null); }}>Pause reading</button>
          {sessionMode === "replay" && <button className={styles.primaryButton} onClick={() => {
            if (returnToMain()) { setReaderSession(value => value + 1); setPanel(null); }
          }}>Return to main story</button>}
          <button onClick={() => setPanel("chapters")}>Chapters &amp; replay</button>
          <button onClick={() => setPanel("settings")}>Settings</button>
          <button onClick={() => setPanel("offline")}>Offline &amp; install</button>
          <button aria-pressed={settings.skipSeen} onClick={() => updateSettings({ skipSeen: !settings.skipSeen, autoMode: false })}>
            Skip seen text · {settings.skipSeen ? "on" : "off"}</button>
          <button onClick={() => setPanel("help")}>How to play &amp; keyboard controls</button>
          <button onClick={() => setPanel("notice")}>About this story &amp; content note</button>
          <button onClick={() => setPanel("credits")}>Credits</button>
          <button onClick={() => { setPanel(null); setScreen("title"); }}>Return to title</button>
        </div>
      </Modal>}

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
        <OfflineLibrary
          {...(story.nodes.find(node => node.id === state.currentNodeId)?.chapterId ? { currentChapterId: story.nodes.find(node => node.id === state.currentNodeId)!.chapterId } : {})}
          shellReady={updateState.offlineReady}
          {...(updateState.error ? { shellError: updateState.error } : {})}
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
          The app and story text are ready offline. Download artwork and voices in Offline & install.
        </p>
      )}
    </div>
  );
}
