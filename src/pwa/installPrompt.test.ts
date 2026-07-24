import { describe, expect, it, vi } from 'vitest';

import { createInstallPromptController } from './installPrompt';

class InstallTestWindow extends EventTarget {
  constructor(private readonly standalone = false) {
    super();
  }

  matchMedia = vi.fn(
    () =>
      ({
        matches: this.standalone,
      }) as MediaQueryList,
  );
}

function installEvent(outcome: 'accepted' | 'dismissed') {
  const event = new Event('beforeinstallprompt', { cancelable: true });
  const prompt = vi.fn(() => Promise.resolve());
  Object.assign(event, {
    prompt,
    userChoice: Promise.resolve({ outcome, platform: 'web' }),
  });
  return { event, prompt };
}

describe('createInstallPromptController', () => {
  it('exposes a captured browser install prompt and reports acceptance', async () => {
    const target = new InstallTestWindow();
    const controller = createInstallPromptController(
      target as unknown as Window,
    );
    const states: string[] = [];
    controller.subscribe((state) => states.push(state));
    const pendingInstall = installEvent('accepted');

    target.dispatchEvent(pendingInstall.event);

    expect(pendingInstall.event.defaultPrevented).toBe(true);
    expect(controller.getState()).toBe('available');
    await expect(controller.prompt()).resolves.toBe('installed');
    expect(pendingInstall.prompt).toHaveBeenCalledOnce();
    expect(states).toEqual(['unavailable', 'available', 'installed']);
    controller.dispose();
  });

  it('reports a dismissed prompt without trying to show it twice', async () => {
    const target = new InstallTestWindow();
    const controller = createInstallPromptController(
      target as unknown as Window,
    );
    const pendingInstall = installEvent('dismissed');
    target.dispatchEvent(pendingInstall.event);

    await expect(controller.prompt()).resolves.toBe('declined');
    await expect(controller.prompt()).resolves.toBe('declined');
    expect(pendingInstall.prompt).toHaveBeenCalledOnce();
    controller.dispose();
  });

  it('recognizes standalone mode and the appinstalled browser event', () => {
    const standaloneTarget = new InstallTestWindow(true);
    const standalone = createInstallPromptController(
      standaloneTarget as unknown as Window,
    );
    expect(standalone.getState()).toBe('installed');
    standalone.dispose();

    const target = new InstallTestWindow();
    const controller = createInstallPromptController(
      target as unknown as Window,
    );
    target.dispatchEvent(new Event('appinstalled'));
    expect(controller.getState()).toBe('installed');
    controller.dispose();
  });
});
