import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Trash2, Plus, Pencil, ArrowUp, ArrowDown, Upload, ImageIcon, AlertCircle } from "lucide-react";

type GalleryImage = {
  id: string;
  url: string;
  category: string;
  title: string | null;
  description: string | null;
  display_order: number | null;
  is_visible: boolean;
};

const categories = [
  "Praias",
  "Montanhas",
  "Cidades",
  "Resorts",
  "Internacional",
  "Solo",
  "Grupos",
  "Aventura",
  "Cultura",
  "Gastronomia",
  "Outros",
];

const emptyForm = { category: "Praias", title: "", description: "" };

const LOG = "[AdminGallery]";

/** API sem coluna is_visible devolve undefined → tratamos como visível (evita badge/switch contraditórios). */
function normalizeGalleryRow(row: unknown): GalleryImage {
  const r = row as Record<string, unknown>;
  return {
    id: r.id as string,
    url: r.url as string,
    category: r.category as string,
    title: (r.title as string | null) ?? null,
    description: (r.description as string | null) ?? null,
    display_order: (r.display_order as number | null) ?? null,
    is_visible: r.is_visible !== false,
  };
}

const AdminGallery = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  /** True quando a API (PostgREST) não expõe is_visible — confirmado por SELECT * sem chave ou PGRST204. */
  const [apiMissingIsVisible, setApiMissingIsVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [createFile, setCreateFile] = useState<File | null>(null);
  const [editModal, setEditModal] = useState<GalleryImage | null>(null);
  const [editForm, setEditForm] = useState({ category: "", title: "", description: "" });
  const { toast } = useToast();

  const fetchImages = async () => {
    console.log(`${LOG} fetchImages:start`);
    const { data, error, status } = await supabase
      .from("gallery_images")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) {
      setApiMissingIsVisible(false);
      console.error(`${LOG} fetchImages:error`, {
        status,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
    } else {
      const sample = data?.[0] as Record<string, unknown> | undefined;
      const missingCol =
        !!sample && !Object.prototype.hasOwnProperty.call(sample, "is_visible");
      setApiMissingIsVisible(missingCol);
      console.log(`${LOG} fetchImages:ok`, {
        status,
        rowCount: data?.length ?? 0,
        firstRowKeys: sample ? Object.keys(sample) : [],
        firstRowIsVisible: sample?.is_visible,
        firstRowId: sample?.id,
      });
      if (missingCol) {
        console.warn(
          `${LOG} Coluna is_visible ausente na API. Abra o Supabase cujo URL = VITE_SUPABASE_URL na Vercel, rode o ALTER em gallery_images e NOTIFY pgrst, 'reload schema';`,
        );
        // #region agent log
        fetch("http://127.0.0.1:7349/ingest/5a1044cd-e2f7-43f4-b8a3-db98c50af754", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "686b8a" },
          body: JSON.stringify({
            sessionId: "686b8a",
            hypothesisId: "H1-H2",
            location: "AdminGallery.tsx:fetchImages",
            message: "SELECT * sem chave is_visible (PostgREST schema)",
            data: { rowCount: data?.length ?? 0, firstRowKeyCount: sample ? Object.keys(sample).length : 0 },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
      }
    }
    setImages((data || []).map(normalizeGalleryRow));
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const persistDisplayOrder = async (ordered: GalleryImage[]) => {
    await Promise.all(
      ordered.map((img, i) => supabase.from("gallery_images").update({ display_order: i }).eq("id", img.id)),
    );
  };

  const handleCreate = async () => {
    if (!createFile) {
      toast({ title: "Selecione uma imagem", variant: "destructive" });
      return;
    }
    setUploading(true);
    const fileName = `${Date.now()}-${createFile.name}`;
    const { error: uploadError } = await supabase.storage.from("gallery").upload(fileName, createFile);
    if (uploadError) {
      toast({ title: "Erro no upload", variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("gallery").getPublicUrl(fileName);
    const nextOrder = images.length;
    const { error } = await supabase.from("gallery_images").insert({
      url: urlData.publicUrl,
      category: form.category,
      title: form.title || null,
      description: form.description || null,
      display_order: nextOrder,
      is_visible: true,
    });
    if (error) {
      toast({ title: "Erro ao salvar imagem", variant: "destructive" });
    } else {
      toast({ title: "Imagem adicionada!" });
      setForm(emptyForm);
      setCreateFile(null);
      setShowCreate(false);
      fetchImages();
    }
    setUploading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("gallery_images").delete().eq("id", id);
    if (!error) {
      toast({ title: "Imagem removida" });
      fetchImages();
    }
  };

  const openEdit = (img: GalleryImage) => {
    setEditModal(img);
    setEditForm({ category: img.category, title: img.title || "", description: img.description || "" });
  };

  const saveEdit = async () => {
    if (!editModal) return;
    const { error } = await supabase
      .from("gallery_images")
      .update({
        category: editForm.category,
        title: editForm.title || null,
        description: editForm.description || null,
      })
      .eq("id", editModal.id);
    if (error) {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    } else {
      setImages((prev) =>
        prev.map((i) =>
          i.id === editModal.id
            ? { ...i, category: editForm.category, title: editForm.title || null, description: editForm.description || null }
            : i,
        ),
      );
      setEditModal(null);
      toast({ title: "Imagem atualizada!" });
    }
  };

  const replaceImage = async (id: string, file: File) => {
    const fileName = `${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("gallery").upload(fileName, file);
    if (uploadError) {
      toast({ title: "Erro no upload", variant: "destructive" });
      return;
    }
    const { data: urlData } = supabase.storage.from("gallery").getPublicUrl(fileName);
    const { error } = await supabase.from("gallery_images").update({ url: urlData.publicUrl }).eq("id", id);
    if (!error) {
      setImages((prev) => prev.map((i) => (i.id === id ? { ...i, url: urlData.publicUrl } : i)));
      if (editModal?.id === id) setEditModal((prev) => (prev ? { ...prev, url: urlData.publicUrl } : null));
      toast({ title: "Imagem substituída!" });
    }
  };

  const toggleVisible = async (img: GalleryImage, next: boolean) => {
    if (apiMissingIsVisible) {
      toast({
        title: "Base de dados incompleta",
        description: "Corra o SQL no Supabase (projeto do VITE_SUPABASE_URL) para criar is_visible e NOTIFY pgrst.",
        variant: "destructive",
      });
      return;
    }
    console.log(`${LOG} toggleVisible:start`, {
      imageId: img.id,
      next,
      previousVisible: img.is_visible,
    });

    const { data, error, status, statusText } = await supabase
      .from("gallery_images")
      .update({ is_visible: next })
      .eq("id", img.id)
      .select("id,is_visible")
      .maybeSingle();

    if (error) {
      if (error.code === "PGRST204") {
        setApiMissingIsVisible(true);
        // #region agent log
        fetch("http://127.0.0.1:7349/ingest/5a1044cd-e2f7-43f4-b8a3-db98c50af754", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "686b8a" },
          body: JSON.stringify({
            sessionId: "686b8a",
            hypothesisId: "H2",
            location: "AdminGallery.tsx:toggleVisible",
            message: "PGRST204 schema cache",
            data: { code: error.code, status },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
      }
      console.error(`${LOG} toggleVisible:error`, {
        status,
        statusText,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      const extra = [error.hint, error.details].filter(Boolean).join(" — ");
      toast({
        title: "Erro ao atualizar visibilidade",
        description: [error.message, extra].filter(Boolean).join(" ") || undefined,
        variant: "destructive",
        duration: 14_000,
      });
      return;
    }

    if (data == null) {
      console.warn(`${LOG} toggleVisible:noRowReturned`, {
        status,
        statusText,
        imageId: img.id,
        hint: "O UPDATE não devolveu linha (0 matches, RLS a bloquear SELECT após update, ou id/projeto incorreto).",
      });
      toast({
        title: "Visibilidade não gravada",
        description:
          "O servidor não confirmou a linha atualizada. Abra a consola (F12) e procure [AdminGallery] toggleVisible:noRowReturned. Confirme VITE_SUPABASE_URL na Vercel = projeto onde correu o SQL.",
        variant: "destructive",
        duration: 16_000,
      });
      return;
    }

    console.log(`${LOG} toggleVisible:ok`, { status, data });
    setImages((prev) => prev.map((i) => (i.id === img.id ? { ...i, is_visible: data.is_visible } : i)));
  };

  const moveImage = async (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= images.length) return;
    const updated = [...images];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setImages(updated);
    await persistDisplayOrder(updated);
  };

  return (
    <div className="space-y-5">
      {apiMissingIsVisible && (
        <Alert variant="destructive" className="border-destructive/80">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Visibilidade na galeria indisponível (API sem coluna is_visible)</AlertTitle>
          <AlertDescription className="text-destructive/95 space-y-2 mt-2">
            <p>
              O PostgREST devolve PGRST204 / SELECT sem <code className="rounded bg-background/80 px-1">is_visible</code>. Isto é resolvido{" "}
              <strong>só no Supabase</strong> do mesmo projeto que <code className="rounded bg-background/80 px-1">VITE_SUPABASE_URL</code> na Vercel (ex.:{" "}
              <code className="rounded bg-background/80 px-1">miqztsvsaiuhyotoaneb</code>).
            </p>
            <pre className="text-xs bg-background/90 text-foreground p-3 rounded-md overflow-x-auto border border-border">
              {`ALTER TABLE public.gallery_images
  ADD COLUMN IF NOT EXISTS is_visible boolean NOT NULL DEFAULT true;
NOTIFY pgrst, 'reload schema';`}
            </pre>
            <p className="text-xs">Depois recarregue esta página. O interruptor «Visível no site» só funciona após isto.</p>
          </AlertDescription>
        </Alert>
      )}

      <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {images.length} {images.length === 1 ? "imagem" : "imagens"} na galeria
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Ordene, edite metadados ou substitua ficheiros.</p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowCreate(true)}
          className="gap-1.5 shrink-0"
          disabled={apiMissingIsVisible}
          title={apiMissingIsVisible ? "Corra o SQL is_visible no Supabase antes de adicionar imagens" : undefined}
        >
          <Plus className="h-3.5 w-3.5" />
          Nova imagem
        </Button>
      </div>

      {images.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/90 bg-muted/20 px-6 py-16 text-center">
          <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/35 mb-4" strokeWidth={1.25} />
          <p className="text-sm font-medium text-foreground">Galeria vazia</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Adicione fotos para elas aparecerem no site. Pode definir categoria, título e descrição em cada item.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {images.map((img, index) => (
            <div
              key={img.id}
              className={`bg-card rounded-xl border border-border/80 p-4 flex gap-4 items-start shadow-sm hover:shadow-md transition-all ${img.is_visible === false ? "opacity-60" : ""}`}
            >
              <img src={img.url} alt={img.title || ""} className="w-20 h-20 rounded-lg object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-medium text-foreground truncate">{img.title || "Sem título"}</h3>
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    {img.category}
                  </Badge>
                  {img.is_visible === false && (
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      Oculta no site
                    </Badge>
                  )}
                </div>
                {img.description && <p className="text-xs text-muted-foreground line-clamp-2">{img.description}</p>}
                <div className="flex items-center gap-2 mt-3">
                  <Switch
                    id={`vis-${img.id}`}
                    checked={img.is_visible !== false}
                    disabled={apiMissingIsVisible}
                    onCheckedChange={(c) => toggleVisible(img, c)}
                  />
                  <Label htmlFor={`vis-${img.id}`} className="text-xs font-normal cursor-pointer">
                    Visível no site
                  </Label>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1 shrink-0 justify-end">
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => moveImage(index, -1)} disabled={index === 0}>
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => moveImage(index, 1)}
                  disabled={index === images.length - 1}
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(img)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(img.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Dialog
        open={showCreate}
        onOpenChange={(open) => {
          setShowCreate(open);
          if (!open) {
            setForm(emptyForm);
            setCreateFile(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Nova imagem</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Título</Label>
              <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Título da foto" />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Breve descrição"
                rows={3}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-primary cursor-pointer font-medium">
              <Upload className="h-4 w-4 shrink-0" />
              <span className="underline">{createFile ? createFile.name : "Selecionar arquivo"}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setCreateFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={uploading}>
                {uploading ? "Enviando..." : "Adicionar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editModal} onOpenChange={(open) => !open && setEditModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Editar imagem</DialogTitle>
          </DialogHeader>
          {editModal && (
            <div className="space-y-4">
              <img src={editModal.url} alt="" className="w-full h-40 object-cover rounded-lg" />
              <div className="space-y-1.5">
                <Label>Categoria</Label>
                <Select value={editForm.category} onValueChange={(v) => setEditForm((p) => ({ ...p, category: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Título</Label>
                <Input value={editForm.title} onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Descrição</Label>
                <Textarea value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} rows={3} />
              </div>
              <label className="flex items-center gap-2 text-sm text-primary cursor-pointer underline font-medium">
                <Upload className="h-4 w-4" />
                Substituir imagem
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && replaceImage(editModal.id, e.target.files[0])}
                />
              </label>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditModal(null)}>
                  Cancelar
                </Button>
                <Button onClick={saveEdit}>Salvar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminGallery;
