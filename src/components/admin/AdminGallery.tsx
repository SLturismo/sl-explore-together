import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
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
import type { CropRectPct } from "@/lib/gallery-crop";
import {
  clampCropPan,
  defaultCropRectPct,
  moveCropByDisplayDelta,
  objectContainMetrics,
  parseCropFromRow,
  zoomCropAroundCenter,
} from "@/lib/gallery-crop";

type GalleryImage = {
  id: string;
  url: string;
  category: string;
  title: string | null;
  description: string | null;
  display_order: number | null;
  is_visible: boolean;
  focal_x?: number | null;
  focal_y?: number | null;
  object_position?: string | null;
  crop: CropRectPct | null;
};

function focalIntFromRow(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.round(Math.max(0, Math.min(100, n)));
}

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

/** Host do projeto Supabase embutido no build (Vercel → Environment Variables). */
function supabaseApiHost(): string {
  const raw = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  if (!raw?.trim()) return "(VITE_SUPABASE_URL em falta no build)";
  try {
    return new URL(raw.trim()).hostname;
  } catch {
    return raw.trim();
  }
}

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
    focal_x: focalIntFromRow(r.focal_x),
    focal_y: focalIntFromRow(r.focal_y),
    object_position: (r.object_position as string | null | undefined) ?? null,
    crop: parseCropFromRow(r),
  };
}

const AdminGallery = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  /** True quando a API (PostgREST) não expõe is_visible — confirmado por SELECT * sem chave ou PGRST204. */
  const [apiMissingIsVisible, setApiMissingIsVisible] = useState(false);
  /** Postgres 42703 no probe select(id,is_visible) → coluna inexistente na BD deste URL (evidência em runtime). */
  const [postgresColumnMissing42703, setPostgresColumnMissing42703] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [createFile, setCreateFile] = useState<File | null>(null);
  const [editModal, setEditModal] = useState<GalleryImage | null>(null);
  const [editForm, setEditForm] = useState({
    category: "",
    title: "",
    description: "",
    focal_x: null as number | null,
    focal_y: null as number | null,
  });
  /** Modo global da galeria (Conteúdo → Galeria): foco só aplica em «cover». */
  const [galleryImageFit, setGalleryImageFit] = useState<"cover" | "contain">("cover");
  const focalAreaRef = useRef<HTMLDivElement>(null);
  const [focalDragging, setFocalDragging] = useState(false);
  const [focalAreaHover, setFocalAreaHover] = useState(false);
  const [cropDragging, setCropDragging] = useState(false);
  const [editNatural, setEditNatural] = useState<{ nw: number; nh: number } | null>(null);
  const [editCrop, setEditCrop] = useState<CropRectPct | null>(null);
  const cropEditorRef = useRef<HTMLDivElement>(null);
  const cropDragRef = useRef<{ lastX: number; lastY: number } | null>(null);
  const [cropEditorBox, setCropEditorBox] = useState({ w: 0, h: 0 });
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

  useEffect(() => {
    void loadGalleryImageFit();
  }, [loadGalleryImageFit]);

  useEffect(() => {
    if (editModal) void loadGalleryImageFit();
  }, [editModal, loadGalleryImageFit]);

  useEffect(() => {
    if (!editModal) {
      setFocalDragging(false);
      setCropDragging(false);
    }
  }, [editModal]);

  useEffect(() => {
    if (!editModal) {
      setEditNatural(null);
      return;
    }
    const url = editModal.url;
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.onload = () => {
      if (im.naturalWidth > 0 && im.naturalHeight > 0) setEditNatural({ nw: im.naturalWidth, nh: im.naturalHeight });
      else setEditNatural(null);
    };
    im.onerror = () => setEditNatural(null);
    im.src = url;
    return () => {
      im.onload = null;
      im.onerror = null;
    };
  }, [editModal?.id, editModal?.url]);

  const fetchImages = async () => {
    console.log(`${LOG} fetchImages:start`);
    const { data, error, status } = await supabase
      .from("gallery_images")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) {
      setApiMissingIsVisible(false);
      setPostgresColumnMissing42703(false);
      console.error(`${LOG} fetchImages:error`, {
        status,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
    } else {
      const sample = data?.[0] as Record<string, unknown> | undefined;
      const probe = await supabase.from("gallery_images").select("id,is_visible").limit(1).maybeSingle();

      const pg42703 =
        !!probe.error &&
        (probe.error.code === "42703" || /does not exist/i.test(probe.error.message ?? ""));
      setPostgresColumnMissing42703(pg42703);

      const missingCol =
        !!sample && !Object.prototype.hasOwnProperty.call(sample, "is_visible");
      setApiMissingIsVisible(missingCol);
      console.log(`${LOG} fetchImages:ok`, {
        status,
        rowCount: data?.length ?? 0,
        firstRowKeys: sample ? Object.keys(sample) : [],
        firstRowIsVisible: sample?.is_visible,
        firstRowId: sample?.id,
        probeSelectIsVisible: probe.data?.is_visible,
        probeError: probe.error?.code ?? null,
      });
      if (missingCol) {
        console.warn(
          `${LOG} Coluna is_visible ausente na API (host ${supabaseApiHost()}). No Supabase desse mesmo projeto: SQL Editor → só o ALTER + NOTIFY; Table Editor → gallery_images → deve aparecer is_visible.`,
        );
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
    setEditCrop(img.crop);
    setEditForm({
      category: img.category,
      title: img.title || "",
      description: img.description || "",
      focal_x: img.focal_x ?? null,
      focal_y: img.focal_y ?? null,
    });
  };

  const setFocalFromClient = useCallback((clientX: number, clientY: number) => {
    const el = focalAreaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    if (!w || !h) return;
    const x = ((clientX - rect.left) / w) * 100;
    const y = ((clientY - rect.top) / h) * 100;
    const fx = Math.round(Math.max(0, Math.min(100, x)));
    const fy = Math.round(Math.max(0, Math.min(100, y)));
    setEditForm((p) => ({ ...p, focal_x: fx, focal_y: fy }));
  }, []);

  useEffect(() => {
    if (!focalDragging) return;
    const onMove = (e: PointerEvent) => setFocalFromClient(e.clientX, e.clientY);
    const onEnd = () => setFocalDragging(false);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
    };
  }, [focalDragging, setFocalFromClient]);

  useEffect(() => {
    if (!cropDragging || !editCrop || !editNatural) return;
    const onMove = (e: PointerEvent) => {
      const el = cropEditorRef.current;
      if (!el || !cropDragRef.current) return;
      const rect = el.getBoundingClientRect();
      const m = objectContainMetrics(rect.width, rect.height, editNatural.nw, editNatural.nh);
      const dx = e.clientX - cropDragRef.current.lastX;
      const dy = e.clientY - cropDragRef.current.lastY;
      cropDragRef.current = { lastX: e.clientX, lastY: e.clientY };
      setEditCrop((c) => (c ? moveCropByDisplayDelta(editNatural.nw, editNatural.nh, c, dx, dy, m.scale) : c));
    };
    const onEnd = () => {
      cropDragRef.current = null;
      setCropDragging(false);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
    };
  }, [cropDragging, editCrop, editNatural]);

  useLayoutEffect(() => {
    if (!editModal || galleryImageFit !== "cover") {
      setCropEditorBox({ w: 0, h: 0 });
      return;
    }
    const el = cropEditorRef.current;
    if (!el) {
      setCropEditorBox({ w: 0, h: 0 });
      return;
    }
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setCropEditorBox({ w: Math.max(1, r.width), h: Math.max(1, r.height) });
    });
    ro.observe(el);
    const r = el.getBoundingClientRect();
    setCropEditorBox({ w: Math.max(1, r.width), h: Math.max(1, r.height) });
    return () => ro.disconnect();
  }, [editModal?.id, galleryImageFit, editCrop]);

  const saveEdit = async () => {
    if (!editModal) return;
    const hasCrop =
      editCrop != null && editNatural != null
        ? clampCropPan(editNatural.nw, editNatural.nh, editCrop)
        : null;
    const usingCrop = hasCrop != null;
    const hasFocal = !usingCrop && editForm.focal_x != null && editForm.focal_y != null;
    const patch: {
      category: string;
      title: string | null;
      description: string | null;
      focal_x: number | null;
      focal_y: number | null;
      crop_x: number | null;
      crop_y: number | null;
      crop_w: number | null;
      crop_h: number | null;
      object_position?: string | null;
    } = {
      category: editForm.category,
      title: editForm.title || null,
      description: editForm.description || null,
      focal_x: hasFocal ? editForm.focal_x : null,
      focal_y: hasFocal ? editForm.focal_y : null,
      crop_x: usingCrop ? hasCrop.x : null,
      crop_y: usingCrop ? hasCrop.y : null,
      crop_w: usingCrop ? hasCrop.w : null,
      crop_h: usingCrop ? hasCrop.h : null,
    };
    if (hasFocal || usingCrop) patch.object_position = null;

    const { error } = await supabase.from("gallery_images").update(patch).eq("id", editModal.id);
    if (error) {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    } else {
      setImages((prev) =>
        prev.map((i) =>
          i.id === editModal.id
            ? {
                ...i,
                category: editForm.category,
                title: editForm.title || null,
                description: editForm.description || null,
                focal_x: usingCrop ? null : hasFocal ? editForm.focal_x : null,
                focal_y: usingCrop ? null : hasFocal ? editForm.focal_y : null,
                object_position: hasFocal || usingCrop ? null : i.object_position,
                crop: usingCrop ? hasCrop : null,
              }
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
    const { error } = await supabase
      .from("gallery_images")
      .update({
        url: urlData.publicUrl,
        crop_x: null,
        crop_y: null,
        crop_w: null,
        crop_h: null,
      })
      .eq("id", id);
    if (!error) {
      setImages((prev) =>
        prev.map((i) => (i.id === id ? { ...i, url: urlData.publicUrl, crop: null } : i)),
      );
      if (editModal?.id === id) {
        setEditCrop(null);
        setEditModal((prev) => (prev ? { ...prev, url: urlData.publicUrl, crop: null } : null));
      }
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
              Esta página fala com o Supabase em{" "}
              <code className="rounded bg-background/80 px-1 break-all">{supabaseApiHost()}</code>. O SQL tem de ser executado{" "}
              <strong>nesse</strong> projeto (noutro <code className="rounded bg-background/80 px-1">*.supabase.co</code> não altera este site).
            </p>
            {postgresColumnMissing42703 && (
              <p className="text-xs font-semibold border border-destructive/40 rounded-md p-2 bg-background/50">
                Diagnóstico confirmado: Postgres responde que <code className="px-1">is_visible</code>{" "}
                <strong>não existe</strong> em <code className="px-1">public.gallery_images</code> nesta base (erro 42703).
                No Table Editor essa coluna não deve aparecer. Se já correu o <code className="px-1">ALTER</code>, confirme que foi na
                base <strong>Production</strong> deste projeto (não só num branch de pré-visualização) e volte a executar o SQL abaixo.
              </p>
            )}
            <p className="text-xs">
              Confirme em <strong>Table Editor → gallery_images</strong> se existe a coluna <code className="rounded bg-background/80 px-1">is_visible</code>.
              Se não existir, no <strong>SQL Editor</strong> apague qualquer texto extra e execute <strong>só</strong> o bloco abaixo; depois{" "}
              <code className="rounded bg-background/80 px-1">NOTIFY pgrst, 'reload schema';</code> (ou reinicie o projeto em Settings).
            </p>
            <pre className="text-xs bg-background/90 text-foreground p-3 rounded-md overflow-x-auto border border-border">
              {`ALTER TABLE public.gallery_images
  ADD COLUMN IF NOT EXISTS is_visible boolean NOT NULL DEFAULT true;
NOTIFY pgrst, 'reload schema';`}
            </pre>
            <p className="text-xs">
              Recarregue esta página com cache limpo (Ctrl+Shift+R). O interruptor «Visível no site» só funciona quando a API devolver{" "}
              <code className="rounded bg-background/80 px-1">is_visible</code> nas linhas.
            </p>
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
              {galleryImageFit === "contain" ? (
                <div className="rounded-lg border border-border/70 bg-muted/25 px-3 py-2.5 text-sm text-muted-foreground">
                  A galeria no site está em <strong className="text-foreground">«Mostrar imagem inteira»</strong> (Conteúdo →
                  Galeria). O ponto de foco só é usado com <strong className="text-foreground">«Preencher o quadro»</strong>.
                </div>
              ) : editCrop ? (
                <div className="space-y-2">
                  <Label>Recorte na miniatura (4:3)</Label>
                  <div
                    ref={cropEditorRef}
                    role="presentation"
                    className="relative w-full touch-none overflow-hidden rounded-lg border border-border/80 bg-muted/30 select-none min-h-[200px]"
                    onWheel={(e) => {
                      if (!editNatural || !editCrop) return;
                      e.preventDefault();
                      const dir = e.deltaY > 0 ? 1.06 : 0.94;
                      setEditCrop(zoomCropAroundCenter(editNatural.nw, editNatural.nh, editCrop, dir));
                    }}
                  >
                    <img
                      src={editModal.url}
                      alt=""
                      className="pointer-events-none block max-h-[240px] w-full object-contain mx-auto"
                      draggable={false}
                    />
                    {editNatural &&
                      (() => {
                        const { ox, oy, scale } = objectContainMetrics(
                          cropEditorBox.w,
                          cropEditorBox.h,
                          editNatural.nw,
                          editNatural.nh,
                        );
                        const box = cropEditorBox;
                        if (!box.w || !box.h) return null;
                        return (
                          <div
                            role="presentation"
                            className="absolute z-[2] cursor-move rounded-sm border-2 border-primary bg-primary/10 shadow-[0_0_0_1px_rgba(0,0,0,0.35)] touch-none"
                            style={{
                              left: ox + (editCrop.x / 100) * editNatural.nw * scale,
                              top: oy + (editCrop.y / 100) * editNatural.nh * scale,
                              width: (editCrop.w / 100) * editNatural.nw * scale,
                              height: (editCrop.h / 100) * editNatural.nh * scale,
                            }}
                            onPointerDown={(e) => {
                              if (e.button !== 0) return;
                              e.preventDefault();
                              cropDragRef.current = { lastX: e.clientX, lastY: e.clientY };
                              setCropDragging(true);
                            }}
                          />
                        );
                      })()}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Arraste o retângulo. Use a roda do rato sobre a imagem para aproximar ou afastar. Isto só altera a
                    miniatura na galeria; ao clicar para ver em grande, a foto continua inteira.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!editNatural || !editCrop}
                      onClick={() =>
                        editNatural &&
                        editCrop &&
                        setEditCrop(zoomCropAroundCenter(editNatural.nw, editNatural.nh, editCrop, 0.92))
                      }
                    >
                      Mais zoom
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!editNatural || !editCrop}
                      onClick={() =>
                        editNatural &&
                        editCrop &&
                        setEditCrop(zoomCropAroundCenter(editNatural.nw, editNatural.nh, editCrop, 1.08))
                      }
                    >
                      Menos zoom
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!editNatural}
                      onClick={() => editNatural && setEditCrop(defaultCropRectPct(editNatural.nw, editNatural.nh))}
                    >
                      Repor máximo
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setEditCrop(null)}>
                      Limpar recorte
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label>Ponto de foco no corte</Label>
                  <div
                    ref={focalAreaRef}
                    role="presentation"
                    className="relative w-full touch-none overflow-hidden rounded-lg border border-border/80 bg-muted/30 select-none"
                    onPointerEnter={() => setFocalAreaHover(true)}
                    onPointerLeave={() => setFocalAreaHover(false)}
                    onPointerDown={(e) => {
                      if (e.button !== 0) return;
                      e.preventDefault();
                      setFocalFromClient(e.clientX, e.clientY);
                      setFocalDragging(true);
                    }}
                  >
                    <img
                      src={editModal.url}
                      alt=""
                      className="pointer-events-none block h-44 w-full object-cover"
                      draggable={false}
                    />
                    {(focalAreaHover || focalDragging) && editForm.focal_x != null && editForm.focal_y != null && (
                      <>
                        <div
                          className="pointer-events-none absolute inset-y-0 z-[1] w-px bg-white/90 shadow-[1px_0_0_rgba(0,0,0,0.35)]"
                          style={{ left: `${editForm.focal_x}%` }}
                          aria-hidden
                        />
                        <div
                          className="pointer-events-none absolute inset-x-0 z-[1] h-px bg-white/90 shadow-[0_1px_0_rgba(0,0,0,0.35)]"
                          style={{ top: `${editForm.focal_y}%` }}
                          aria-hidden
                        />
                      </>
                    )}
                    {editForm.focal_x != null && editForm.focal_y != null ? (
                      <span
                        className="pointer-events-none absolute z-[2] h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-primary shadow-lg ring-2 ring-black/25"
                        style={{ left: `${editForm.focal_x}%`, top: `${editForm.focal_y}%` }}
                        aria-hidden
                      />
                    ) : null}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Clique ou arraste na imagem para marcar a zona que deve permanecer visível ao cortar as miniaturas.
                  </p>
                  <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={() => setEditForm((p) => ({ ...p, focal_x: null, focal_y: null }))}
                    >
                      Repor (automático)
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="w-full sm:w-auto"
                      disabled={!editNatural}
                      onClick={() => editNatural && setEditCrop(defaultCropRectPct(editNatural.nw, editNatural.nh))}
                    >
                      Definir recorte 4:3 (miniatura)
                    </Button>
                  </div>
                </div>
              )}
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
