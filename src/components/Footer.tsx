import { useState, useEffect } from "react";
import { Instagram, Phone, Mail, MapPin, ShieldCheck, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import logoImg from "@/assets/logo-sl-turismo.jpg";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [content, setContent] = useState({
    newsletter_title: "Receba nossas novidades",
    newsletter_subtitle: "Fique por dentro dos próximos destinos e eventos exclusivos",
    newsletter_button: "Assinar",
    description: "Viagens exclusivas e eventos para quem sonha em explorar o mundo com liberdade e segurança.",
    phone: "(67) 99953-5548",
    phone_link: "5567999535548",
    email_addr: "contato@slturismo.com.br",
    city: "Campo Grande - MS",
    navs: ["Início", "Galeria", "Viagens & Eventos", "Eventos", "Sobre"],
  });

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("site_content").select("*").in("section_key", ["newsletter", "footer"]);
      if (data) {
        data.forEach((row) => {
          const c = row.content as any;
          if (row.section_key === "newsletter") {
            setContent((p) => ({
              ...p,
              newsletter_title: c.title || p.newsletter_title,
              newsletter_subtitle: c.subtitle || p.newsletter_subtitle,
              newsletter_button: c.button_text || p.newsletter_button,
            }));
          }
          if (row.section_key === "footer") {
            setContent((p) => ({
              ...p,
              description: c.description || p.description,
              phone: c.phone || p.phone,
              phone_link: c.phone_link || p.phone_link,
              email_addr: c.email || p.email_addr,
              city: c.city || p.city,
              navs: [c.nav1 || p.navs[0], c.nav2 || p.navs[1], c.nav3 || p.navs[2], c.nav4 || p.navs[3], c.nav5 || p.navs[4]],
            }));
          }
        });
      }
    };
    load();
  }, []);

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    const { error } = await supabase.from("newsletter_subscribers").insert({ email: email.trim() });
    setLoading(false);
    if (error) {
      toast({ title: error.code === "23505" ? "Você já está inscrito(a)! 😊" : "Erro ao inscrever", variant: error.code === "23505" ? "default" : "destructive" });
    } else {
      toast({ title: "Inscrito(a) com sucesso! 🎉" });
      setEmail("");
    }
  };

  const navHrefs = ["#inicio", "#galeria", "#planejar", "#eventos", "#sobre"];

  return (
    <>
      {/* Newsletter section */}
      <section className="bg-primary py-12">
        <div className="container mx-auto px-4 text-center">
          <h3 className="font-display text-2xl font-bold text-primary-foreground mb-2">{content.newsletter_title}</h3>
          <p className="text-primary-foreground/80 text-sm mb-6">{content.newsletter_subtitle}</p>
          <form onSubmit={handleNewsletter} className="flex gap-2 max-w-md mx-auto">
            <Input type="email" placeholder="Seu melhor e-mail" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-white/90 border-0 text-foreground placeholder:text-muted-foreground" />
            <Button type="submit" variant="secondary" disabled={loading} className="shrink-0">{loading ? "..." : content.newsletter_button}</Button>
          </form>
        </div>
      </section>

      <footer className="bg-foreground text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <img src={logoImg} alt="SL Turismo" className="h-16 w-auto rounded-lg mb-4" />
              <p className="text-primary-foreground/70 text-sm">{content.description}</p>
            </div>

            <div>
              <h4 className="font-display text-lg font-semibold mb-4">Navegação</h4>
              <nav className="flex flex-col gap-2 text-sm text-primary-foreground/70">
                {content.navs.map((nav, i) => (
                  <a key={i} href={navHrefs[i]} className="hover:text-primary transition-colors">{nav}</a>
                ))}
              </nav>
            </div>

            <div>
              <h4 className="font-display text-lg font-semibold mb-4">Contato</h4>
              <div className="flex flex-col gap-3 text-sm text-primary-foreground/70">
                <a href={`https://wa.me/${content.phone_link}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                  <Phone className="h-4 w-4" /> {content.phone}
                </a>
                <span className="flex items-center gap-2"><Mail className="h-4 w-4" /> {content.email_addr}</span>
                <span className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {content.city}</span>
              </div>
              <div className="flex gap-3 mt-4">
                <a href="#" className="text-primary-foreground/70 hover:text-primary transition-colors"><Instagram className="h-5 w-5" /></a>
              </div>
            </div>
          </div>

          {/* Cadastur + Admin */}
          <div className="border-t border-primary-foreground/10 mt-8 pt-6 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-primary-foreground/50 text-center">
              <ShieldCheck className="h-4 w-4" />
              Agência regularizada pelo Ministério do Turismo — Cadastur
            </div>
            <a href="/admin/login" className="flex items-center gap-1 text-xs text-primary-foreground/30 hover:text-primary-foreground/60 transition-colors">
              <Lock className="h-3 w-3" /> Acesso Admin
            </a>
          </div>

          <div className="border-t border-primary-foreground/10 mt-4 pt-4 text-center text-xs text-primary-foreground/50">
            <p>© {new Date().getFullYear()} SL Turismo. Todos os direitos reservados.</p>
            <p className="mt-1">
              Desenvolvido por{" "}
              <a href="https://guilhermearevalo.com" target="_blank" rel="noopener noreferrer" className="text-primary-foreground/70 hover:text-primary transition-colors underline">
                Guilherme S. Arevalo
              </a>
              {" "}– Consultoria e Projetos
            </p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
