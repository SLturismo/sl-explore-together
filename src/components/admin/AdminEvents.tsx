import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Pencil, Check, X } from "lucide-react";

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", event_date: "", location: "", spots: "" });
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

  const startEdit = (event: Event) => {
    setEditingId(event.id);
    setEditForm({
      title: event.title,
      description: event.description || "",
      event_date: event.event_date || "",
      location: event.location || "",
      spots: event.spots?.toString() || "",
    });
  };

  const saveEdit = async (id: string) => {
    const { error } = await supabase.from("events").update({
      title: editForm.title,
      description: editForm.description || null,
      event_date: editForm.event_date || null,
      location: editForm.location || null,
      spots: editForm.spots ? parseInt(editForm.spots) : null,
    }).eq("id", id);
    if (error) {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    } else {
      setEvents((prev) => prev.map((e) => e.id === id ? {
        ...e,
        title: editForm.title,
        description: editForm.description || null,
        event_date: editForm.event_date || null,
        location: editForm.location || null,
        spots: editForm.spots ? parseInt(editForm.spots) : null,
      } : e));
      setEditingId(null);
      toast({ title: "Evento atualizado!" });
    }
  };

  const uploadEventImage = async (id: string, file: File) => {
    const fileName = `${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("events").upload(fileName, file);
    if (uploadError) { toast({ title: "Erro no upload", variant: "destructive" }); return; }
    const { data: urlData } = supabase.storage.from("events").getPublicUrl(fileName);
    const { error } = await supabase.from("events").update({ image_url: urlData.publicUrl }).eq("id", id);
    if (!error) {
      setEvents((prev) => prev.map((e) => e.id === id ? { ...e, image_url: urlData.publicUrl } : e));
      toast({ title: "Imagem do evento atualizada!" });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardContent className="p-4 space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2"><Plus className="h-4 w-4" /> Novo Evento</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Título *</Label><Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Data</Label><Input value={form.event_date} onChange={(e) => setForm((p) => ({ ...p, event_date: e.target.value }))} placeholder="Ex: Agosto 2026" /></div>
            <div className="space-y-1"><Label>Local</Label><Input value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Vagas</Label><Input type="number" value={form.spots} onChange={(e) => setForm((p) => ({ ...p, spots: e.target.value }))} /></div>
          </div>
          <div className="space-y-1"><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3} /></div>
          <Button onClick={handleCreate} className="bg-primary hover:bg-primary/90">Criar Evento</Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {events.map((event) => (
          <Card key={event.id} className="border-border">
            <CardContent className="p-4">
              {editingId === event.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1"><Label>Título</Label><Input value={editForm.title} onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))} /></div>
                    <div className="space-y-1"><Label>Data</Label><Input value={editForm.event_date} onChange={(e) => setEditForm((p) => ({ ...p, event_date: e.target.value }))} /></div>
                    <div className="space-y-1"><Label>Local</Label><Input value={editForm.location} onChange={(e) => setEditForm((p) => ({ ...p, location: e.target.value }))} /></div>
                    <div className="space-y-1"><Label>Vagas</Label><Input type="number" value={editForm.spots} onChange={(e) => setEditForm((p) => ({ ...p, spots: e.target.value }))} /></div>
                  </div>
                  <div className="space-y-1"><Label>Descrição</Label><Textarea value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} rows={3} /></div>
                  <label className="block text-xs text-muted-foreground cursor-pointer underline">
                    {event.image_url ? "Substituir imagem" : "Adicionar imagem"}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadEventImage(event.id, e.target.files[0])} />
                  </label>
                  {event.image_url && <img src={event.image_url} alt="" className="h-20 rounded object-cover" />}
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => saveEdit(event.id)} className="gap-1"><Check className="h-3 w-3" />Salvar</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}><X className="h-3 w-3" />Cancelar</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0 flex items-center gap-3">
                    {event.image_url && <img src={event.image_url} alt="" className="h-12 w-12 rounded object-cover shrink-0" />}
                    <div>
                      <h4 className="font-semibold text-foreground truncate">{event.title}</h4>
                      <p className="text-sm text-muted-foreground">{event.location} · {event.event_date} · {event.spots} vagas</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => startEdit(event)}><Pencil className="h-4 w-4" /></Button>
                    <Switch checked={event.active ?? false} onCheckedChange={() => toggleActive(event.id, event.active ?? false)} />
                    <Button variant="destructive" size="icon" onClick={() => handleDelete(event.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminEvents;
