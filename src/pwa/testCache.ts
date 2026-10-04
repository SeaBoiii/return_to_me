/** In-memory CacheStorage with the matching behavior used by our offline code. */
export class TestCache {
  readonly entries = new Map<string, Response>();
  private url(request: RequestInfo | URL): string { return typeof request === 'string' ? request : request instanceof URL ? request.href : request.url; }
  keys(request?: RequestInfo | URL, options?: CacheQueryOptions): Promise<Request[]> {
    const url = request === undefined ? undefined : this.url(request);
    return Promise.resolve([...this.entries.keys()].filter((key) => url === undefined || (options?.ignoreSearch ? key.split('?')[0] === url.split('?')[0] : key === url)).map((key) => new Request(key)));
  }
  async match(request: RequestInfo | URL, options?: CacheQueryOptions): Promise<Response | undefined> {
    const key = (await this.keys(request, options))[0];
    return key ? this.entries.get(key.url)?.clone() : undefined;
  }
  put(request: RequestInfo | URL, response: Response): Promise<void> { this.entries.set(this.url(request), response.clone()); return Promise.resolve(); }
  async delete(request: RequestInfo | URL, options?: CacheQueryOptions): Promise<boolean> {
    const keys = await this.keys(request, options);
    keys.forEach((key) => this.entries.delete(key.url));
    return keys.length > 0;
  }
}
export class TestCacheStorage {
  readonly stores = new Map<string, TestCache>();
  open(name: string): Promise<Cache> {
    let cache = this.stores.get(name);
    if (!cache) { cache = new TestCache(); this.stores.set(name, cache); }
    return Promise.resolve(cache as unknown as Cache);
  }
  keys(): Promise<string[]> { return Promise.resolve([...this.stores.keys()]); }
  delete(name: string): Promise<boolean> { return Promise.resolve(this.stores.delete(name)); }
  get storage(): CacheStorage { return this as unknown as CacheStorage; }
}
