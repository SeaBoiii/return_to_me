const ABSOLUTE_URL = /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i;

/** Normalises Vite/GitHub Pages base paths to `/segment/` form. */
export const normalizeBasePath = (basePath: string): string => {
  const trimmed = basePath.trim();
  if (trimmed === "" || trimmed === "." || trimmed === "/") {
    return "/";
  }

  const withoutEdges = trimmed.replace(/^\/+|\/+$/g, "");
  return withoutEdges.length === 0 ? "/" : `/${withoutEdges}/`;
};

export const isAbsoluteUrl = (url: string): boolean =>
  ABSOLUTE_URL.test(url.trim());

/**
 * Resolves a repository-local asset against a GitHub Pages/Vite base without
 * changing full, data, blob, protocol-relative, or fragment URLs.
 */
export const withBasePath = (assetPath: string, basePath = "/"): string => {
  const path = assetPath.trim();
  if (path === "" || isAbsoluteUrl(path)) {
    return path;
  }

  const base = normalizeBasePath(basePath);
  if (base !== "/" && (path === base.slice(0, -1) || path.startsWith(base))) {
    return path.startsWith("/") ? path : `/${path}`;
  }

  return `${base}${path.replace(/^\/+/, "")}`;
};

