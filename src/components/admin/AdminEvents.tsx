import { useCallback, useEffect, useState } from "react";
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
import { AdminThumbCropEditor } from "@/components/admin/AdminThumbCropEditor";
import { GalleryCoverThumb } from "@/components/GalleryCoverThumb";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { CropRectPct } from "@/lib/gallery-crop";
import { clampCropPan, defaultCropRectPct, parseCropFromRow } from "@/lib/gallery-crop";

type Event = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  event_date: string | null;
  location: string | null;
  spots: number | null;
  active: boolean | null;
  crop_x?: number | null;
  crop_y?: number | null;
  crop_w?: number | null;
  crop_h?: number | null;
};

const emptyForm = { title: "", description: "", event_date: "", location: "", spots: "" };

const AdminEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [createImageFile, setCreateImageFile] = useState<File | null>(null);
  const [createPreviewUrl, setCreatePreviewUrl] = useState<string | null>(null);
  const [createNatural, setCreateNatural] = useState<{ nw: number; nh: number } | null>(null);
  const [createCrop, setCreateCrop] = useState<CropRectPct | null>(null);
  const [galleryImageFit, setGalleryImageFit] = useState<"cover" | "contain">("cover");
  const [editModal, setEditModal] = useState<Event | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [replaceDraft, setReplaceDraft] = useState<{ file: File; previewUrl: string } | null>(null);
  const [replaceCrop, setReplaceCrop] = useState<CropRectPct | null>(null);
  const [replaceNatural, setReplaceNatural] = useState<{ nw: number; nh: number } | null>(null);
  const { toast } = useToast();

  const loadGalleryImageFit = useCallback(async () => {
    const { data } = await supabase.from("site_content").select("content").eq("section_key", "gallery").maybeSingle();
    if (data?.content) {
      const c = data.content as Record<string, string>;
      if (c.image_fit === "contain" || c.image_fit === "cover") {
        setGalleryImageFit(c.image_fit);
        return;
      }
    }
    setGalleryImageFit("cover");
  }, []);

  const handleCreateNaturalChange = useCallback((n: { nw: number; nh: number } | null) => {
    setCreateNatural(n);
  }, []);

  const handleReplaceNaturalChange = useCallback((n: { nw: number; nh: number } | null) => {
    setReplaceNatural(n);
  }, []);

  const fetchEvents = async () => {
    const { data } = await supabase.from("events").select("*").order("created_at", { ascending: false });
    setEvents(data || []);
  };

  useEffect(() => {
    void loadGalleryImageFit();
  }, [loadGalleryImageFit, editModal, showCreate]);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (!createImageFile) {
      setCreatePreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setCreateNatural(null);
      setCreateCrop(null);
      return;
    }
    setCreateNatural(null);
    setCreateCrop(null);
    const url = URL.createObjectURL(createImageFile);
    setCreatePreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [createImageFile]);

  useEffect(() => {
    if (!createNatural || galleryImageFit !== "cover" || !createPreviewUrl) return;
    setCreateCrop((c) => c ?? defaultCropRectPct(createNatural.nw, createNatural.nh));
  }, [createNatural, galleryImageFit, createPreviewUrl]);

  useEffect(() => {
    if (!replaceDraft || !replaceNatural || galleryImageFit !== "cover") return;
    setReplaceCrop((c) => c ?? defaultCropRectPct(replaceNatural.nw, replaceNatural.nh));
  }, [replaceDraft, replaceNatural, galleryImageFit]);

  const closeEditModal = () => {
    setReplaceDraft((d) => {
      if (d?.previewUrl) URL.revokeObjectURL(d.previewUrl);
      return null;
    });
    setReplaceCrop(null);
    setReplaceNatural(null);
    setEditModal(null);
  };

  const cancelReplaceDraft = () => {
    setReplaceDraft((d) => {
      if (d?.previewUrl) URL.revokeObjectURL(d.previewUrl);
      return null;
    });
    setReplaceCrop(null);
    setReplaceNatural(null);
  };

  const uploadEventImageImmediate = async (id: string, file: File) => {
    const fileName = `${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("events").upload(fileName, file);
    if (uploadError) {
      toast({ title: "Erro no upload", variant: "destructive" });
      return;
    }
    const { data: urlData } = supabase.storage.from("events").getPublicUrl(fileName);
    await supabase
      .from("events")
      .update({ image_url: urlData.publicUrl, crop_x: null, crop_y: null, crop_w: null, crop_h: null })
      .eq("id", id);
    setEvents((p) =>
      p.map((e) =>
        e.id === id ? { ...e, image_url: urlData.publicUrl, crop_x: null, crop_y: null, crop_w: null, crop_h: null } : e,
      ),
    );
    if (editModal?.id === id) setEditModal((p) => (p ? { ...p, image_url: urlData.publicUrl, crop_x: null, crop_y: null, crop_w: null, crop_h: null } : null));
    toast({ title: "Imagem atualizada!" });
  };

  const commitReplaceEventImage = async () => {
    if (!editModal || !replaceDraft) return;
    const hasCrop =
      galleryImageFit === "cover" && replaceCrop != null && replaceNatural != null
        ? clampCropPan(replaceNatural.nw, replaceNatural.nh, replaceCrop)
        : null;
    const usingCrop = hasCrop != null;
    const fileName = `${Date.now()}-${replaceDraft.file.name}`;
    const { error: uploadError } = await supabase.storage.from("events").upload(fileName, replaceDraft.file);
    if (uploadError) {
      toast({ title: "Erro no upload", variant: "destructive" });
      return;
    }
    const { data: urlData } = supabase.storage.from("events").getPublicUrl(fileName);
    const { error } = await supabase
      .from("events")
      .update({
        image_url: urlData.publicUrl,
        crop_x: usingCrop ? hasCrop.x : null,
        crop_y: usingCrop ? hasCrop.y : null,
        crop_w: usingCrop ? hasCrop.w : null,
        crop_h: usingCrop ? hasCrop.h : null,
      })
      .eq("id", editModal.id);
    if (error) {
      toast({ title: "Erro ao substituir imagem", variant: "destructive" });
      return;
    }
    if (replaceDraft.previewUrl) URL.revokeObjectURL(replaceDraft.previewUrl);
    setReplaceDraft(null);
    setReplaceCrop(null);
    setReplaceNatural(null);
    const nextRow = {
      ...editModal,
      image_url: urlData.publicUrl,
      crop_x: usingCrop ? hasCrop.x : null,
      crop_y: usingCrop ? hasCrop.y : null,
      crop_w: usingCrop ? hasCrop.w : null,
      crop_h: usingCrop ? hasCrop.h : null,
    };
    setEditModal(nextRow);
    setEvents((p) => p.map((e) => (e.id === editModal.id ? nextRow : e)));
    toast({ title: "Imagem atualizada!" });
  };

  const handleCreate = async () => {
    if (!form.title) return;
    const { data: inserted, error } = await supabase
      .from("events")
      .insert({
        title: form.title,
        description: form.description || null,
        event_date: form.event_date || null,
        location: form.location || null,
        spots: form.spots ? parseInt(form.spots, 10) : null,
      })
      .select("id")
      .maybeSingle();
    if (error || !inserted?.id) {
      toast({ title: "Erro ao criar evento", variant: "destructive" });
      return;
    }
    const newId = inserted.id;

    if (createImageFile) {
      const fileName = `${Date.now()}-${createImageFile.name}`;
      const { error: uploadError } = await supabase.storage.from("events").upload(fileName, createImageFile);
      if (uploadError) {
        toast({ title: "Evento criado, mas falhou o envio da imagem", variant: "destructive" });
        setForm(emptyForm);
        setCreateImageFile(null);
        setShowCreate(false);
        fetchEvents();
        return;
      }
      const { data: urlData } = supabase.storage.from("events").getPublicUrl(fileName);
      const hasCrop =
        galleryImageFit === "cover" && createCrop != null && createNatural != null
          ? clampCropPan(createNatural.nw, createNatural.nh, createCrop)
          : null;
      const usingCrop = hasCrop != null;
      await supabase
        .from("events")
        .update({
          image_url: urlData.publicUrl,
          crop_x: usingCrop ? hasCrop.x : null,
          crop_y: usingCrop ? hasCrop.y : null,
          crop_w: usingCrop ? hasCrop.w : null,
          crop_h: usingCrop ? hasCrop.h : null,
        })
        .eq("id", newId);
    }

    toast({ title: "Evento criado!" });
    setForm(emptyForm);
    setCreateImageFile(null);
    setShowCreate(false);
    fetchEvents();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("events").update({ active: !current }).eq("id", id);
    setEvents((p) => p.map((e) => (e.id === id ? { ...e, active: !current } : e)));
  };

  const handleDelete = async (id: string) => {
    await supabase.from("events").delete().eq("id", id);
    setEvents((p) => p.filter((e) => e.id !== id));
    toast({ title: "Evento removido" });
  };

  const openEdit = (event: Event) => {
    setReplaceDraft((d) => {
      if (d?.previewUrl) URL.revokeObjectURL(d.previewUrl);
      return null;
    });
    setReplaceCrop(null);
    setReplaceNatural(null);
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
    if (replaceDraft) {
      toast({
        title: "Substituição pendente",
        description: "Envie ou cancele a nova imagem antes de salvar os outros dados.",
        variant: "destructive",
      });
      return;
    }
    const { error } = await supabase
      .from("events")
      .update({
        title: editForm.title,
        description: editForm.description || null,
        event_date: editForm.event_date || null,
        location: editForm.location || null,
        spots: editForm.spots ? parseInt(editForm.spots, 10) : null,
      })
      .eq("id", editModal.id);
    if (!error) {
      setEvents((p) =>
        p.map((e) =>
          e.id === editModal.id
            ? {
                ...e,
                title: editForm.title,
                description: editForm.description || null,
                event_date: editForm.event_date || null,
                location: editForm.location || null,
                spots: editForm.spots ? parseInt(editForm.spots, 10) : null,
              }
            : e,
        ),
      );
      closeEditModal();
      toast({ title: "Evento atualizado!" });
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-foreground">{events.length} eventos cadastrados</p>
          <p className="text-xs text-muted-foreground mt-0.5">Gerencie eventos e imagens associadas.</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1.5 shrink-0">
          <Plus className="h-3.5 w-3.5" />
          Novo evento
        </Button>
      </div>

      {events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/90 bg-muted/20 px-6 py-16 text-center">
          <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/35 mb-4" strokeWidth={1.25} />
          <p className="text-sm font-medium text-foreground">Nenhum evento cadastrado</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">Crie o primeiro evento para o painel passar a listá-lo aqui.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const thumbCrop = parseCropFromRow(event);
            return (
              <div key={event.id} className="bg-card rounded-xl border border-border/80 p-4 flex gap-4 items-start shadow-sm hover:shadow-md transition-all">
                {event.image_url ? (
                  <GalleryCoverThumb
                    src={event.image_url}
                    alt={event.title}
                    crop={thumbCrop}
                    className="h-20 w-20 shrink-0 rounded-lg"
                    objectCoverClass="object-cover"
                    imageFit="cover"
                    width={160}
                    height={160}
                  />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <CalendarDays className="h-6 w-6 text-muted-foreground/30" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-foreground truncate">{event.title}</h3>
                    <Badge variant={event.active ? "default" : "outline"} className="text-[10px] shrink-0">
                      {event.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  {event.description && <p className="text-xs text-muted-foreground line-clamp-1 mb-1.5">{event.description}</p>}
                  <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                    {event.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {event.location}
                      </span>
                    )}
                    {event.event_date && (
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {event.event_date}
                      </span>
                    )}
                    {event.spots !== null && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {event.spots} vagas
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex">
                        <Switch checked={event.active ?? false} onCheckedChange={() => toggleActive(event.id, event.active ?? false)} />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      Quando inativo, o evento deixa de aparecer na secção pública «Eventos» do site.
                    </TooltipContent>
                  </Tooltip>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(event)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(event.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog
        open={showCreate}
        onOpenChange={(open) => {
          setShowCreate(open);
          if (!open) {
            setForm(emptyForm);
            setCreateImageFile(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Novo Evento</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Título *</Label>
              <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Data</Label>
                <Input
                  value={form.event_date}
                  onChange={(e) => setForm((p) => ({ ...p, event_date: e.target.value }))}
                  placeholder="Ex: Agosto 2026"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Local</Label>
                <Input value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Vagas</Label>
              <Input type="number" value={form.spots} onChange={(e) => setForm((p) => ({ ...p, spots: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3} />
            </div>
            <label className="flex items-center gap-2 text-sm text-primary cursor-pointer font-medium w-fit">
              <Upload className="h-4 w-4 shrink-0" />
              <span className="underline">{createImageFile ? createImageFile.name : "Imagem do evento (opcional)"}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setCreateImageFile(e.target.files?.[0] ?? null)}
              />
            </label>
            {galleryImageFit === "cover" && createPreviewUrl && createCrop ? (
              <AdminThumbCropEditor
                imageSrc={createPreviewUrl}
                crop={createCrop}
                onCropChange={setCreateCrop}
                onNaturalChange={handleCreateNaturalChange}
                showHelpTrigger
              />
            ) : null}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                Cancelar
              </Button>
              <Button onClick={() => void handleCreate()}>Criar Evento</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editModal} onOpenChange={(open) => !open && closeEditModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Editar Evento</DialogTitle>
          </DialogHeader>
          {editModal && (
            <div className="space-y-3">
              {editModal.image_url && !replaceDraft ? (
                <GalleryCoverThumb
                  src={editModal.image_url}
                  alt=""
                  crop={parseCropFromRow(editModal)}
                  className="w-full h-32 rounded-lg"
                  objectCoverClass="object-cover"
                  imageFit="cover"
                  width={800}
                  height={400}
                />
              ) : null}
              <div className="space-y-1.5">
                <Label>Título</Label>
                <Input value={editForm.title} onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Data</Label>
                  <Input value={editForm.event_date} onChange={(e) => setEditForm((p) => ({ ...p, event_date: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Local</Label>
                  <Input value={editForm.location} onChange={(e) => setEditForm((p) => ({ ...p, location: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Vagas</Label>
                <Input type="number" value={editForm.spots} onChange={(e) => setEditForm((p) => ({ ...p, spots: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Descrição</Label>
                <Textarea value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} rows={3} />
              </div>
              {replaceDraft && galleryImageFit === "cover" && replaceCrop ? (
                <div className="space-y-3 rounded-lg border border-border/80 bg-muted/20 p-3">
                  <p className="text-xs font-medium text-foreground">Nova imagem — ajuste o recorte antes de enviar</p>
                  <AdminThumbCropEditor
                    imageSrc={replaceDraft.previewUrl}
                    crop={replaceCrop}
                    onCropChange={setReplaceCrop}
                    onNaturalChange={handleReplaceNaturalChange}
                    showHelpTrigger
                  />
                  <div className="flex flex-wrap gap-2 justify-end">
                    <Button type="button" variant="outline" size="sm" onClick={cancelReplaceDraft}>
                      Cancelar substituição
                    </Button>
                    <Button type="button" size="sm" onClick={() => void commitReplaceEventImage()}>
                      Enviar nova imagem
                    </Button>
                  </div>
                </div>
              ) : null}
              {replaceDraft && galleryImageFit === "cover" && !replaceCrop ? (
                <p className="text-xs text-muted-foreground">A carregar pré-visualização…</p>
              ) : null}
              {!replaceDraft ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <label className="flex items-center gap-2 text-sm text-primary cursor-pointer underline font-medium w-fit">
                      <Upload className="h-4 w-4 shrink-0" />
                      {editModal.image_url ? "Substituir imagem" : "Adicionar imagem"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          e.target.value = "";
                          if (!f || !editModal) return;
                          if (galleryImageFit !== "cover") {
                            void uploadEventImageImmediate(editModal.id, f);
                            return;
                          }
                          setReplaceDraft((d) => {
                            if (d?.previewUrl) URL.revokeObjectURL(d.previewUrl);
                            return { file: f, previewUrl: URL.createObjectURL(f) };
                          });
                          setReplaceCrop(null);
                          setReplaceNatural(null);
                        }}
                      />
                    </label>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    Com a galeria do site em «Preencher o quadro», pode ajustar o recorte da miniatura antes de confirmar o envio.
                  </TooltipContent>
                </Tooltip>
              ) : galleryImageFit === "contain" ? null : (
                <p className="text-xs text-muted-foreground">Cancele ou envie a substituição em curso para escolher outro ficheiro.</p>
              )}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={closeEditModal}>
                  Cancelar
                </Button>
                <Button onClick={() => void saveEdit()}>Salvar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEvents;
