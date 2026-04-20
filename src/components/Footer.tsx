import { useState, useEffect } from "react";
import { Facebook, Instagram, Linkedin, Phone, Mail, MapPin, ShieldCheck, Lock, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { usePublicSite, useSectionVisible } from "@/contexts/PublicSiteContext";
import { safeHttpUrl } from "@/lib/social-url";

const NEWSLETTER_COOLDOWN_MS = 25_000;
const NEWSLETTER_LAST_SUBMIT_KEY = "slturismo_newsletter_last_submit_v1";

const Footer = () => {
  const { logoSrc } = usePublicSite();
  const showNewsletter = useSectionVisible("footer_newsletter");
  const [email, setEmail] = useState("");
  const [newsletterHoneypot, setNewsletterHoneypot] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [content, setContent] = useState({
    newsletter_title: "Receba nossas novidades",
    newsletter_subtitle: "Fique por dentro dos próximos destinos e eventos exclusivos",
    newsletter_button: "Assinar",
    description: "Viagens exclusivas e eventos para quem sonha em explorar o mundo com liberdade e segurança.",
    phone: "(67) 99953-5548",
    phone_link: "5567999535548",
    whatsapp_prefill: "Olá! Gostaria de saber mais sobre as viagens da SL Turismo.",
    email_addr: "contato@slturismo.com.br",
    city: "Campo Grande - MS",
    social_instagram: "",
    social_facebook: "",
    social_youtube: "",
    social_linkedin: "",
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
              whatsapp_prefill: typeof c.whatsapp_prefill === "string" && c.whatsapp_prefill.trim() ? c.whatsapp_prefill : p.whatsapp_prefill,
              email_addr: c.email || p.email_addr,
              city: c.city || p.city,
              social_instagram: typeof c.social_instagram === "string" ? c.social_instagram : p.social_instagram,
              social_facebook: typeof c.social_facebook === "string" ? c.social_facebook : p.social_facebook,
              social_youtube: typeof c.social_youtube === "string" ? c.social_youtube : p.social_youtube,
              social_linkedin: typeof c.social_linkedin === "string" ? c.social_linkedin : p.social_linkedin,
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
    if (newsletterHoneypot.trim()) return;
    if (!email.trim()) return;
    if (typeof window !== "undefined") {
      const lastSubmit = Number(window.localStorage.getItem(NEWSLETTER_LAST_SUBMIT_KEY) || "0");
      const now = Date.now();
      const waitMs = NEWSLETTER_COOLDOWN_MS - (now - lastSubmit);
      if (waitMs > 0) {
        toast({
          title: "Aguarde alguns segundos para tentar novamente",
          description: `Tente novamente em ${Math.ceil(waitMs / 1000)}s.`,
          variant: "default",
        });
        return;
      }
      window.localStorage.setItem(NEWSLETTER_LAST_SUBMIT_KEY, String(now));
    }
    setLoading(true);
    const { error } = await supabase.from("newsletter_subscribers").insert({ email: email.trim() });
    setLoading(false);
    if (error) {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(NEWSLETTER_LAST_SUBMIT_KEY);
      }
      toast({ title: error.code === "23505" ? "Você já está inscrito(a)! 😊" : "Erro ao inscrever", variant: error.code === "23505" ? "default" : "destructive" });
    } else {
      toast({ title: "Inscrito(a) com sucesso! 🎉" });
      setEmail("");
      setNewsletterHoneypot("");
    }
  };

  const navHrefs = ["#inicio", "#galeria", "#planejar", "#eventos", "#sobre"];

  const waDigits = content.phone_link.replace(/\D/g, "");
  const waHref = waDigits
    ? `https://wa.me/${waDigits}?text=${encodeURIComponent(content.whatsapp_prefill || "")}`
    : null;

  const socialEntries = [
    { key: "ig", url: safeHttpUrl(content.social_instagram), Icon: Instagram, label: "Instagram" },
    { key: "fb", url: safeHttpUrl(content.social_facebook), Icon: Facebook, label: "Facebook" },
    { key: "yt", url: safeHttpUrl(content.social_youtube), Icon: Youtube, label: "YouTube" },
    { key: "in", url: safeHttpUrl(content.social_linkedin), Icon: Linkedin, label: "LinkedIn" },
  ].filter((s) => s.url);

  return (
    <>
      {showNewsletter && (
        <section className="bg-primary py-12">
          <div className="container mx-auto px-4 text-center">
            <h3 className="font-display text-2xl font-bold text-primary-foreground mb-2">{content.newsletter_title}</h3>
            <p className="text-primary-foreground/80 text-sm mb-6">{content.newsletter_subtitle}</p>
            <form onSubmit={handleNewsletter} className="flex gap-2 max-w-md mx-auto">
              <input
                type="text"
                name="company"
                value={newsletterHoneypot}
                onChange={(e) => setNewsletterHoneypot(e.target.value)}
                autoComplete="off"
                tabIndex={-1}
                className="hidden"
                aria-hidden="true"
              />
              <Input type="email" placeholder="Seu melhor e-mail" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-white/90 border-0 text-foreground placeholder:text-muted-foreground" />
              <Button type="submit" variant="secondary" disabled={loading} className="shrink-0">{loading ? "..." : content.newsletter_button}</Button>
            </form>
          </div>
        </section>
      )}

      <footer className="bg-foreground text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              {logoSrc ? <img src={logoSrc} alt="SL Turismo" className="h-16 w-auto rounded-lg mb-4" /> : null}
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
                {waHref ? (
                  <a
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-primary transition-colors"
                  >
                    <Phone className="h-4 w-4" /> {content.phone}
                  </a>
                ) : (
                  <span className="flex items-center gap-2">
                    <Phone className="h-4 w-4" /> {content.phone}
                  </span>
                )}
                <a
                  href={`mailto:${content.email_addr}`}
                  className="flex items-center gap-2 hover:text-primary transition-colors"
                >
                  <Mail className="h-4 w-4" /> {content.email_addr}
                </a>
                <span className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {content.city}</span>
              </div>
              {socialEntries.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-4">
                  {socialEntries.map(({ key, url, Icon, label }) => (
                    <a
                      key={key}
                      href={url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-foreground/70 hover:text-primary transition-colors"
                      aria-label={label}
                    >
                      <Icon className="h-5 w-5" />
                    </a>
                  ))}
                </div>
              )}
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
