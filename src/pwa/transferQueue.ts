/** One queue is shared by chapter artwork and voice transfers. */
export class TransferQueue {
  private active = 0;
  private readonly waiting: Array<() => void> = [];
  constructor(private readonly limit = 2) {}
  async run<T>(work: () => Promise<T>, signal?: AbortSignal): Promise<T> {
    if (signal?.aborted) throw new DOMException('Download cancelled.', 'AbortError');
    await new Promise<void>((resolve, reject) => {
      const next = () => {
        signal?.removeEventListener('abort', cancel);
        this.active += 1;
        resolve();
      };
      const cancel = () => {
        const index = this.waiting.indexOf(next);
        if (index >= 0) this.waiting.splice(index, 1);
        reject(new DOMException('Download cancelled.', 'AbortError'));
      };
      signal?.addEventListener('abort', cancel, { once: true });
      this.waiting.push(next);
      this.pump();
    });
    try {
      if (signal?.aborted) throw new DOMException('Download cancelled.', 'AbortError');
      return await work();
    } finally {
      this.active -= 1;
      this.pump();
    }
  }
  private pump(): void {
    while (this.active < this.limit && this.waiting.length > 0) this.waiting.shift()?.();
  }
}
