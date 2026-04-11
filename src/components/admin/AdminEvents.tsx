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
  id: string; title: string; description: string | null; image_url: string | null;
  event_date: string | null; location: string | null; spots: number | null; active: boolean | null;
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
      title: form.title, description: form.description || null,
      event_date: form.event_date || null, location: form.location || null,
      spots: form.spots ? parseInt(form.spots) : null,
    });
    if (!error) { toast({ title: "Evento criado!" }); setForm(emptyForm); setShowCreate(false); fetchEvents(); }
    else toast({ title: "Erro ao criar evento", variant: "destructive" });
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from("events").update({ active: !active }).eq("id", id);
    setEvents((p) => p.map((e) => (e.id === id ? { ...e, active: !active } : e)));
  };

  const handleDelete = async (id: string) => {
    await supabase.from("events").delete().eq("id", id);
    setEvents((p) => p.filter((e) => e.id !== id));
    toast({ title: "Evento removido" });
  };

  const openEdit = (event: Event) => {
    setEditModal(event);
    setEditForm({ title: event.title, description: event.description || "", event_date: event.event_date || "", location: event.location || "", spots: event.spots?.toString() || "" });
  };

  const saveEdit = async () => {
    if (!editModal) return;
    const { error } = await supabase.from("events").update({
      title: editForm.title, description: editForm.description || null,
      event_date: editForm.event_date || null, location: editForm.location || null,
      spots: editForm.spots ? parseInt(editForm.spots) : null,
    }).eq("id", editModal.id);
    if (!error) {
      setEvents((p) => p.map((e) => e.id === editModal.id ? { ...e, title: editForm.title, description: editForm.description || null, event_date: editForm.event_date || null, location: editForm.location || null, spots: editForm.spots ? parseInt(editForm.spots) : null } : e));
      setEditModal(null); toast({ title: "Evento atualizado!" });
    }
  };

  const uploadEventImage = async (id: string, file: File) => {
    const fileName = `${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("events").upload(fileName, file);
    if (uploadError) { toast({ title: "Erro no upload", variant: "destructive" }); return; }
    const { data: urlData } = supabase.storage.from("events").getPublicUrl(fileName);
    await supabase.from("events").update({ image_url: urlData.publicUrl }).eq("id", id);
    setEvents((p) => p.map((e) => e.id === id ? { ...e, image_url: urlData.publicUrl } : e));
    if (editModal?.id === id) setEditModal((p) => p ? { ...p, image_url: urlData.publicUrl } : null);
    toast({ title: "Imagem atualizada!" });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{events.length} eventos cadastrados</p>
        <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5"><Plus className="h-3.5 w-3.5" />Novo Evento</Button>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground"><CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>Nenhum evento cadastrado.</p></div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div key={event.id} className="bg-card rounded-lg border border-border p-4 flex gap-4 items-start hover:shadow-md transition-shadow">
              {event.image_url ? (
                <img src={event.image_url} alt={event.title} className="w-20 h-20 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center shrink-0"><CalendarDays className="h-6 w-6 text-muted-foreground/30" /></div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-foreground truncate">{event.title}</h3>
                  <Badge variant={event.active ? "default" : "outline"} className="text-[10px] shrink-0">{event.active ? "Ativo" : "Inativo"}</Badge>
                </div>
                {event.description && <p className="text-xs text-muted-foreground line-clamp-1 mb-1.5">{event.description}</p>}
                <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                  {event.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location}</span>}
                  {event.event_date && <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{event.event_date}</span>}
                  {event.spots !== null && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{event.spots} vagas</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Switch checked={event.active ?? false} onCheckedChange={() => toggleActive(event.id, event.active ?? false)} />
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(event)}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(event.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">Novo Evento</DialogTitle></DialogHeader>
          <div className="space-y-3">
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
            <div className="space-y-3">
              {editModal.image_url && <img src={editModal.image_url} alt="" className="w-full h-32 object-cover rounded-lg" />}
              <div className="space-y-1.5"><Label>Título</Label><Input value={editForm.title} onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Data</Label><Input value={editForm.event_date} onChange={(e) => setEditForm((p) => ({ ...p, event_date: e.target.value }))} /></div>
                <div className="space-y-1.5"><Label>Local</Label><Input value={editForm.location} onChange={(e) => setEditForm((p) => ({ ...p, location: e.target.value }))} /></div>
              </div>
              <div className="space-y-1.5"><Label>Vagas</Label><Input type="number" value={editForm.spots} onChange={(e) => setEditForm((p) => ({ ...p, spots: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Descrição</Label><Textarea value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} rows={3} /></div>
              <label className="flex items-center gap-2 text-sm text-primary cursor-pointer underline font-medium">
                <Upload className="h-4 w-4" />{editModal.image_url ? "Substituir imagem" : "Adicionar imagem"}
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
