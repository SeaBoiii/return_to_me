const localLocks = new Map<string, Promise<unknown>>();

/** Web Locks serializes worker/window mutations; the fallback covers local instances. */
export function withArtMutation<T>(name: string, action: () => Promise<T>): Promise<T> {
  if (typeof navigator !== 'undefined' && navigator.locks?.request) return navigator.locks.request(name, action);
  const previous = localLocks.get(name) ?? Promise.resolve();
  const current = previous.catch(() => undefined).then(action);
  localLocks.set(name, current);
  void current.finally(() => { if (localLocks.get(name) === current) localLocks.delete(name); }).catch(() => undefined);
  return current;
}
