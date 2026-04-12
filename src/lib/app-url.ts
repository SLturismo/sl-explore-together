/**
 * URL pública canónica do site (ex.: https://www.slturismo.com).
 * Na Vercel: Settings → Environment Variables → VITE_SITE_URL
 * Evita que links de "esqueci a senha" usem *.vercel.app ou localhost.
 */
export function getAppOrigin(): string {
  const raw = import.meta.env.VITE_SITE_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

export function getPasswordResetRedirectUrl(): string {
  return `${getAppOrigin()}/admin/redefinir-senha`;
}
