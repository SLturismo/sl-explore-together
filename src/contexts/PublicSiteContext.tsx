import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import fallbackLogo from "@/assets/logo-sl-turismo.jpg";
import { syncBrandingMetaTags, toAbsoluteAssetUrl } from "@/lib/branding-meta";
import { readCachedLogoUrl, writeCachedLogoUrl } from "@/lib/logo-url-cache";

export type SiteVisibilityKey =
  | "hero"
  | "gallery"
  | "travel_form"
  | "events"
  | "about"
  | "cadastur"
  | "footer_newsletter"
  | "whatsapp_float";

export const DEFAULT_VISIBILITY: Record<SiteVisibilityKey, boolean> = {
  hero: true,
  gallery: true,
  travel_form: true,
  events: true,
  about: true,
  cadastur: true,
  footer_newsletter: true,
  whatsapp_float: true,
};

type PublicSiteContextValue = {
  /** URL pública no storage; null se não configurado */
  logoUrl: string | null;
  /** URL final para `<img src>` (remota ou fallback local) */
  logoSrc: string;
  visibility: Record<SiteVisibilityKey, boolean>;
  loaded: boolean;
};

const PublicSiteContext = createContext<PublicSiteContextValue | null>(null);

export function PublicSiteProvider({ children }: { children: ReactNode }) {
  const [logoUrl, setLogoUrl] = useState<string | null>(() => readCachedLogoUrl());
  const [visibility, setVisibility] = useState<Record<SiteVisibilityKey, boolean>>(DEFAULT_VISIBILITY);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const brandingPromise = supabase
        .from("site_content")
        .select("content")
        .eq("section_key", "branding")
        .maybeSingle()
        .then((brandingRes) => {
          if (cancelled || brandingRes.error) return;
          const b = brandingRes.data?.content as { logo_url?: string } | null;
          const next =
            b?.logo_url && typeof b.logo_url === "string" && b.logo_url.trim() ? b.logo_url.trim() : null;
          setLogoUrl(next);
          writeCachedLogoUrl(next);
        });

      const visibilityPromise = supabase
        .from("site_content")
        .select("content")
        .eq("section_key", "visibility")
        .maybeSingle()
        .then((visRes) => {
          if (cancelled) return;
          const v = visRes.data?.content as Partial<Record<SiteVisibilityKey, boolean>> | null;
          if (v && typeof v === "object") {
            setVisibility({ ...DEFAULT_VISIBILITY, ...v });
          }
        });

      await Promise.allSettled([brandingPromise, visibilityPromise]);
      if (!cancelled) setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const logoSrc = logoUrl?.trim() ? logoUrl : fallbackLogo;

  useEffect(() => {
    if (!loaded || typeof window === "undefined") return;
    syncBrandingMetaTags(toAbsoluteAssetUrl(logoSrc));
  }, [loaded, logoSrc]);

  const value = useMemo(
    () => ({ logoUrl, logoSrc, visibility, loaded }),
    [logoUrl, logoSrc, visibility, loaded],
  );

  return <PublicSiteContext.Provider value={value}>{children}</PublicSiteContext.Provider>;
}

export function usePublicSite() {
  const ctx = useContext(PublicSiteContext);
  if (!ctx) {
    throw new Error("usePublicSite must be used within PublicSiteProvider");
  }
  return ctx;
}

export function useSectionVisible(key: SiteVisibilityKey): boolean {
  return usePublicSite().visibility[key] !== false;
}
