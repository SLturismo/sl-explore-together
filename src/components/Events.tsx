import { Calendar, MapPin, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import galleryGroup from "@/assets/gallery-group.jpg";
import galleryResort from "@/assets/gallery-resort.jpg";
import galleryBeach from "@/assets/gallery-beach.jpg";

const events = [
  {
    title: "Retreat Feminino em Bali",
    description: "7 dias de autoconhecimento, yoga e conexão com a natureza em Bali, Indonésia.",
    date: "Agosto 2026",
    location: "Bali, Indonésia",
    image: galleryResort,
    spots: 12,
  },
  {
    title: "Tour pela Toscana",
    description: "Explore vinícolas, gastronomia e paisagens encantadoras da Itália em um grupo exclusivo.",
    date: "Outubro 2026",
    location: "Toscana, Itália",
    image: galleryGroup,
    spots: 8,
  },
  {
    title: "Caribe All-Inclusive",
    description: "Relaxe em um resort 5 estrelas com tudo incluso. Sol, praia e muita diversão.",
    date: "Dezembro 2026",
    location: "Cancún, México",
    image: galleryBeach,
    spots: 15,
  },
];

const Events = () => {
  return (
    <section id="eventos" className="py-20 bg-rose-light">
      <div className="container mx-auto px-4">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-center text-foreground mb-4">
          Eventos & <span className="text-primary">Experiências</span>
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
          Viagens em grupo e tours exclusivos para mulheres que querem explorar o mundo juntas
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event, i) => (
            <Card key={i} className="overflow-hidden hover:shadow-xl transition-shadow border-border">
              <div className="relative h-48 overflow-hidden">
                <img src={event.image} alt={event.title} loading="lazy" width={800} height={600} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full font-medium">
                  {event.spots} vagas
                </div>
              </div>
              <CardContent className="p-5 space-y-3">
                <h3 className="font-display text-xl font-semibold text-foreground">{event.title}</h3>
                <p className="text-sm text-muted-foreground">{event.description}</p>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{event.date}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location}</span>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" />{event.spots} vagas</span>
                </div>
                <a href="https://wa.me/5567999535548?text=Olá! Tenho interesse no evento: ${encodeURIComponent(event.title)}" target="_blank" rel="noopener noreferrer">
                  <Button className="w-full mt-2 bg-primary hover:bg-primary/90">Quero participar</Button>
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Events;
