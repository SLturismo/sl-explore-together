/** URL absoluta para og:image / favicon (crawlers e browsers). */
export function toAbsoluteAssetUrl(src: string): string {
  if (!src) return src;
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (typeof window === "undefined") return src;
  const path = src.startsWith("/") ? src : `/${src}`;
  return `${window.location.origin}${path}`;
}

function setOrCreateMeta(attr: "property" | "name", key: string, content: string) {
  const sel = attr === "property" ? `meta[property="${key}"]` : `meta[name="${key}"]`;
  let el = document.head.querySelector(sel) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setPrimaryLink(rel: string, href: string, extra: { type?: string; sizes?: string } = {}) {
  const links = document.head.querySelectorAll(`link[rel="${rel}"]`);
  let el = links[0] as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
  if (extra.type) el.type = extra.type;
  else el.removeAttribute("type");
  if (extra.sizes) el.setAttribute("sizes", extra.sizes);
  for (let i = 1; i < links.length; i++) links[i].remove();
}

/**
 * Alinha favicon, apple-touch-icon e imagens OG/Twitter ao logo atual (Supabase ou fallback).
 * Nota: alguns crawlers só leem o HTML inicial; o index.html mantém fallback estático.
 */
export function syncBrandingMetaTags(absoluteImageUrl: string) {
  if (typeof document === "undefined" || !absoluteImageUrl) return;

  const iconType =
    /\.png(\?|$)/i.test(absoluteImageUrl)
      ? "image/png"
      : /\.webp(\?|$)/i.test(absoluteImageUrl)
        ? "image/webp"
        : /\.(jpe?g)(\?|$)/i.test(absoluteImageUrl)
          ? "image/jpeg"
          : undefined;

  setOrCreateMeta("property", "og:image", absoluteImageUrl);
  setOrCreateMeta("name", "twitter:image", absoluteImageUrl);

  setPrimaryLink("icon", absoluteImageUrl, iconType ? { type: iconType } : {});
  setPrimaryLink("apple-touch-icon", absoluteImageUrl);
}
