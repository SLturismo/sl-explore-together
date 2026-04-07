import heroImg from "@/assets/hero-beach.jpg";

const Hero = () => {
  return (
    <section id="inicio" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img src={heroImg} alt="Destino paradisíaco" className="w-full h-full object-cover" width={1920} height={1080} />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/60 via-foreground/40 to-foreground/70" />
      </div>

      <div className="relative z-10 container mx-auto px-4 text-center">
        <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground mb-6 animate-fade-in">
          Nunca é tarde para
          <span className="block text-sunshine mt-2">viver seus sonhos</span>
        </h1>
        <p className="text-lg md:text-xl text-primary-foreground/90 max-w-2xl mx-auto mb-8 font-body opacity-0 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          Viagens exclusivas para mulheres que buscam liberdade, segurança e experiências inesquecíveis.
        </p>
        <a
          href="#planejar"
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-lg text-lg font-semibold transition-all hover:scale-105 shadow-lg opacity-0 animate-fade-in"
          style={{ animationDelay: "0.4s" }}
        >
          ✈️ Planejar minha viagem
        </a>
      </div>
    </section>
  );
};

export default Hero;
