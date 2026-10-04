import { registerSW } from 'virtual:pwa-register';

export interface ServiceWorkerUpdateState {
  offlineReady: boolean;
  updateAvailable: boolean;
  error?: string;
}

export interface ServiceWorkerUpdateController {
  getState: () => Readonly<ServiceWorkerUpdateState>;
  subscribe: (
    listener: (state: Readonly<ServiceWorkerUpdateState>) => void,
  ) => () => void;
  applyUpdate: () => Promise<void>;
  checkForUpdate: () => Promise<void>;
}

/**
 * Registers the injected service worker. Updates remain waiting until the user
 * accepts the app's update prompt through applyUpdate().
 */
export function registerReturnToMeServiceWorker(): ServiceWorkerUpdateController {
  let state: ServiceWorkerUpdateState = {
    offlineReady: false,
    updateAvailable: false,
  };
  const listeners = new Set<
    (nextState: Readonly<ServiceWorkerUpdateState>) => void
  >();
  let registration: ServiceWorkerRegistration | undefined;

  const updateState = (patch: Partial<ServiceWorkerUpdateState>) => {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener(state));
  };

  const updateSW = registerSW({
    immediate: false,
    onOfflineReady: () => updateState({ offlineReady: true }),
    onNeedRefresh: () => updateState({ updateAvailable: true }),
    onRegisteredSW: (_serviceWorkerUrl, nextRegistration) => {
      registration = nextRegistration;
      // onOfflineReady fires for an installation, not every later reload.
      void navigator.serviceWorker.ready.then((ready) => {
        const channel = new MessageChannel();
        const timeout = window.setTimeout(() => channel.port1.close(), 5_000);
        channel.port1.onmessage = (event: MessageEvent<{ shellReady?: boolean }>) => {
          window.clearTimeout(timeout);
          updateState({ offlineReady: event.data.shellReady === true });
          channel.port1.close();
        };
        ready.active?.postMessage({ type: 'OFFLINE_STATUS' }, [channel.port2]);
      });
    },
    onRegisterError: (error) =>
      updateState({
        error:
          error instanceof Error
            ? error.message
            : 'The offline service could not start.',
      }),
  });

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      listener(state);
      return () => listeners.delete(listener);
    },
    async applyUpdate() {
      await updateSW(true);
      updateState({ updateAvailable: false });
    },
    async checkForUpdate() {
      await registration?.update();
    },
  };
}
