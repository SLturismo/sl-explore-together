import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

type GalleryRow = {
  id: string;
  url: string;
  category: string;
  title: string | null;
  description: string | null;
  display_order: number | null;
};

const Gallery = () => {
  const [active, setActive] = useState("Todas");
  const [titlePrefix, setTitlePrefix] = useState("Galeria de");
  const [titleHighlight, setTitleHighlight] = useState("Viagens");
  const [subtitle, setSubtitle] = useState("Inspire-se com destinos incríveis escolhidos por mulheres como você");
  const [images, setImages] = useState<GalleryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("site_content").select("content").eq("section_key", "gallery").maybeSingle().then(({ data }) => {
      if (data?.content) {
        const c = data.content as Record<string, string>;
        if (c.title_prefix) setTitlePrefix(c.title_prefix);
        if (c.title_highlight) setTitleHighlight(c.title_highlight);
        if (c.subtitle) setSubtitle(c.subtitle);
      }
    });
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("gallery_images")
        .select("id, url, category, title, description, display_order")
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
              <div key={img.id} className="group relative rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow">
                <img
                  src={img.url}
                  alt={img.title || "Galeria"}
                  loading="lazy"
                  width={800}
                  height={600}
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <div>
                    <h3 className="text-primary-foreground font-semibold">{img.title || img.category}</h3>
                    {img.description && <p className="text-primary-foreground/80 text-sm">{img.description}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Gallery;
