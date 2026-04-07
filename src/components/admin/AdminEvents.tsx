import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus } from "lucide-react";

type Event = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  event_date: string | null;
  location: string | null;
  spots: number | null;
  active: boolean | null;
};

const AdminEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [form, setForm] = useState({ title: "", description: "", event_date: "", location: "", spots: "" });
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const fetchEvents = async () => {
    const { data } = await supabase.from("events").select("*").order("created_at", { ascending: false });
    setEvents(data || []);
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleCreate = async () => {
    if (!form.title) return;
    const { error } = await supabase.from("events").insert({
      title: form.title,
      description: form.description || null,
      event_date: form.event_date || null,
      location: form.location || null,
      spots: form.spots ? parseInt(form.spots) : null,
    });
    if (error) {
      toast({ title: "Erro ao criar evento", variant: "destructive" });
    } else {
      toast({ title: "Evento criado!" });
      setForm({ title: "", description: "", event_date: "", location: "", spots: "" });
      fetchEvents();
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from("events").update({ active: !active }).eq("id", id);
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, active: !active } : e)));
  };

  const handleDelete = async (id: string) => {
    await supabase.from("events").delete().eq("id", id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
    toast({ title: "Evento removido" });
  };

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardContent className="p-4 space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2"><Plus className="h-4 w-4" /> Novo Evento</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Título *</Label>
              <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Data</Label>
              <Input value={form.event_date} onChange={(e) => setForm((p) => ({ ...p, event_date: e.target.value }))} placeholder="Ex: Agosto 2026" />
            </div>
            <div className="space-y-1">
              <Label>Local</Label>
              <Input value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Vagas</Label>
              <Input type="number" value={form.spots} onChange={(e) => setForm((p) => ({ ...p, spots: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Descrição</Label>
            <Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3} />
          </div>
          <Button onClick={handleCreate} className="bg-primary hover:bg-primary/90">Criar Evento</Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {events.map((event) => (
          <Card key={event.id} className="border-border">
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-foreground truncate">{event.title}</h4>
                <p className="text-sm text-muted-foreground">{event.location} · {event.event_date} · {event.spots} vagas</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={event.active ?? false} onCheckedChange={() => toggleActive(event.id, event.active ?? false)} />
                <Button variant="destructive" size="icon" onClick={() => handleDelete(event.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminEvents;
