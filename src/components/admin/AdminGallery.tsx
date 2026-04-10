import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Pencil, ArrowUp, ArrowDown, Upload, ImageIcon } from "lucide-react";

type GalleryImage = {
  id: string;
  url: string;
  category: string;
  title: string | null;
  description: string | null;
  display_order: number | null;
};

const categories = ["Praias", "Montanhas", "Cidades", "Resorts", "Aventura", "Cultura", "Gastronomia", "Outros"];

const AdminGallery = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ category: "Praias", title: "", description: "" });
  const [editModal, setEditModal] = useState<GalleryImage | null>(null);
  const [editForm, setEditForm] = useState({ category: "", title: "", description: "" });
  const { toast } = useToast();

  const fetchImages = async () => {
    const { data } = await supabase.from("gallery_images").select("*").order("display_order");
    setImages(data || []);
  };

  useEffect(() => { fetchImages(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fileName = `${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("gallery").upload(fileName, file);
    if (uploadError) {
      toast({ title: "Erro no upload", variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("gallery").getPublicUrl(fileName);
    const { error } = await supabase.from("gallery_images").insert({
      url: urlData.publicUrl,
      category: form.category,
      title: form.title || null,
      description: form.description || null,
      display_order: images.length,
    });
    if (error) {
      toast({ title: "Erro ao salvar imagem", variant: "destructive" });
    } else {
      toast({ title: "Imagem adicionada!" });
      setForm({ category: "Praias", title: "", description: "" });
      fetchImages();
    }
    setUploading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("gallery_images").delete().eq("id", id);
    if (!error) {
      setImages((prev) => prev.filter((i) => i.id !== id));
      toast({ title: "Imagem removida" });
    }
  };

  const openEdit = (img: GalleryImage) => {
    setEditModal(img);
    setEditForm({ category: img.category, title: img.title || "", description: img.description || "" });
  };

  const saveEdit = async () => {
    if (!editModal) return;
    const { error } = await supabase.from("gallery_images").update({
      category: editForm.category,
      title: editForm.title || null,
      description: editForm.description || null,
    }).eq("id", editModal.id);
    if (error) {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    } else {
      setImages((prev) => prev.map((i) => i.id === editModal.id ? { ...i, category: editForm.category, title: editForm.title || null, description: editForm.description || null } : i));
      setEditModal(null);
      toast({ title: "Imagem atualizada!" });
    }
  };

  const replaceImage = async (id: string, file: File) => {
    const fileName = `${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("gallery").upload(fileName, file);
    if (uploadError) { toast({ title: "Erro no upload", variant: "destructive" }); return; }
    const { data: urlData } = supabase.storage.from("gallery").getPublicUrl(fileName);
    const { error } = await supabase.from("gallery_images").update({ url: urlData.publicUrl }).eq("id", id);
    if (!error) {
      setImages((prev) => prev.map((i) => i.id === id ? { ...i, url: urlData.publicUrl } : i));
      if (editModal?.id === id) setEditModal((prev) => prev ? { ...prev, url: urlData.publicUrl } : null);
      toast({ title: "Imagem substituída!" });
    }
  };

  const moveImage = async (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= images.length) return;
    const updated = [...images];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setImages(updated);
    await supabase.from("gallery_images").update({ display_order: newIndex }).eq("id", updated[newIndex].id);
    await supabase.from("gallery_images").update({ display_order: index }).eq("id", updated[index].id);
  };

  return (
    <div className="space-y-6">
      {/* Upload area */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-sm space-y-4">
        <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" /> Adicionar Imagem
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Categoria</Label>
            <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Título</Label>
            <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Título da foto" />
          </div>
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Breve descrição" />
          </div>
        </div>
        <Label htmlFor="gallery-upload" className="cursor-pointer block">
          <div className="border-2 border-dashed border-border rounded-xl p-8 text-center text-muted-foreground hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center gap-2">
            <Upload className="h-8 w-8" />
            <span className="text-sm font-medium">{uploading ? "Enviando..." : "Clique ou arraste uma imagem"}</span>
          </div>
        </Label>
        <input id="gallery-upload" type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((img, index) => (
          <div key={img.id} className="group relative bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="aspect-[4/3] overflow-hidden">
              <img src={img.url} alt={img.title || ""} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            </div>
            <div className="p-3">
              <p className="text-sm font-medium text-foreground truncate">{img.title || "Sem título"}</p>
              <p className="text-xs text-muted-foreground">{img.category}</p>
            </div>
            {/* Actions overlay */}
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button size="icon" variant="secondary" className="h-7 w-7 shadow-sm" onClick={() => openEdit(img)}>
                <Pencil className="h-3 w-3" />
              </Button>
              <Button size="icon" variant="secondary" className="h-7 w-7 shadow-sm" onClick={() => moveImage(index, -1)} disabled={index === 0}>
                <ArrowUp className="h-3 w-3" />
              </Button>
              <Button size="icon" variant="secondary" className="h-7 w-7 shadow-sm" onClick={() => moveImage(index, 1)} disabled={index === images.length - 1}>
                <ArrowDown className="h-3 w-3" />
              </Button>
              <Button size="icon" variant="destructive" className="h-7 w-7 shadow-sm" onClick={() => handleDelete(img.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {images.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma imagem na galeria.</p>
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={!!editModal} onOpenChange={(open) => !open && setEditModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Editar Imagem</DialogTitle>
          </DialogHeader>
          {editModal && (
            <div className="space-y-4">
              <img src={editModal.url} alt="" className="w-full h-40 object-cover rounded-lg" />
              <div className="space-y-1.5">
                <Label>Categoria</Label>
                <Select value={editForm.category} onValueChange={(v) => setEditForm((p) => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Título</Label>
                <Input value={editForm.title} onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Descrição</Label>
                <Input value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} />
              </div>
              <label className="block text-sm text-primary cursor-pointer underline font-medium">
                Substituir imagem
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && replaceImage(editModal.id, e.target.files[0])} />
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

export default AdminGallery;
