function currentOrigin(): string {
  return globalThis.location?.origin ?? 'http://localhost';
}

function defaultBasePath(): string {
  return import.meta.env.BASE_URL || '/';
}

function asDirectoryUrl(basePath: string, origin: string): URL {
  const absoluteBase = new URL(basePath, origin);

  if (!absoluteBase.pathname.endsWith('/')) {
    absoluteBase.pathname = `${absoluteBase.pathname}/`;
  }

  return absoluteBase;
}

/**
 * Resolves an app-owned asset beneath Vite's deployment base. A leading slash
 * is intentionally treated as app-root-relative, not origin-root-relative, so
 * manifests remain safe when hosted at /owner/repository/ on GitHub Pages.
 */
export function resolveAppUrl(
  assetPath: string,
  basePath = defaultBasePath(),
  origin = currentOrigin(),
): string {
  const value = assetPath.trim();
  if (!value) {
    throw new Error('An asset path is required.');
  }

  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value)) {
    return new URL(value, origin).href;
  }

  const baseUrl = asDirectoryUrl(basePath, origin);
  const baseWithoutTrailingSlash = baseUrl.pathname.slice(0, -1);
  if (
    value.startsWith('/') &&
    (value === baseWithoutTrailingSlash || value.startsWith(baseUrl.pathname))
  ) {
    return new URL(value, baseUrl.origin).href;
  }

  const relativePath = value.replace(/^\.?\//, '');
  return new URL(relativePath, baseUrl).href;
}

export function appPathname(
  assetPath: string,
  basePath = defaultBasePath(),
): string {
  return new URL(resolveAppUrl(assetPath, basePath)).pathname;
}
