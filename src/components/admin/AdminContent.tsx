import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

const AdminContent = () => {
  const [heroTitle, setHeroTitle] = useState("Nunca é tarde para");
  const [heroHighlight, setHeroHighlight] = useState("viver seus sonhos");
  const [heroSubtitle, setHeroSubtitle] = useState("Viagens exclusivas para mulheres que buscam liberdade, segurança e experiências inesquecíveis.");
  const [aboutText1, setAboutText1] = useState("");
  const [aboutText2, setAboutText2] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("site_content").select("*").in("section_key", ["hero", "about"]);
      data?.forEach((row) => {
        const c = row.content as any;
        if (row.section_key === "hero") {
          setHeroTitle(c.title || "Nunca é tarde para");
          setHeroHighlight(c.highlight || "viver seus sonhos");
          setHeroSubtitle(c.subtitle || "");
        }
        if (row.section_key === "about") {
          setAboutText1(c.text1 || "");
          setAboutText2(c.text2 || "");
        }
      });
    };
    load();
  }, []);

  const save = async (key: string, content: Record<string, string>) => {
    setSaving(true);
    const { data: existing } = await supabase.from("site_content").select("id").eq("section_key", key).maybeSingle();
    if (existing) {
      await supabase.from("site_content").update({ content, updated_at: new Date().toISOString() }).eq("section_key", key);
    } else {
      await supabase.from("site_content").insert({ section_key: key, content });
    }
    setSaving(false);
    toast({ title: "Conteúdo salvo!" });
  };

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardContent className="p-4 space-y-4">
          <h3 className="font-semibold text-foreground">🏠 Seção Hero (Início)</h3>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Título principal</Label><Input value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} /></div>
            <div className="space-y-1"><Label>Destaque (linha colorida)</Label><Input value={heroHighlight} onChange={(e) => setHeroHighlight(e.target.value)} /></div>
            <div className="space-y-1"><Label>Subtítulo</Label><Textarea value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} rows={2} /></div>
          </div>
          <Button onClick={() => save("hero", { title: heroTitle, highlight: heroHighlight, subtitle: heroSubtitle })} disabled={saving} className="gap-1">
            <Save className="h-4 w-4" />{saving ? "Salvando..." : "Salvar Hero"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardContent className="p-4 space-y-4">
          <h3 className="font-semibold text-foreground">ℹ️ Seção Sobre</h3>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Parágrafo 1</Label><Textarea value={aboutText1} onChange={(e) => setAboutText1(e.target.value)} rows={3} /></div>
            <div className="space-y-1"><Label>Parágrafo 2</Label><Textarea value={aboutText2} onChange={(e) => setAboutText2(e.target.value)} rows={3} /></div>
          </div>
          <Button onClick={() => save("about", { text1: aboutText1, text2: aboutText2 })} disabled={saving} className="gap-1">
            <Save className="h-4 w-4" />{saving ? "Salvando..." : "Salvar Sobre"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminContent;
