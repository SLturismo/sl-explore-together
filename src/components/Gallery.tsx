import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import galleryBeach from "@/assets/gallery-beach.jpg";
import galleryInternational from "@/assets/gallery-international.jpg";
import gallerySolo from "@/assets/gallery-solo.jpg";
import galleryGroup from "@/assets/gallery-group.jpg";
import galleryResort from "@/assets/gallery-resort.jpg";

const categories = ["Todas", "Praias", "Internacional", "Solo", "Grupos"];

const images = [
  { src: galleryBeach, category: "Praias", title: "Pôr do sol na praia", description: "Momentos mágicos à beira-mar" },
  { src: galleryInternational, category: "Internacional", title: "Paris, França", description: "Descobrindo o mundo com elegância" },
  { src: gallerySolo, category: "Solo", title: "Aventura solo", description: "Liberdade para ir além" },
  { src: galleryGroup, category: "Grupos", title: "Viagem em grupo", description: "Conexões que transformam" },
  { src: galleryResort, category: "Praias", title: "Resort paradisíaco", description: "Relaxamento e bem-estar" },
];

const Gallery = () => {
  const [active, setActive] = useState("Todas");
  const [titlePrefix, setTitlePrefix] = useState("Galeria de");
  const [titleHighlight, setTitleHighlight] = useState("Viagens");
  const [subtitle, setSubtitle] = useState("Inspire-se com destinos incríveis escolhidos por mulheres como você");

  useEffect(() => {
    supabase.from("site_content").select("content").eq("section_key", "gallery").maybeSingle().then(({ data }) => {
      if (data?.content) {
        const c = data.content as any;
        if (c.title_prefix) setTitlePrefix(c.title_prefix);
        if (c.title_highlight) setTitleHighlight(c.title_highlight);
        if (c.subtitle) setSubtitle(c.subtitle);
      }
    });
  }, []);

  const filtered = active === "Todas" ? images : images.filter((i) => i.category === active);

  return (
    <section id="galeria" className="py-20 bg-rose-light">
      <div className="container mx-auto px-4">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-center text-foreground mb-4">
          {titlePrefix} <span className="text-primary">{titleHighlight}</span>
        </h2>
        <p className="text-center text-muted-foreground mb-8 max-w-xl mx-auto">{subtitle}</p>

        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setActive(cat)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${active === cat ? "bg-primary text-primary-foreground shadow-md" : "bg-card text-muted-foreground hover:bg-primary/10"}`}>{cat}</button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((img, i) => (
            <div key={i} className="group relative rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow">
              <img src={img.src} alt={img.title} loading="lazy" width={800} height={600} className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <div>
                  <h3 className="text-primary-foreground font-semibold">{img.title}</h3>
                  <p className="text-primary-foreground/80 text-sm">{img.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Gallery;
