const KEY = "slturismo_branding_logo_url_v2";
const LEGACY_KEYS = ["slturismo_branding_logo_url_v1"];

function isAllowedLogoUrl(u: string): boolean {
  const t = u.trim();
  if (!/^https:\/\//i.test(t)) return false;
  try {
    const host = new URL(t).hostname;
    if (host === "localhost" || host === "127.0.0.1") return true;
    return host.includes(".") && host.length > 3;
  } catch {
    return false;
  }
}

/** Lê a última URL de logo guardada (síncrono, antes do fetch ao Supabase). */
export function readCachedLogoUrl(): string | null {
  if (typeof window === "undefined") return null;
  try {
    LEGACY_KEYS.forEach((legacyKey) => localStorage.removeItem(legacyKey));
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const u = raw.trim();
    return isAllowedLogoUrl(u) ? u : null;
  } catch {
    return null;
  }
}

export function writeCachedLogoUrl(url: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (url?.trim() && isAllowedLogoUrl(url)) {
      localStorage.setItem(KEY, url.trim());
    } else {
      localStorage.removeItem(KEY);
    }
  } catch {
    /* quota / modo privado */
  }
}
