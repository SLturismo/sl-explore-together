import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Save, Upload, ShieldCheck, Eye } from "lucide-react";

type CadasturData = {
  numero: string;
  validade: string;
  descricao: string;
  link_verificacao: string;
  imagem_url: string;
};

const AdminCadastur = () => {
  const [form, setForm] = useState<CadasturData>({
    numero: "", validade: "", descricao: "", link_verificacao: "", imagem_url: "",
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("site_content").select("*").eq("section_key", "cadastur").maybeSingle();
      if (data) {
        setExistingId(data.id);
        const content = data.content as unknown as CadasturData;
        setForm({
          numero: content.numero || "", validade: content.validade || "",
          descricao: content.descricao || "", link_verificacao: content.link_verificacao || "",
          imagem_url: content.imagem_url || "",
        });
      }
    };
    fetch();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fileName = `certificado-${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("cadastur").upload(fileName, file, { upsert: true });
    if (error) { toast({ title: "Erro no upload", variant: "destructive" }); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("cadastur").getPublicUrl(fileName);
    setForm((prev) => ({ ...prev, imagem_url: urlData.publicUrl }));
    setUploading(false);
    toast({ title: "Imagem enviada!" });
  };

  const handleSave = async () => {
    setSaving(true);
    const contentJson = { ...form };
    let error;
    if (existingId) {
      ({ error } = await supabase.from("site_content").update({ content: contentJson as any }).eq("id", existingId));
    } else {
      const result = await supabase.from("site_content").insert([{ section_key: "cadastur", content: contentJson as any }]).select().single();
      error = result.error;
      if (result.data) setExistingId(result.data.id);
    }
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Cadastur atualizado! ✅" });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-sm space-y-4">
        <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" /> Dados do Cadastur
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Número do Cadastur</Label>
            <Input value={form.numero} onChange={(e) => setForm((p) => ({ ...p, numero: e.target.value }))} placeholder="Ex: 12.345.678/0001-90" />
          </div>
          <div className="space-y-1.5">
            <Label>Validade</Label>
            <Input value={form.validade} onChange={(e) => setForm((p) => ({ ...p, validade: e.target.value }))} placeholder="Ex: 31/12/2026" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Descrição</Label>
          <Textarea value={form.descricao} onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))} placeholder="Texto sobre a certificação..." rows={3} />
        </div>

        <div className="space-y-1.5">
          <Label>Link de Verificação</Label>
          <Input value={form.link_verificacao} onChange={(e) => setForm((p) => ({ ...p, link_verificacao: e.target.value }))} placeholder="https://cadastur.turismo.gov.br/..." />
        </div>

        <div className="space-y-1.5">
          <Label>Imagem do Certificado</Label>
          <Label htmlFor="cadastur-upload" className="cursor-pointer block">
            <div className="border-2 border-dashed border-border rounded-xl p-6 text-center text-muted-foreground hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center gap-2">
              <Upload className="h-6 w-6" />
              <span className="text-sm">{uploading ? "Enviando..." : "Enviar certificado"}</span>
            </div>
          </Label>
          <input id="cadastur-upload" type="file" accept="image/*,.pdf" className="hidden" onChange={handleUpload} disabled={uploading} />
        </div>

        <Button onClick={handleSave} disabled={saving} className="gap-2 w-full">
          <Save className="h-4 w-4" />
          {saving ? "Salvando..." : "Salvar Cadastur"}
        </Button>
      </div>

      {/* Preview */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
          <Eye className="h-4 w-4" /> Preview do Certificado
        </div>
        {form.imagem_url ? (
          <img src={form.imagem_url} alt="Certificado" className="w-full h-auto rounded-lg border border-border" />
        ) : (
          <div className="aspect-[4/3] bg-muted/30 rounded-lg flex items-center justify-center">
            <ShieldCheck className="h-16 w-16 text-muted-foreground/20" />
          </div>
        )}
        {form.numero && (
          <div className="mt-4 space-y-1 text-sm">
            <p><strong>Nº:</strong> {form.numero}</p>
            {form.validade && <p><strong>Validade:</strong> {form.validade}</p>}
            {form.link_verificacao && (
              <a href={form.link_verificacao} target="_blank" rel="noopener noreferrer" className="text-primary underline text-xs">
                Verificar no site oficial
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCadastur;
