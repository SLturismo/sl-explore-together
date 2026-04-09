import { useState } from "react";
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

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    const { error } = await supabase.from("newsletter_subscribers").insert({ email: email.trim() });
    setLoading(false);
    if (error) {
      if (error.code === "23505") {
        toast({ title: "Você já está inscrito(a)! 😊" });
      } else {
        toast({ title: "Erro ao inscrever", variant: "destructive" });
      }
    } else {
      toast({ title: "Inscrito(a) com sucesso! 🎉" });
      setEmail("");
    }
  };

  return (
    <>
      {/* Newsletter section */}
      <section className="bg-foreground py-12">
        <div className="container mx-auto px-4 text-center">
          <h3 className="font-display text-2xl font-bold text-primary-foreground mb-2">
            Receba nossas novidades
          </h3>
          <p className="text-primary-foreground/80 text-sm mb-6">
            Fique por dentro dos próximos destinos e eventos exclusivos
          </p>
          <form onSubmit={handleNewsletter} className="flex gap-2 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Seu melhor e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white/90 border-0 text-foreground placeholder:text-muted-foreground"
            />
            <Button type="submit" variant="secondary" disabled={loading} className="shrink-0">
              {loading ? "..." : "Assinar"}
            </Button>
          </form>
        </div>
      </section>

      <footer className="bg-foreground text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <img src={logoImg} alt="SL Turismo" className="h-16 w-auto rounded-lg mb-4" />
              <p className="text-primary-foreground/70 text-sm">
                Viagens exclusivas e eventos para quem sonha em explorar o mundo com liberdade e segurança.
              </p>
            </div>

            <div>
              <h4 className="font-display text-lg font-semibold mb-4">Navegação</h4>
              <nav className="flex flex-col gap-2 text-sm text-primary-foreground/70">
                <a href="#inicio" className="hover:text-primary transition-colors">Início</a>
                <a href="#galeria" className="hover:text-primary transition-colors">Galeria</a>
                <a href="#planejar" className="hover:text-primary transition-colors">Viagens & Eventos</a>
                <a href="#eventos" className="hover:text-primary transition-colors">Eventos</a>
                <a href="#sobre" className="hover:text-primary transition-colors">Sobre</a>
              </nav>
            </div>

            <div>
              <h4 className="font-display text-lg font-semibold mb-4">Contato</h4>
              <div className="flex flex-col gap-3 text-sm text-primary-foreground/70">
                <a href="https://wa.me/5567999535548" className="flex items-center gap-2 hover:text-primary transition-colors">
                  <Phone className="h-4 w-4" /> (67) 99953-5548
                </a>
                <span className="flex items-center gap-2">
                  <Mail className="h-4 w-4" /> contato@slturismo.com.br
                </span>
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Campo Grande - MS
                </span>
              </div>
              <div className="flex gap-3 mt-4">
                <a href="#" className="text-primary-foreground/70 hover:text-primary transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>

          {/* Cadastur + Admin link */}
          <div className="border-t border-primary-foreground/10 mt-8 pt-6 flex flex-col md:flex-row items-center justify-center gap-4">
            <div className="flex items-center gap-2 text-xs text-primary-foreground/50 justify-center text-center">
              <ShieldCheck className="h-4 w-4" />
              Agência regularizada pelo Ministério do Turismo — Cadastur
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/admin/login"
                className="flex items-center gap-1 text-xs text-primary-foreground/30 hover:text-primary-foreground/60 transition-colors"
              >
                <Lock className="h-3 w-3" />
                Acesso Admin
              </a>
            </div>
          </div>

          <div className="border-t border-primary-foreground/10 mt-4 pt-4 text-center text-xs text-primary-foreground/50">
            © {new Date().getFullYear()} SL Turismo. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
