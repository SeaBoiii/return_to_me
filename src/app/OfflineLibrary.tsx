import { useEffect, useState } from 'react';
import { Modal } from './Modal';
import type { InstallAvailability } from '../pwa/installPrompt';
import { getOfflineLibraryManager, type LibraryPack, type LibraryStatus } from '../pwa/offlineLibrary';
import styles from './OfflineLibrary.module.css';

interface OfflineLibraryProps {
  readonly onClose: () => void;
  readonly installState: InstallAvailability;
  readonly onInstall: () => void;
  readonly currentChapterId?: string | undefined;
  readonly shellReady?: boolean;
  readonly shellError?: string | undefined;
}
const size = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;
const labels: Record<LibraryStatus['state'], string> = {
  'not-downloaded': 'Not downloaded', checking: 'Checking availability', downloading: 'Downloading',
  partial: 'Partly available', ready: 'Downloaded', cached: 'Available from recent reading', error: 'Download needs attention', unsupported: 'Downloads unavailable',
};

function PackCard({ pack, status }: { readonly pack: LibraryPack; readonly status: LibraryStatus }) {
  const manager = getOfflineLibraryManager();
  const title = pack.kind === 'art' ? 'Artwork' : 'Voices';
  const busy = status.state === 'downloading' || status.state === 'checking';
  const ready = status.state === 'ready';
  const progress = status.totalFiles > 0 ? Math.round(status.cachedFiles / status.totalFiles * 100) : 0;
  return <article className={styles.pack} aria-label={`${title} for ${pack.title}`}>
    <div className={styles.packHeading}><h4>{title}</h4><span>{size(pack.expectedBytes)} total</span></div>
    <p className={styles.status} role="status">{labels[status.state]}</p>
    <p className={styles.detail}>{status.cachedFiles}/{status.totalFiles} {pack.kind === 'art' ? 'images' : 'clips'} available{!ready && ` · ${size(status.remainingBytes)} left to download`}</p>
    <progress aria-label={`${title} download progress for ${pack.title}`} value={progress} max={100} />
    {status.error && <p className={styles.error}>{status.error}</p>}
    {status.state === 'cached' && <p className={styles.detail}>Keep these images to make this chapter available offline.</p>}
    <div className={styles.actions}>
      {status.state === 'downloading' ? <button type="button" onClick={() => manager.cancel(pack.id)}>Cancel</button> : !ready && <button type="button" disabled={busy || status.state === 'unsupported'} onClick={() => void manager.download(pack.id)}>{status.state === 'cached' ? 'Keep offline' : status.state === 'error' || status.state === 'partial' ? 'Retry download' : 'Download'}</button>}
      {ready && <button type="button" onClick={() => void manager.verify(pack.id)}>Verify</button>}
      {!busy && status.cachedFiles > 0 && <button type="button" className={styles.secondary} onClick={() => void manager.remove(pack.id)}>Remove</button>}
    </div>
  </article>;
}

export function OfflineLibrary({ onClose, installState, onInstall, currentChapterId, shellReady = false, shellError }: OfflineLibraryProps) {
  const manager = getOfflineLibraryManager();
  const [statuses, setStatuses] = useState(() => manager.snapshot());
  const [storage, setStorage] = useState<StorageEstimate>();
  const [filter, setFilter] = useState<'all' | 'art' | 'voice'>('all');
  useEffect(() => {
    const unsubscribe = manager.subscribe(() => setStatuses(manager.snapshot()));
    void manager.refresh();
    if (navigator.storage?.estimate) void navigator.storage.estimate().then(setStorage).catch(() => undefined);
    return unsubscribe;
  }, [manager]);
  const chapterTitles = new Map<string, string>();
  for (const pack of manager.packs) if (!chapterTitles.has(pack.chapterId)) chapterTitles.set(pack.chapterId, pack.title);
  const chapters = [...chapterTitles.entries()];
  const ordered = [...chapters.filter(([id]) => id === currentChapterId), ...chapters.filter(([id]) => id !== currentChapterId)];
  return <Modal title="Offline & install" onClose={onClose} wide>
    <div className={styles.library}>
      <section className={styles.install}>
        <div><h3>Take the story with you</h3><p>{shellReady ? 'The app and complete story text are available offline.' : 'The app and story text are preparing for offline reading.'}</p><p>Artwork loads as you read. Download a chapter’s artwork and voices to keep them available offline. Artwork includes both screen orientations.</p></div>
        <button type="button" disabled={installState !== 'available'} onClick={onInstall}>{installState === 'installed' ? 'Installed' : installState === 'available' ? 'Install app' : 'Use browser install menu'}</button>
      </section>
      {installState !== 'installed' && <p className={styles.note}>On iPhone or iPad, open this page in Safari, choose Share, then Add to Home Screen. In Chrome or Edge, open the browser menu and choose Install app or Add to Home Screen.</p>}
      {shellError && <p className={styles.error} role="status">{shellError} You can continue reading online.</p>}
      {storage?.quota !== undefined && storage.usage !== undefined && <p className={styles.storage}>{size(storage.usage)} used by this site · about {size(Math.max(0, storage.quota - storage.usage))} available</p>}
      <div className={styles.tabs} role="group" aria-label="Show downloads">
        {(['all', 'art', 'voice'] as const).map((value) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>{value === 'all' ? 'All downloads' : value === 'art' ? 'Artwork' : 'Voices'}</button>)}
      </div>
      <p className={styles.note}>Downloads continue while you read. Shared artwork is stored once and kept when another downloaded chapter needs it. Voices are synthetic; subtitles are always included.</p>
      <div className={styles.chapters}>{ordered.map(([id, title]) => <section className={styles.chapter} key={id}>
        <div className={styles.chapterHeading}><h3>{title}</h3>{id === currentChapterId && <span>Current chapter</span>}</div>
        <div className={styles.packs}>{manager.packs.filter((pack) => pack.chapterId === id && (filter === 'all' || pack.kind === filter)).map((pack) => <PackCard key={pack.id} pack={pack} status={statuses.get(pack.id)!} />)}</div>
      </section>)}</div>
    </div>
  </Modal>;
}
