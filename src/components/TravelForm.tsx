import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSectionVisible } from "@/contexts/PublicSiteContext";

const TravelForm = () => {
  const visible = useSectionVisible("travel_form");
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", destination: "", dates: "", budget: "", trip_type: "", notes: "" });

  const [titlePrefix, setTitlePrefix] = useState("Planeje sua");
  const [titleHighlight, setTitleHighlight] = useState("Viagem ou Evento");
  const [subtitle, setSubtitle] = useState("Conte-nos seus sonhos e criaremos a viagem ou evento perfeito para você");
  const [buttonText, setButtonText] = useState("✈️ Enviar Solicitação");

  useEffect(() => {
    supabase.from("site_content").select("content").eq("section_key", "travel_form").maybeSingle().then(({ data }) => {
      if (data?.content) {
        const c = data.content as any;
        if (c.title_prefix) setTitlePrefix(c.title_prefix);
        if (c.title_highlight) setTitleHighlight(c.title_highlight);
        if (c.subtitle) setSubtitle(c.subtitle);
        if (c.button_text) setButtonText(c.button_text);
      }
    });
  }, []);

  const handleChange = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.destination) { toast({ title: "Preencha os campos obrigatórios", variant: "destructive" }); return; }
    setLoading(true);
    const { error } = await supabase.from("travel_requests").insert({
      name: form.name.trim().slice(0, 100), email: form.email.trim().slice(0, 255),
      phone: form.phone.trim().slice(0, 20), destination: form.destination.trim().slice(0, 200),
      dates: form.dates.trim().slice(0, 100), budget: form.budget.trim().slice(0, 50),
      trip_type: form.trip_type, notes: form.notes.trim().slice(0, 1000), status: "pending",
    });
    setLoading(false);
    if (error) { toast({ title: "Erro ao enviar. Tente novamente.", variant: "destructive" }); }
    else { toast({ title: "Solicitação enviada com sucesso! 🎉", description: "Entraremos em contato em breve." }); setForm({ name: "", email: "", phone: "", destination: "", dates: "", budget: "", trip_type: "", notes: "" }); }
  };

  if (!visible) return null;

  return (
    <section id="planejar" className="py-20 bg-background">
      <div className="container mx-auto px-4 max-w-2xl">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-center text-foreground mb-4">
          {titlePrefix} <span className="text-primary">{titleHighlight}</span>
        </h2>
        <p className="text-center text-muted-foreground mb-10">{subtitle}</p>

        <form onSubmit={handleSubmit} className="space-y-5 bg-card p-6 md:p-8 rounded-xl shadow-lg border border-border">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label htmlFor="name">Nome *</Label><Input id="name" value={form.name} onChange={(e) => handleChange("name", e.target.value)} placeholder="Seu nome" maxLength={100} required /></div>
            <div className="space-y-2"><Label htmlFor="email">E-mail *</Label><Input id="email" type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} placeholder="seu@email.com" maxLength={255} required /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label htmlFor="phone">Telefone</Label><Input id="phone" value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} placeholder="(67) 99999-9999" maxLength={20} /></div>
            <div className="space-y-2"><Label htmlFor="destination">Destino desejado *</Label><Input id="destination" value={form.destination} onChange={(e) => handleChange("destination", e.target.value)} placeholder="Ex: Maldivas, Paris..." maxLength={200} required /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label htmlFor="dates">Datas pretendidas</Label><Input id="dates" value={form.dates} onChange={(e) => handleChange("dates", e.target.value)} placeholder="Ex: Julho 2026" maxLength={100} /></div>
            <div className="space-y-2"><Label htmlFor="budget">Orçamento</Label><Input id="budget" value={form.budget} onChange={(e) => handleChange("budget", e.target.value)} placeholder="Ex: R$ 5.000 - R$ 10.000" maxLength={50} /></div>
          </div>
          <div className="space-y-2">
            <Label>Tipo de viagem</Label>
            <Select value={form.trip_type} onValueChange={(v) => handleChange("trip_type", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="solo">Viagem Solo</SelectItem>
                <SelectItem value="grupo">Viagem em Grupo</SelectItem>
                <SelectItem value="casal">Viagem a Dois</SelectItem>
                <SelectItem value="familia">Viagem em Família</SelectItem>
                <SelectItem value="lua-de-mel">Lua de Mel</SelectItem>
                <SelectItem value="evento">Organização de Evento</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label htmlFor="notes">Observações</Label><Textarea id="notes" value={form.notes} onChange={(e) => handleChange("notes", e.target.value)} placeholder="Nos conte mais sobre sua viagem dos sonhos..." maxLength={1000} rows={4} /></div>
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-6" disabled={loading}>
            {loading ? "Enviando..." : buttonText}
          </Button>
        </form>
      </div>
    </section>
  );
};

export default TravelForm;
