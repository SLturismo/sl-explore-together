import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Pencil, CalendarDays, MapPin, Users, Upload } from "lucide-react";

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

const emptyForm = { title: "", description: "", event_date: "", location: "", spots: "" };

const AdminEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editModal, setEditModal] = useState<Event | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
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
      setForm(emptyForm);
      setShowCreate(false);
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

  const openEdit = (event: Event) => {
    setEditModal(event);
    setEditForm({
      title: event.title,
      description: event.description || "",
      event_date: event.event_date || "",
      location: event.location || "",
      spots: event.spots?.toString() || "",
    });
  };

  const saveEdit = async () => {
    if (!editModal) return;
    const { error } = await supabase.from("events").update({
      title: editForm.title,
      description: editForm.description || null,
      event_date: editForm.event_date || null,
      location: editForm.location || null,
      spots: editForm.spots ? parseInt(editForm.spots) : null,
    }).eq("id", editModal.id);
    if (error) {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    } else {
      setEvents((prev) => prev.map((e) => e.id === editModal.id ? {
        ...e, title: editForm.title, description: editForm.description || null,
        event_date: editForm.event_date || null, location: editForm.location || null,
        spots: editForm.spots ? parseInt(editForm.spots) : null,
      } : e));
      setEditModal(null);
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
      if (editModal?.id === id) setEditModal((prev) => prev ? { ...prev, image_url: urlData.publicUrl } : null);
      toast({ title: "Imagem atualizada!" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-foreground">{events.length} Eventos</h2>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Novo Evento
        </Button>
      </div>

      {/* Event cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((event) => (
          <div key={event.id} className="bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            {event.image_url ? (
              <div className="aspect-video overflow-hidden">
                <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="aspect-video bg-muted flex items-center justify-center">
                <CalendarDays className="h-10 w-10 text-muted-foreground/30" />
              </div>
            )}
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display font-semibold text-foreground line-clamp-1">{event.title}</h3>
                <Badge variant={event.active ? "default" : "outline"} className="shrink-0 text-xs">
                  {event.active ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              {event.description && <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>}
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                {event.location && (
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location}</span>
                )}
                {event.event_date && (
                  <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{event.event_date}</span>
                )}
                {event.spots !== null && (
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" />{event.spots} vagas</span>
                )}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="flex items-center gap-2">
                  <Switch checked={event.active ?? false} onCheckedChange={() => toggleActive(event.id, event.active ?? false)} />
                  <span className="text-xs text-muted-foreground">{event.active ? "Ativo" : "Inativo"}</span>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(event)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(event.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {events.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum evento cadastrado.</p>
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">Novo Evento</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label>Título *</Label><Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Data</Label><Input value={form.event_date} onChange={(e) => setForm((p) => ({ ...p, event_date: e.target.value }))} placeholder="Ex: Agosto 2026" /></div>
              <div className="space-y-1.5"><Label>Local</Label><Input value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} /></div>
            </div>
            <div className="space-y-1.5"><Label>Vagas</Label><Input type="number" value={form.spots} onChange={(e) => setForm((p) => ({ ...p, spots: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3} /></div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
              <Button onClick={handleCreate}>Criar Evento</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editModal} onOpenChange={(open) => !open && setEditModal(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">Editar Evento</DialogTitle></DialogHeader>
          {editModal && (
            <div className="space-y-4">
              {editModal.image_url && <img src={editModal.image_url} alt="" className="w-full h-32 object-cover rounded-lg" />}
              <div className="space-y-1.5"><Label>Título</Label><Input value={editForm.title} onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Data</Label><Input value={editForm.event_date} onChange={(e) => setEditForm((p) => ({ ...p, event_date: e.target.value }))} /></div>
                <div className="space-y-1.5"><Label>Local</Label><Input value={editForm.location} onChange={(e) => setEditForm((p) => ({ ...p, location: e.target.value }))} /></div>
              </div>
              <div className="space-y-1.5"><Label>Vagas</Label><Input type="number" value={editForm.spots} onChange={(e) => setEditForm((p) => ({ ...p, spots: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Descrição</Label><Textarea value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} rows={3} /></div>
              <label className="flex items-center gap-2 text-sm text-primary cursor-pointer underline font-medium">
                <Upload className="h-4 w-4" />
                {editModal.image_url ? "Substituir imagem" : "Adicionar imagem"}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadEventImage(editModal.id, e.target.files[0])} />
              </label>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditModal(null)}>Cancelar</Button>
                <Button onClick={saveEdit}>Salvar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEvents;
