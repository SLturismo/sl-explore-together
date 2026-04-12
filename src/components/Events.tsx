import { useState, useEffect } from "react";
import { Calendar, MapPin, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import galleryResort from "@/assets/gallery-resort.jpg";

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  location: string | null;
  image_url: string | null;
  spots: number | null;
  active: boolean | null;
};

const Events = () => {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [titlePrefix, setTitlePrefix] = useState("Eventos &");
  const [titleHighlight, setTitleHighlight] = useState("Experiências");
  const [subtitle, setSubtitle] = useState("Viagens em grupo e tours exclusivos para mulheres que querem explorar o mundo juntas");
  const [phoneLink, setPhoneLink] = useState("5567999535548");

  useEffect(() => {
    const load = async () => {
      const [{ data: contentData }, { data: eventsData }, { data: footerData }] = await Promise.all([
        supabase.from("site_content").select("content").eq("section_key", "events").maybeSingle(),
        supabase.from("events").select("*").eq("active", true).order("created_at", { ascending: true }),
        supabase.from("site_content").select("content").eq("section_key", "footer").maybeSingle(),
      ]);

      if (contentData?.content) {
        const c = contentData.content as any;
        if (c.title_prefix) setTitlePrefix(c.title_prefix);
        if (c.title_highlight) setTitleHighlight(c.title_highlight);
        if (c.subtitle) setSubtitle(c.subtitle);
      }

      if (footerData?.content) {
        const f = footerData.content as any;
        if (f.phone_link) setPhoneLink(f.phone_link);
      }

      setEvents(eventsData || []);
      setLoading(false);
    };
    load();
  }, []);

  if (!loading && events.length === 0) return null;

  return (
    <section id="eventos" className="py-20 bg-rose-light">
      <div className="container mx-auto px-4">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-center text-foreground mb-4">
          {titlePrefix} <span className="text-primary">{titleHighlight}</span>
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">{subtitle}</p>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl overflow-hidden bg-card/60 animate-pulse h-80" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Card key={event.id} className="overflow-hidden hover:shadow-xl transition-shadow border-border">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={event.image_url || galleryResort}
                    alt={event.title}
                    loading="lazy"
                    width={800}
                    height={600}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                  {event.spots != null && event.spots > 0 && (
                    <div className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full font-medium">
                      {event.spots} vagas
                    </div>
                  )}
                </div>
                <CardContent className="p-5 space-y-3">
                  <h3 className="font-display text-xl font-semibold text-foreground">{event.title}</h3>
                  {event.description && <p className="text-sm text-muted-foreground">{event.description}</p>}
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {event.event_date && (
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{event.event_date}</span>
                    )}
                    {event.location && (
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location}</span>
                    )}
                    {event.spots != null && event.spots > 0 && (
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{event.spots} vagas</span>
                    )}
                  </div>
                  <a
                    href={`https://wa.me/${phoneLink}?text=${encodeURIComponent(`Olá! Tenho interesse no evento: ${event.title}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="w-full mt-2 bg-primary hover:bg-primary/90">Quero participar</Button>
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Events;
