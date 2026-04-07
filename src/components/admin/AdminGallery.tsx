import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus } from "lucide-react";

type GalleryImage = {
  id: string;
  url: string;
  category: string;
  title: string | null;
  description: string | null;
  display_order: number | null;
};

const AdminGallery = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ category: "Praias", title: "", description: "" });
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

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardContent className="p-4 space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2"><Plus className="h-4 w-4" /> Adicionar Imagem</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>Categoria</Label>
              <Input value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} placeholder="Ex: Praias" />
            </div>
            <div className="space-y-1">
              <Label>Título</Label>
              <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Título da foto" />
            </div>
            <div className="space-y-1">
              <Label>Descrição</Label>
              <Input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Breve descrição" />
            </div>
          </div>
          <div>
            <Label htmlFor="gallery-upload" className="cursor-pointer">
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center text-muted-foreground hover:border-primary transition-colors">
                {uploading ? "Enviando..." : "Clique para selecionar uma imagem"}
              </div>
            </Label>
            <input id="gallery-upload" type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {images.map((img) => (
          <div key={img.id} className="relative group rounded-lg overflow-hidden border border-border">
            <img src={img.url} alt={img.title || ""} className="w-full h-32 object-cover" />
            <div className="absolute inset-0 bg-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button variant="destructive" size="icon" onClick={() => handleDelete(img.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-2 text-xs">
              <p className="font-medium truncate">{img.title || "Sem título"}</p>
              <p className="text-muted-foreground">{img.category}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminGallery;
