import { useEffect, useState } from "react";
import { Heart, Shield, Star, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logoImg from "@/assets/logo-sl-turismo.jpg";

const icons = [Heart, Shield, Star, Users];

const defaultDiffs = [
  { title: "Feito por Mulheres", description: "Entendemos suas necessidades e criamos experiências que fazem sentido para você." },
  { title: "Segurança em Primeiro Lugar", description: "Cada detalhe é planejado para que você viaje com tranquilidade e confiança." },
  { title: "Experiências Únicas", description: "Roteiros personalizados que vão além do turismo convencional." },
  { title: "Comunidade", description: "Conecte-se com mulheres incríveis que compartilham a paixão por viajar." },
];

const defaultText1 = "A SL Turismo nasceu do sonho de criar experiências de viagem que empoderem e inspirem mulheres a explorar o mundo com confiança e liberdade.";
const defaultText2 = "Acreditamos que toda mulher merece viver aventuras inesquecíveis, seja sozinha, com amigas ou em grupo. Nossos roteiros são cuidadosamente planejados para oferecer segurança, conforto e momentos que ficarão para sempre na memória.";

const About = () => {
  const [titlePrefix, setTitlePrefix] = useState("Sobre a");
  const [titleHighlight, setTitleHighlight] = useState("SL Turismo");
  const [text1, setText1] = useState(defaultText1);
  const [text2, setText2] = useState(defaultText2);
  const [diffs, setDiffs] = useState(defaultDiffs);

  useEffect(() => {
    supabase.from("site_content").select("content").eq("section_key", "about").maybeSingle().then(({ data }) => {
      if (data?.content) {
        const c = data.content as any;
        if (c.title_prefix) setTitlePrefix(c.title_prefix);
        if (c.title_highlight) setTitleHighlight(c.title_highlight);
        if (c.text1) setText1(c.text1);
        if (c.text2) setText2(c.text2);
        const updated = [...defaultDiffs];
        for (let i = 0; i < 4; i++) {
          if (c[`diff${i + 1}_title`]) updated[i] = { ...updated[i], title: c[`diff${i + 1}_title`] };
          if (c[`diff${i + 1}_desc`]) updated[i] = { ...updated[i], description: c[`diff${i + 1}_desc`] };
        }
        setDiffs(updated);
      }
    });
  }, []);

  return (
    <section id="sobre" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
              {titlePrefix} <span className="text-primary">{titleHighlight}</span>
            </h2>
            <p className="text-muted-foreground mb-4 leading-relaxed">{text1}</p>
            <p className="text-muted-foreground mb-8 leading-relaxed">{text2}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {diffs.map((item, i) => {
                const Icon = icons[i];
                return (
                  <div key={i} className="flex gap-3 p-3 rounded-lg bg-rose-light">
                    <Icon className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-foreground text-sm">{item.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-center">
            <div className="relative">
              <div className="bg-gradient-to-br from-primary/20 to-gold/20 rounded-2xl p-8 flex items-center justify-center">
                <img src={logoImg} alt="SL Turismo" className="w-64 h-64 object-contain rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
