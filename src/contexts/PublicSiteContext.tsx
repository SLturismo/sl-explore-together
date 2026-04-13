import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import fallbackLogo from "@/assets/logo-sl-turismo.jpg";

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
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<Record<SiteVisibilityKey, boolean>>(DEFAULT_VISIBILITY);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [brandingRes, visRes] = await Promise.all([
        supabase.from("site_content").select("content").eq("section_key", "branding").maybeSingle(),
        supabase.from("site_content").select("content").eq("section_key", "visibility").maybeSingle(),
      ]);
      if (cancelled) return;
      const b = brandingRes.data?.content as { logo_url?: string } | null;
      if (b?.logo_url && typeof b.logo_url === "string") setLogoUrl(b.logo_url);
      const v = visRes.data?.content as Partial<Record<SiteVisibilityKey, boolean>> | null;
      if (v && typeof v === "object") {
        setVisibility({ ...DEFAULT_VISIBILITY, ...v });
      }
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const logoSrc = logoUrl?.trim() ? logoUrl : fallbackLogo;

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
