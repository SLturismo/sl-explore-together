import { Heart, Shield, Star, Users } from "lucide-react";
import logoImg from "@/assets/logo-sl-turismo.jpg";

const differentials = [
  { icon: Heart, title: "Feito por Mulheres", description: "Entendemos suas necessidades e criamos experiências que fazem sentido para você." },
  { icon: Shield, title: "Segurança em Primeiro Lugar", description: "Cada detalhe é planejado para que você viaje com tranquilidade e confiança." },
  { icon: Star, title: "Experiências Únicas", description: "Roteiros personalizados que vão além do turismo convencional." },
  { icon: Users, title: "Comunidade", description: "Conecte-se com mulheres incríveis que compartilham a paixão por viajar." },
];

const About = () => {
  return (
    <section id="sobre" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
              Sobre a <span className="text-primary">SL Turismo</span>
            </h2>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              A SL Turismo nasceu do sonho de criar experiências de viagem que empoderem e inspirem mulheres a explorar o mundo com confiança e liberdade.
            </p>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Acreditamos que toda mulher merece viver aventuras inesquecíveis, seja sozinha, com amigas ou em grupo. Nossos roteiros são cuidadosamente planejados para oferecer segurança, conforto e momentos que ficarão para sempre na memória.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {differentials.map((item, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-lg bg-rose-light">
                  <item.icon className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">{item.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                  </div>
                </div>
              ))}
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
