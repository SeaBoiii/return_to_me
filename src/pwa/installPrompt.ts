export type InstallAvailability =
  | 'unavailable'
  | 'available'
  | 'installed'
  | 'declined';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}

export interface InstallPromptController {
  getState(): InstallAvailability;
  subscribe(listener: (state: InstallAvailability) => void): () => void;
  prompt(): Promise<InstallAvailability>;
  dispose(): void;
}

export function createInstallPromptController(
  target: Window = window,
): InstallPromptController {
  let deferredPrompt: BeforeInstallPromptEvent | undefined;
  let state: InstallAvailability = target.matchMedia(
    '(display-mode: standalone)',
  ).matches
    ? 'installed'
    : 'unavailable';
  const listeners = new Set<(nextState: InstallAvailability) => void>();

  const setState = (nextState: InstallAvailability) => {
    state = nextState;
    listeners.forEach((listener) => listener(state));
  };

  const beforeInstall = (event: Event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    setState('available');
  };
  const installed = () => {
    deferredPrompt = undefined;
    setState('installed');
  };

  target.addEventListener('beforeinstallprompt', beforeInstall);
  target.addEventListener('appinstalled', installed);

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      listener(state);
      return () => listeners.delete(listener);
    },
    async prompt() {
      if (!deferredPrompt) {
        return state;
      }

      const promptEvent = deferredPrompt;
      deferredPrompt = undefined;
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      const nextState =
        choice.outcome === 'accepted' ? 'installed' : 'declined';
      setState(nextState);
      return nextState;
    },
    dispose() {
      target.removeEventListener('beforeinstallprompt', beforeInstall);
      target.removeEventListener('appinstalled', installed);
      listeners.clear();
    },
  };
}
