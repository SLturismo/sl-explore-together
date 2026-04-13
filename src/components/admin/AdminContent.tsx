import { useEffect, useRef, useState, type ChangeEventHandler } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Save, Loader2, Upload } from "lucide-react";
import type { SiteVisibilityKey } from "@/contexts/PublicSiteContext";
import { DEFAULT_VISIBILITY } from "@/contexts/PublicSiteContext";
import fallbackLogo from "@/assets/logo-sl-turismo.jpg";

type SectionData = Record<string, string>;

/** Extrai o caminho no bucket a partir da URL pública do Storage. */
function brandingObjectPathFromPublicUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const marker = "/object/public/branding/";
    const i = u.pathname.indexOf(marker);
    if (i === -1) return null;
    return decodeURIComponent(u.pathname.slice(i + marker.length));
  } catch {
    return null;
  }
}

const VIS_LABELS: Record<SiteVisibilityKey, string> = {
  hero: "Secção Hero (início)",
  gallery: "Galeria de fotos",
  travel_form: "Formulário “Planeje sua viagem”",
  events: "Secção de eventos ativos",
  about: "Secção Sobre",
  cadastur: "Bloco Cadastur / credenciais",
  footer_newsletter: "Faixa rosa da newsletter (acima do rodapé)",
  whatsapp_float: "Botão flutuante do WhatsApp",
};

const initialSections: Record<string, SectionData> = {
  branding: { logo_url: "" },
  hero: { title: "Nunca é tarde para", highlight: "viver seus sonhos", subtitle: "Viagens exclusivas para mulheres que buscam liberdade, segurança e experiências inesquecíveis.", button_text: "✈️ Planejar minha viagem" },
  about: { title_prefix: "Sobre a", title_highlight: "SL Turismo", text1: "", text2: "", diff1_title: "Feito por Mulheres", diff1_desc: "Entendemos suas necessidades e criamos experiências que fazem sentido para você.", diff2_title: "Segurança em Primeiro Lugar", diff2_desc: "Cada detalhe é planejado para que você viaje com tranquilidade e confiança.", diff3_title: "Experiências Únicas", diff3_desc: "Roteiros personalizados que vão além do turismo convencional.", diff4_title: "Comunidade", diff4_desc: "Conecte-se com mulheres incríveis que compartilham a paixão por viajar." },
  gallery: { title_prefix: "Galeria de", title_highlight: "Viagens", subtitle: "Inspire-se com destinos incríveis escolhidos por mulheres como você", image_fit: "cover" },
  travel_form: { title_prefix: "Planeje sua", title_highlight: "Viagem ou Evento", subtitle: "Conte-nos seus sonhos e criaremos a viagem ou evento perfeito para você", button_text: "✈️ Enviar Solicitação" },
  events: { title_prefix: "Eventos &", title_highlight: "Experiências", subtitle: "Viagens em grupo e tours exclusivos para mulheres que querem explorar o mundo juntas" },
  newsletter: { title: "Receba nossas novidades", subtitle: "Fique por dentro dos próximos destinos e eventos exclusivos", button_text: "Assinar" },
  footer: { description: "Viagens exclusivas e eventos para quem sonha em explorar o mundo com liberdade e segurança.", phone: "(67) 99953-5548", phone_link: "5567999535548", email: "contato@slturismo.com.br", city: "Campo Grande - MS", nav1: "Início", nav2: "Galeria", nav3: "Viagens & Eventos", nav4: "Eventos", nav5: "Sobre" },
  header: { menu_inicio: "Início", menu_galeria: "Galeria", menu_planejar: "Viagens & Eventos", menu_eventos: "Eventos", menu_sobre: "Sobre", contact_button: "Contato" },
};

const AdminContent = () => {
  const [sections, setSections] = useState<Record<string, SectionData>>(() => ({ ...initialSections }));
  const [vis, setVis] = useState<Record<SiteVisibilityKey, boolean>>(DEFAULT_VISIBILITY);
  const [saving, setSaving] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      const keys = [...Object.keys(initialSections), "visibility"];
      const { data } = await supabase.from("site_content").select("*").in("section_key", keys);
      if (data) {
        const updated = { ...initialSections };
        data.forEach((row) => {
          if (row.section_key === "visibility") {
            const c = row.content as Partial<Record<SiteVisibilityKey, boolean>>;
            setVis({ ...DEFAULT_VISIBILITY, ...c });
            return;
          }
          const c = row.content as Record<string, string>;
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

  const saveVisibility = async () => {
    setSaving("visibility");
    const key = "visibility";
    const { data: existing } = await supabase.from("site_content").select("id").eq("section_key", key).maybeSingle();
    if (existing) {
      await supabase.from("site_content").update({ content: vis, updated_at: new Date().toISOString() }).eq("section_key", key);
    } else {
      await supabase.from("site_content").insert({ section_key: key, content: vis });
    }
    setSaving(null);
    toast({ title: "Visibilidade do site salva!" });
  };

  const handleLogoUpload: ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file || file.size === 0) {
      setTimeout(() => {
        e.target.value = "";
      }, 0);
      return;
    }

    setLogoUploading(true);
    const rawExt = (file.name.split(".").pop() || "jpg").toLowerCase();
    const ext = rawExt.replace(/[^a-z0-9]/g, "") || "jpg";
    // Caminho único: só precisa da política INSERT (evita 400 com upsert/replace no mesmo path).
    const path = `logo-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

    const prevUrl = sections.branding?.logo_url?.trim();
    const oldObjectPath = prevUrl ? brandingObjectPathFromPublicUrl(prevUrl) : null;

    const contentType =
      file.type && file.type.startsWith("image/")
        ? file.type
        : ext === "jpg" || ext === "jpeg"
          ? "image/jpeg"
          : ext === "png"
            ? "image/png"
            : ext === "webp"
              ? "image/webp"
              : "application/octet-stream";

    const { error: upErr } = await supabase.storage.from("branding").upload(path, file, {
      cacheControl: "3600",
      contentType,
      upsert: false,
    });

    if (upErr) {
      toast({
        title: "Erro no upload do logo",
        description: `${upErr.message} Verifique no Supabase se o bucket «branding» existe, está público e se a política de INSERT em storage.objects permite admins.`,
        variant: "destructive",
      });
      setLogoUploading(false);
      setTimeout(() => {
        e.target.value = "";
      }, 0);
      return;
    }

    if (oldObjectPath && oldObjectPath !== path) {
      const { error: rmErr } = await supabase.storage.from("branding").remove([oldObjectPath]);
      if (rmErr) console.warn("[branding] remover logo anterior:", rmErr.message);
    }

    const { data: pub } = supabase.storage.from("branding").getPublicUrl(path);
    const content = { ...sections.branding, logo_url: pub.publicUrl };
    setSections((p) => ({ ...p, branding: { ...p.branding, logo_url: pub.publicUrl } }));
    const { data: existing } = await supabase.from("site_content").select("id").eq("section_key", "branding").maybeSingle();
    if (existing) {
      await supabase.from("site_content").update({ content, updated_at: new Date().toISOString() }).eq("section_key", "branding");
    } else {
      await supabase.from("site_content").insert({ section_key: "branding", content });
    }

    setLogoUploading(false);
    setTimeout(() => {
      e.target.value = "";
      toast({ title: "Logo atualizado", description: "Já aparece no site, no login e no painel." });
    }, 0);
  };

  const updateField = (section: string, field: string, value: string) => {
    setSections((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  if (loading) return <p className="text-muted-foreground">Carregando conteúdo...</p>;

  const logoPreview = sections.branding?.logo_url?.trim() ? sections.branding.logo_url : fallbackLogo;

  const Field = ({ section, field, label, multiline }: { section: string; field: string; label: string; multiline?: boolean }) => (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {multiline ? (
        <Textarea value={sections[section]?.[field] || ""} onChange={(ev) => updateField(section, field, ev.target.value)} rows={3} className="bg-background" />
      ) : (
        <Input value={sections[section]?.[field] || ""} onChange={(ev) => updateField(section, field, ev.target.value)} className="bg-background" />
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

      {/* Logo */}
      <div className="bg-card rounded-xl border border-border/80 p-5 shadow-sm">
        <h3 className="text-base font-semibold text-foreground tracking-tight mb-1">
          <span className="mr-2" aria-hidden>✨</span>
          Logo da agência
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Usado no cabeçalho e rodapé do site, no login e no painel. Envie um ficheiro (PNG ou JPG recomendado). O upload grava logo no armazenamento e atualiza o site.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <img src={logoPreview} alt="Pré-visualização" className="h-20 w-auto max-w-[200px] object-contain rounded-lg border border-border bg-muted/30 p-2" />
          <div className="space-y-2">
            <input
              ref={logoFileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              tabIndex={-1}
              disabled={logoUploading}
              onChange={handleLogoUpload}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-2 h-auto py-2 px-3 text-primary hover:text-primary hover:bg-primary/10"
              disabled={logoUploading}
              onClick={() => logoFileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 shrink-0" />
              <span className="underline">{logoUploading ? "A enviar…" : "Carregar novo logo"}</span>
            </Button>
            <p className="text-[11px] text-muted-foreground">Se não houver logo no painel, o site usa o logo predefinido local.</p>
          </div>
        </div>
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
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Miniaturas na grelha do site</Label>
          <Select value={sections.gallery?.image_fit === "contain" ? "contain" : "cover"} onValueChange={(v) => updateField("gallery", "image_fit", v)}>
            <SelectTrigger className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cover">Preencher o quadro (cortar)</SelectItem>
              <SelectItem value="contain">Mostrar foto inteira</SelectItem>
            </SelectContent>
          </Select>
        </div>
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

      {/* Visibilidade */}
      <div className="bg-card rounded-xl border border-border/80 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 gap-3">
          <h3 className="text-base font-semibold text-foreground tracking-tight">
            <span className="mr-2" aria-hidden>👁️</span>
            Visibilidade no site público
          </h3>
          <Button size="sm" onClick={saveVisibility} disabled={saving === "visibility"} className="gap-1.5">
            {saving === "visibility" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {saving === "visibility" ? "Salvando..." : "Salvar"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Cabeçalho, rodapé principal e link de admin mantêm-se sempre. Aqui controla as secções do meio e extras.
        </p>
        <div className="space-y-4">
          {(Object.keys(VIS_LABELS) as SiteVisibilityKey[]).map((k) => (
            <div key={k} className="flex items-center justify-between gap-4 border-b border-border/50 pb-3 last:border-0 last:pb-0">
              <Label htmlFor={`vis-${k}`} className="text-sm font-normal leading-snug cursor-pointer">
                {VIS_LABELS[k]}
              </Label>
              <Switch id={`vis-${k}`} checked={vis[k]} onCheckedChange={(c) => setVis((p) => ({ ...p, [k]: c }))} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminContent;
