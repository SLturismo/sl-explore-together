import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Save, Loader2 } from "lucide-react";

type SectionData = Record<string, string>;

const AdminContent = () => {
  const [sections, setSections] = useState<Record<string, SectionData>>({
    hero: { title: "Nunca é tarde para", highlight: "viver seus sonhos", subtitle: "Viagens exclusivas para mulheres que buscam liberdade, segurança e experiências inesquecíveis.", button_text: "✈️ Planejar minha viagem" },
    about: { title_prefix: "Sobre a", title_highlight: "SL Turismo", text1: "", text2: "", diff1_title: "Feito por Mulheres", diff1_desc: "Entendemos suas necessidades e criamos experiências que fazem sentido para você.", diff2_title: "Segurança em Primeiro Lugar", diff2_desc: "Cada detalhe é planejado para que você viaje com tranquilidade e confiança.", diff3_title: "Experiências Únicas", diff3_desc: "Roteiros personalizados que vão além do turismo convencional.", diff4_title: "Comunidade", diff4_desc: "Conecte-se com mulheres incríveis que compartilham a paixão por viajar." },
    gallery: { title_prefix: "Galeria de", title_highlight: "Viagens", subtitle: "Inspire-se com destinos incríveis escolhidos por mulheres como você" },
    travel_form: { title_prefix: "Planeje sua", title_highlight: "Viagem ou Evento", subtitle: "Conte-nos seus sonhos e criaremos a viagem ou evento perfeito para você", button_text: "✈️ Enviar Solicitação" },
    events: { title_prefix: "Eventos &", title_highlight: "Experiências", subtitle: "Viagens em grupo e tours exclusivos para mulheres que querem explorar o mundo juntas" },
    newsletter: { title: "Receba nossas novidades", subtitle: "Fique por dentro dos próximos destinos e eventos exclusivos", button_text: "Assinar" },
    footer: { description: "Viagens exclusivas e eventos para quem sonha em explorar o mundo com liberdade e segurança.", phone: "(67) 99953-5548", phone_link: "5567999535548", email: "contato@slturismo.com.br", city: "Campo Grande - MS", nav1: "Início", nav2: "Galeria", nav3: "Viagens & Eventos", nav4: "Eventos", nav5: "Sobre" },
    header: { menu_inicio: "Início", menu_galeria: "Galeria", menu_planejar: "Viagens & Eventos", menu_eventos: "Eventos", menu_sobre: "Sobre", contact_button: "Contato" },
  });
  const [saving, setSaving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      const keys = Object.keys(sections);
      const { data } = await supabase.from("site_content").select("*").in("section_key", keys);
      if (data) {
        const updated = { ...sections };
        data.forEach((row) => {
          const c = row.content as any;
          if (updated[row.section_key]) {
            updated[row.section_key] = { ...updated[row.section_key], ...c };
          }
        });
        setSections(updated);
      }
      setLoading(false);
    };
    load();
  }, []);

  const save = async (key: string) => {
    setSaving(key);
    const content = sections[key];
    const { data: existing } = await supabase.from("site_content").select("id").eq("section_key", key).maybeSingle();
    if (existing) {
      await supabase.from("site_content").update({ content, updated_at: new Date().toISOString() }).eq("section_key", key);
    } else {
      await supabase.from("site_content").insert({ section_key: key, content });
    }
    setSaving(null);
    toast({ title: "Conteúdo salvo com sucesso!" });
  };

  const updateField = (section: string, field: string, value: string) => {
    setSections((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  if (loading) return <p className="text-muted-foreground">Carregando conteúdo...</p>;

  const Field = ({ section, field, label, multiline }: { section: string; field: string; label: string; multiline?: boolean }) => (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {multiline ? (
        <Textarea value={sections[section]?.[field] || ""} onChange={(e) => updateField(section, field, e.target.value)} rows={3} className="bg-background" />
      ) : (
        <Input value={sections[section]?.[field] || ""} onChange={(e) => updateField(section, field, e.target.value)} className="bg-background" />
      )}
    </div>
  );

  const SectionCard = ({ sectionKey, title, emoji, children }: { sectionKey: string; title: string; emoji: string; children: React.ReactNode }) => (
    <div className="bg-card rounded-xl border border-border/80 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 gap-3">
        <h3 className="text-base font-semibold text-foreground tracking-tight">
          <span className="mr-2" aria-hidden>{emoji}</span>
          {title}
        </h3>
        <Button size="sm" onClick={() => save(sectionKey)} disabled={saving === sectionKey} className="gap-1.5">
          {saving === sectionKey ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {saving === sectionKey ? "Salvando..." : "Salvar"}
        </Button>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border/80 bg-primary/[0.04] px-4 py-3 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Textos do site.</span> Cada bloco abaixo corresponde a uma área da página pública. Clique em <strong className="text-foreground font-medium">Salvar</strong> na secção que alterou.
      </div>

      {/* Header */}
      <SectionCard sectionKey="header" title="Menu de Navegação" emoji="🧭">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Field section="header" field="menu_inicio" label="Início" />
          <Field section="header" field="menu_galeria" label="Galeria" />
          <Field section="header" field="menu_planejar" label="Planejar" />
          <Field section="header" field="menu_eventos" label="Eventos" />
          <Field section="header" field="menu_sobre" label="Sobre" />
          <Field section="header" field="contact_button" label="Botão contato" />
        </div>
      </SectionCard>

      {/* Hero */}
      <SectionCard sectionKey="hero" title="Início (Hero)" emoji="🏠">
        <Field section="hero" field="title" label="Título principal" />
        <Field section="hero" field="highlight" label="Destaque (linha colorida)" />
        <Field section="hero" field="subtitle" label="Subtítulo" multiline />
        <Field section="hero" field="button_text" label="Texto do botão" />
      </SectionCard>

      {/* Gallery */}
      <SectionCard sectionKey="gallery" title="Galeria" emoji="📸">
        <div className="grid grid-cols-2 gap-3">
          <Field section="gallery" field="title_prefix" label="Título (parte 1)" />
          <Field section="gallery" field="title_highlight" label="Título (destaque)" />
        </div>
        <Field section="gallery" field="subtitle" label="Subtítulo" multiline />
      </SectionCard>

      {/* Travel Form */}
      <SectionCard sectionKey="travel_form" title="Formulário de Viagem" emoji="✈️">
        <div className="grid grid-cols-2 gap-3">
          <Field section="travel_form" field="title_prefix" label="Título (parte 1)" />
          <Field section="travel_form" field="title_highlight" label="Título (destaque)" />
        </div>
        <Field section="travel_form" field="subtitle" label="Subtítulo" multiline />
        <Field section="travel_form" field="button_text" label="Texto do botão" />
      </SectionCard>

      {/* Events */}
      <SectionCard sectionKey="events" title="Eventos & Experiências" emoji="🎪">
        <div className="grid grid-cols-2 gap-3">
          <Field section="events" field="title_prefix" label="Título (parte 1)" />
          <Field section="events" field="title_highlight" label="Título (destaque)" />
        </div>
        <Field section="events" field="subtitle" label="Subtítulo" multiline />
      </SectionCard>

      {/* About */}
      <SectionCard sectionKey="about" title="Sobre a SL Turismo" emoji="ℹ️">
        <div className="grid grid-cols-2 gap-3">
          <Field section="about" field="title_prefix" label="Título (parte 1)" />
          <Field section="about" field="title_highlight" label="Título (destaque)" />
        </div>
        <Field section="about" field="text1" label="Parágrafo 1" multiline />
        <Field section="about" field="text2" label="Parágrafo 2" multiline />
        <p className="text-xs font-medium text-muted-foreground pt-2 border-t border-border">Diferenciais</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field section="about" field="diff1_title" label="Diferencial 1 - Título" />
          <Field section="about" field="diff1_desc" label="Diferencial 1 - Descrição" />
          <Field section="about" field="diff2_title" label="Diferencial 2 - Título" />
          <Field section="about" field="diff2_desc" label="Diferencial 2 - Descrição" />
          <Field section="about" field="diff3_title" label="Diferencial 3 - Título" />
          <Field section="about" field="diff3_desc" label="Diferencial 3 - Descrição" />
          <Field section="about" field="diff4_title" label="Diferencial 4 - Título" />
          <Field section="about" field="diff4_desc" label="Diferencial 4 - Descrição" />
        </div>
      </SectionCard>

      {/* Newsletter */}
      <SectionCard sectionKey="newsletter" title="Newsletter" emoji="📬">
        <Field section="newsletter" field="title" label="Título" />
        <Field section="newsletter" field="subtitle" label="Subtítulo" />
        <Field section="newsletter" field="button_text" label="Texto do botão" />
      </SectionCard>

      {/* Footer */}
      <SectionCard sectionKey="footer" title="Rodapé" emoji="📍">
        <Field section="footer" field="description" label="Descrição da empresa" multiline />
        <div className="grid grid-cols-2 gap-3">
          <Field section="footer" field="phone" label="Telefone (exibição)" />
          <Field section="footer" field="phone_link" label="Telefone (WhatsApp, só números)" />
          <Field section="footer" field="email" label="E-mail" />
          <Field section="footer" field="city" label="Cidade" />
        </div>
        <p className="text-xs font-medium text-muted-foreground pt-2 border-t border-border">Links de navegação do rodapé</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Field section="footer" field="nav1" label="Link 1" />
          <Field section="footer" field="nav2" label="Link 2" />
          <Field section="footer" field="nav3" label="Link 3" />
          <Field section="footer" field="nav4" label="Link 4" />
          <Field section="footer" field="nav5" label="Link 5" />
        </div>
      </SectionCard>
    </div>
  );
};

export default AdminContent;
