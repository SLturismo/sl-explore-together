import { useState, useEffect, useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSectionVisible } from "@/contexts/PublicSiteContext";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type GalleryRow = {
  id: string;
  url: string;
  category: string;
  title: string | null;
  description: string | null;
  display_order: number | null;
};

const Gallery = () => {
  const visible = useSectionVisible("gallery");
  const [active, setActive] = useState("Todas");
  const [titlePrefix, setTitlePrefix] = useState("Galeria de");
  const [titleHighlight, setTitleHighlight] = useState("Viagens");
  const [subtitle, setSubtitle] = useState("Inspire-se com destinos incríveis escolhidos por mulheres como você");
  const [imageFit, setImageFit] = useState<"cover" | "contain">("cover");
  const [images, setImages] = useState<GalleryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    supabase
      .from("site_content")
      .select("content")
      .eq("section_key", "gallery")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.content) {
          const c = data.content as Record<string, string>;
          if (c.title_prefix) setTitlePrefix(c.title_prefix);
          if (c.title_highlight) setTitleHighlight(c.title_highlight);
          if (c.subtitle) setSubtitle(c.subtitle);
          if (c.image_fit === "contain" || c.image_fit === "cover") setImageFit(c.image_fit);
        }
      });
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("gallery_images")
        .select("id, url, category, title, description, display_order")
        .eq("is_visible", true)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: true });
      setImages(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const categories = useMemo(() => {
    const unique = [...new Set(images.map((i) => i.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));
    return ["Todas", ...unique];
  }, [images]);

  useEffect(() => {
    if (active !== "Todas" && !categories.includes(active)) {
      setActive("Todas");
    }
  }, [active, categories]);

  const filtered = active === "Todas" ? images : images.filter((i) => i.category === active);

  const thumbObjectClass = imageFit === "contain" ? "object-contain bg-card" : "object-cover";

  const openAt = useCallback((id: string) => {
    const i = filtered.findIndex((img) => img.id === id);
    if (i >= 0) setLightboxIndex(i);
  }, [filtered]);

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const goPrev = useCallback(() => {
    setLightboxIndex((i) => (i === null || i <= 0 ? i : i - 1));
  }, []);

  const goNext = useCallback(() => {
    setLightboxIndex((i) => (i === null || i >= filtered.length - 1 ? i : i + 1));
  }, [filtered.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, closeLightbox, goPrev, goNext]);

  if (!visible) return null;

  const current = lightboxIndex !== null ? filtered[lightboxIndex] : null;

  return (
    <section id="galeria" className="py-20 bg-rose-light">
      <div className="container mx-auto px-4">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-center text-foreground mb-4">
          {titlePrefix} <span className="text-primary">{titleHighlight}</span>
        </h2>
        <p className="text-center text-muted-foreground mb-8 max-w-xl mx-auto">{subtitle}</p>

        {!loading && images.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActive(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${active === cat ? "bg-primary text-primary-foreground shadow-md" : "bg-card text-muted-foreground hover:bg-primary/10"}`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl overflow-hidden bg-card/60 animate-pulse h-64" />
            ))}
          </div>
        ) : images.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">Em breve novas fotos na galeria.</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">Nenhuma foto nesta categoria.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((img) => (
              <button
                key={img.id}
                type="button"
                onClick={() => openAt(img.id)}
                className="group relative rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow text-left w-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <img
                  src={img.url}
                  alt={img.title || "Galeria"}
                  loading="lazy"
                  width={800}
                  height={600}
                  className={`w-full h-64 ${thumbObjectClass} group-hover:scale-105 transition-transform duration-500`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4 pointer-events-none">
                  <div>
                    <h3 className="text-primary-foreground font-semibold">{img.title || img.category}</h3>
                    {img.description && <p className="text-primary-foreground/80 text-sm line-clamp-2">{img.description}</p>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <Dialog open={lightboxIndex !== null} onOpenChange={(open) => !open && closeLightbox()}>
        <DialogContent className="max-w-4xl w-[95vw] p-0 gap-0 overflow-hidden border-border bg-card">
          {current && (
            <div className="flex flex-col max-h-[90vh]">
              <div className="relative flex-1 min-h-0 bg-foreground/95 flex items-center justify-center p-2 sm:p-4">
                {filtered.length > 1 && (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full shadow-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        goPrev();
                      }}
                      disabled={lightboxIndex === 0}
                      aria-label="Foto anterior"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full shadow-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        goNext();
                      }}
                      disabled={lightboxIndex === filtered.length - 1}
                      aria-label="Próxima foto"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </>
                )}
                <img
                  src={current.url}
                  alt={current.title || "Galeria"}
                  className="max-h-[min(70vh,720px)] w-full object-contain"
                />
              </div>
              <div className="p-4 sm:p-5 border-t border-border bg-card">
                <h3 className="font-display text-lg font-semibold text-foreground">{current.title || current.category}</h3>
                {current.description && <p className="text-muted-foreground text-sm mt-2 leading-relaxed">{current.description}</p>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default Gallery;
