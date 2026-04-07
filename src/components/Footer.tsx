import { Instagram, Phone, Mail, MapPin } from "lucide-react";
import logoImg from "@/assets/logo-sl-turismo.jpg";

const Footer = () => {
  return (
    <footer className="bg-foreground text-primary-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <img src={logoImg} alt="SL Turismo" className="h-16 w-auto rounded-lg mb-4" />
            <p className="text-primary-foreground/70 text-sm">
              Viagens exclusivas para mulheres que sonham em explorar o mundo com liberdade e segurança.
            </p>
          </div>

          <div>
            <h4 className="font-display text-lg font-semibold mb-4">Navegação</h4>
            <nav className="flex flex-col gap-2 text-sm text-primary-foreground/70">
              <a href="#inicio" className="hover:text-primary transition-colors">Início</a>
              <a href="#galeria" className="hover:text-primary transition-colors">Galeria</a>
              <a href="#planejar" className="hover:text-primary transition-colors">Planeje sua Viagem</a>
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

        <div className="border-t border-primary-foreground/10 mt-8 pt-6 text-center text-xs text-primary-foreground/50">
          © {new Date().getFullYear()} SL Turismo. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
