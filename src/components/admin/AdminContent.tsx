import { useEffect, useRef, useState, type ChangeEventHandler, type ReactNode } from "react";
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
import { GALLERY_OBJECT_POSITION_OPTIONS, normalizeGalleryObjectPosition } from "@/lib/gallery-display";

type SectionData = Record<string, string>;

const ADMIN_MAIN_SCROLL_SEL = "[data-admin-main-scroll]";

function stashAdminMainScrollTop(): number {
  const el = document.querySelector(ADMIN_MAIN_SCROLL_SEL) as HTMLElement | null;
  return el?.scrollTop ?? 0;
}

function restoreAdminMainScrollTop(y: number) {
  const apply = () => {
    const el = document.querySelector(ADMIN_MAIN_SCROLL_SEL) as HTMLElement | null;
    if (el) el.scrollTop = y;
  };
  apply();
  requestAnimationFrame(apply);
  requestAnimationFrame(() => requestAnimationFrame(apply));
}

/** Fora do AdminContent: evita remontar inputs a cada tecla (scroll saltava para o topo). */
function ContentField({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {multiline ? (
        <Textarea value={value} onChange={(ev) => onChange(ev.target.value)} rows={3} className="bg-background" />
      ) : (
        <Input value={value} onChange={(ev) => onChange(ev.target.value)} className="bg-background" />
      )}
    </div>
  );
}

function ContentSectionCard({
  title,
  emoji,
  isSaving,
  onSave,
  children,
}: {
  title: string;
  emoji: string;
  isSaving: boolean;
  onSave: () => void;
  children: ReactNode;
}) {
  return (
    <div className="bg-card rounded-xl border border-border/80 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 gap-3">
        <h3 className="text-base font-semibold text-foreground tracking-tight">
          <span className="mr-2" aria-hidden>
            {emoji}
          </span>
          {title}
        </h3>
        <Button size="sm" onClick={onSave} disabled={isSaving} className="gap-1.5">
          {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {isSaving ? "Salvando..." : "Salvar"}
        </Button>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

/** Bucket e caminho interno a partir da URL pública (…/object/public/{bucket}/…). */
function logoStorageRefFromPublicUrl(url: string): { bucket: string; objectPath: string } | null {
  try {
    const u = new URL(url);
    const marker = "/object/public/";
    const i = u.pathname.indexOf(marker);
    if (i === -1) return null;
    const rest = u.pathname.slice(i + marker.length);
    const slash = rest.indexOf("/");
    if (slash === -1) return null;
    const bucket = rest.slice(0, slash);
    const objectPath = decodeURIComponent(rest.slice(slash + 1));
    if (!bucket || !objectPath) return null;
    return { bucket, objectPath };
  } catch {
    return null;
  }
}

/** Mesmo bucket das fotos da galeria; pasta dedicada para não misturar com uploads da galeria por nome. */
const LOGO_STORAGE_BUCKET = "gallery";
const LOGO_STORAGE_PREFIX = "branding";

/** Mensagens de ajuda conforme o erro devolvido pelo Storage. */
function logoUploadErrorHelp(errorMessage: string): { title: string; description: string; duration?: number } {
  const m = (errorMessage || "").toLowerCase();
  if (m.includes("bucket not found") || (m.includes("not found") && m.includes("bucket"))) {
    return {
      title: "Bucket «gallery» não encontrado no Supabase",
      description:
        "O logo usa o mesmo Storage que a galeria (bucket «gallery»). Confirme no painel Supabase → Storage que esse bucket existe. O site em produção tem de usar o mesmo projeto: nas definições da Vercel, VITE_SUPABASE_URL tem de ser o URL deste projeto.",
      duration: 22_000,
    };
  }
  if (
    m.includes("row-level security") ||
    m.includes("violates row-level security") ||
    m.includes("policy") ||
    m.includes("permission denied") ||
    m.includes("unauthorized")
  ) {
    return {
      title: "Upload bloqueado (permissões)",
      description: `${errorMessage} Inicie sessão como administrador. O bucket «gallery» precisa de política de INSERT em storage.objects para admins (já incluída na migração inicial do projeto).`,
      duration: 18_000,
    };
  }
  return {
    title: "Erro no upload do logo",
    description: `${errorMessage} Verifique o bucket «gallery», se está público para leitura e se as políticas permitem INSERT para admins.`,
    duration: 12_000,
  };
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
  gallery: {
    title_prefix: "Galeria de",
    title_highlight: "Viagens",
    subtitle: "Inspire-se com destinos incríveis escolhidos por mulheres como você",
    image_fit: "cover",
    object_position: "center",
  },
  travel_form: { title_prefix: "Planeje sua", title_highlight: "Viagem ou Evento", subtitle: "Conte-nos seus sonhos e criaremos a viagem ou evento perfeito para você", button_text: "✈️ Enviar Solicitação" },
  events: { title_prefix: "Eventos &", title_highlight: "Experiências", subtitle: "Viagens em grupo e tours exclusivos para mulheres que querem explorar o mundo juntas" },
  newsletter: { title: "Receba nossas novidades", subtitle: "Fique por dentro dos próximos destinos e eventos exclusivos", button_text: "Assinar" },
  footer: {
    description: "Viagens exclusivas e eventos para quem sonha em explorar o mundo com liberdade e segurança.",
    phone: "(67) 99953-5548",
    phone_link: "5567999535548",
    whatsapp_prefill: "Olá! Gostaria de saber mais sobre as viagens da SL Turismo.",
    email: "contato@slturismo.com.br",
    city: "Campo Grande - MS",
    social_instagram: "",
    social_facebook: "",
    social_youtube: "",
    social_linkedin: "",
    nav1: "Início",
    nav2: "Galeria",
    nav3: "Viagens & Eventos",
    nav4: "Eventos",
    nav5: "Sobre",
  },
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
    const scrollY = stashAdminMainScrollTop();
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
    restoreAdminMainScrollTop(scrollY);
  };

  const saveVisibility = async () => {
    const scrollY = stashAdminMainScrollTop();
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
    restoreAdminMainScrollTop(scrollY);
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
    const fileName = `logo-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    const objectPath = `${LOGO_STORAGE_PREFIX}/${fileName}`;

    const prevUrl = sections.branding?.logo_url?.trim();
    const oldRef = prevUrl ? logoStorageRefFromPublicUrl(prevUrl) : null;

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

    const { error: upErr } = await supabase.storage.from(LOGO_STORAGE_BUCKET).upload(objectPath, file, {
      cacheControl: "3600",
      contentType,
      upsert: false,
    });

    if (upErr) {
      const help = logoUploadErrorHelp(upErr.message);
      toast({
        title: help.title,
        description: help.description,
        variant: "destructive",
        duration: help.duration,
      });
      setLogoUploading(false);
      setTimeout(() => {
        e.target.value = "";
      }, 0);
      return;
    }

    if (oldRef && (oldRef.bucket !== LOGO_STORAGE_BUCKET || oldRef.objectPath !== objectPath)) {
      const { error: rmErr } = await supabase.storage.from(oldRef.bucket).remove([oldRef.objectPath]);
      if (rmErr) console.warn("[logo] remover ficheiro anterior:", rmErr.message);
    }

    const { data: pub } = supabase.storage.from(LOGO_STORAGE_BUCKET).getPublicUrl(objectPath);
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

  const logoPreview = sections.branding?.logo_url?.trim() || "";

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border/80 bg-primary/[0.04] px-4 py-3 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Textos do site.</span> Cada bloco abaixo corresponde a uma área da página pública. Clique em <strong className="text-foreground font-medium">Salvar</strong> na secção que alterou.
      </div>

      {/* Logo */}
      <div className="bg-card rounded-xl border border-border/80 p-5 shadow-sm">
        <h3 className="text-base font-semibold text-foreground tracking-tight mb-1">
          <span className="mr-2" aria-hidden>
            ✨
          </span>
          Logo da agência
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Usado no cabeçalho e rodapé do site, no login e no painel. Envie um ficheiro (PNG ou JPG recomendado). O upload grava logo no armazenamento e atualiza o site.
        </p>
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 mb-4 text-[11px] text-muted-foreground leading-relaxed">
          <span className="font-medium text-foreground/90">Onde fica o ficheiro:</span> o logo é guardado no bucket{" "}
          <code className="rounded bg-muted/80 px-1 py-0.5 text-foreground">gallery</code> (o mesmo da galeria de fotos), na pasta{" "}
          <code className="rounded bg-muted/80 px-1 py-0.5 text-foreground">branding/</code>. Não precisa do bucket extra «branding». Se o upload falhar, confirme que a Vercel usa o mesmo{" "}
          <code className="rounded bg-muted/80 px-1 py-0.5 text-foreground">VITE_SUPABASE_URL</code> que o projeto onde a galeria já funciona.
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          {logoPreview ? (
            <img src={logoPreview} alt="Pré-visualização" className="h-20 w-auto max-w-[200px] object-contain rounded-lg border border-border bg-muted/30 p-2" />
          ) : null}
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
            <p className="text-[11px] text-muted-foreground">Se não houver logo no painel, o site não exibe logo até uma ser carregada.</p>
          </div>
        </div>
      </div>

      {/* Header */}
      <ContentSectionCard title="Menu de Navegação" emoji="🧭" isSaving={saving === "header"} onSave={() => save("header")}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <ContentField label="Início" value={sections.header?.menu_inicio || ""} onChange={(v) => updateField("header", "menu_inicio", v)} />
          <ContentField label="Galeria" value={sections.header?.menu_galeria || ""} onChange={(v) => updateField("header", "menu_galeria", v)} />
          <ContentField label="Planejar" value={sections.header?.menu_planejar || ""} onChange={(v) => updateField("header", "menu_planejar", v)} />
          <ContentField label="Eventos" value={sections.header?.menu_eventos || ""} onChange={(v) => updateField("header", "menu_eventos", v)} />
          <ContentField label="Sobre" value={sections.header?.menu_sobre || ""} onChange={(v) => updateField("header", "menu_sobre", v)} />
          <ContentField label="Botão contato" value={sections.header?.contact_button || ""} onChange={(v) => updateField("header", "contact_button", v)} />
        </div>
      </ContentSectionCard>

      {/* Hero */}
      <ContentSectionCard title="Início (Hero)" emoji="🏠" isSaving={saving === "hero"} onSave={() => save("hero")}>
        <ContentField label="Título principal" value={sections.hero?.title || ""} onChange={(v) => updateField("hero", "title", v)} />
        <ContentField label="Destaque (linha colorida)" value={sections.hero?.highlight || ""} onChange={(v) => updateField("hero", "highlight", v)} />
        <ContentField label="Subtítulo" value={sections.hero?.subtitle || ""} onChange={(v) => updateField("hero", "subtitle", v)} multiline />
        <ContentField label="Texto do botão" value={sections.hero?.button_text || ""} onChange={(v) => updateField("hero", "button_text", v)} />
      </ContentSectionCard>

      {/* Gallery */}
      <ContentSectionCard title="Galeria" emoji="📸" isSaving={saving === "gallery"} onSave={() => save("gallery")}>
        <div className="grid grid-cols-2 gap-3">
          <ContentField label="Título (parte 1)" value={sections.gallery?.title_prefix || ""} onChange={(v) => updateField("gallery", "title_prefix", v)} />
          <ContentField label="Título (destaque)" value={sections.gallery?.title_highlight || ""} onChange={(v) => updateField("gallery", "title_highlight", v)} />
        </div>
        <ContentField label="Subtítulo" value={sections.gallery?.subtitle || ""} onChange={(v) => updateField("gallery", "subtitle", v)} multiline />
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
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Ponto de foco ao cortar (modo «Preencher o quadro»)</Label>
          <Select
            value={normalizeGalleryObjectPosition(sections.gallery?.object_position)}
            onValueChange={(v) => updateField("gallery", "object_position", v)}
          >
            <SelectTrigger className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GALLERY_OBJECT_POSITION_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Com «Mostrar foto inteira», a posição tem pouco efeito. Com «Preencher o quadro», escolhe que zona da foto fica visível quando há corte.
          </p>
        </div>
      </ContentSectionCard>

      {/* Travel Form */}
      <ContentSectionCard title="Formulário de Viagem" emoji="✈️" isSaving={saving === "travel_form"} onSave={() => save("travel_form")}>
        <div className="grid grid-cols-2 gap-3">
          <ContentField label="Título (parte 1)" value={sections.travel_form?.title_prefix || ""} onChange={(v) => updateField("travel_form", "title_prefix", v)} />
          <ContentField label="Título (destaque)" value={sections.travel_form?.title_highlight || ""} onChange={(v) => updateField("travel_form", "title_highlight", v)} />
        </div>
        <ContentField label="Subtítulo" value={sections.travel_form?.subtitle || ""} onChange={(v) => updateField("travel_form", "subtitle", v)} multiline />
        <ContentField label="Texto do botão" value={sections.travel_form?.button_text || ""} onChange={(v) => updateField("travel_form", "button_text", v)} />
      </ContentSectionCard>

      {/* Events */}
      <ContentSectionCard title="Eventos & Experiências" emoji="🎪" isSaving={saving === "events"} onSave={() => save("events")}>
        <div className="grid grid-cols-2 gap-3">
          <ContentField label="Título (parte 1)" value={sections.events?.title_prefix || ""} onChange={(v) => updateField("events", "title_prefix", v)} />
          <ContentField label="Título (destaque)" value={sections.events?.title_highlight || ""} onChange={(v) => updateField("events", "title_highlight", v)} />
        </div>
        <ContentField label="Subtítulo" value={sections.events?.subtitle || ""} onChange={(v) => updateField("events", "subtitle", v)} multiline />
      </ContentSectionCard>

      {/* About */}
      <ContentSectionCard title="Sobre a SL Turismo" emoji="ℹ️" isSaving={saving === "about"} onSave={() => save("about")}>
        <div className="grid grid-cols-2 gap-3">
          <ContentField label="Título (parte 1)" value={sections.about?.title_prefix || ""} onChange={(v) => updateField("about", "title_prefix", v)} />
          <ContentField label="Título (destaque)" value={sections.about?.title_highlight || ""} onChange={(v) => updateField("about", "title_highlight", v)} />
        </div>
        <ContentField label="Parágrafo 1" value={sections.about?.text1 || ""} onChange={(v) => updateField("about", "text1", v)} multiline />
        <ContentField label="Parágrafo 2" value={sections.about?.text2 || ""} onChange={(v) => updateField("about", "text2", v)} multiline />
        <p className="text-xs font-medium text-muted-foreground pt-2 border-t border-border">Diferenciais</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ContentField label="Diferencial 1 - Título" value={sections.about?.diff1_title || ""} onChange={(v) => updateField("about", "diff1_title", v)} />
          <ContentField label="Diferencial 1 - Descrição" value={sections.about?.diff1_desc || ""} onChange={(v) => updateField("about", "diff1_desc", v)} />
          <ContentField label="Diferencial 2 - Título" value={sections.about?.diff2_title || ""} onChange={(v) => updateField("about", "diff2_title", v)} />
          <ContentField label="Diferencial 2 - Descrição" value={sections.about?.diff2_desc || ""} onChange={(v) => updateField("about", "diff2_desc", v)} />
          <ContentField label="Diferencial 3 - Título" value={sections.about?.diff3_title || ""} onChange={(v) => updateField("about", "diff3_title", v)} />
          <ContentField label="Diferencial 3 - Descrição" value={sections.about?.diff3_desc || ""} onChange={(v) => updateField("about", "diff3_desc", v)} />
          <ContentField label="Diferencial 4 - Título" value={sections.about?.diff4_title || ""} onChange={(v) => updateField("about", "diff4_title", v)} />
          <ContentField label="Diferencial 4 - Descrição" value={sections.about?.diff4_desc || ""} onChange={(v) => updateField("about", "diff4_desc", v)} />
        </div>
      </ContentSectionCard>

      {/* Newsletter */}
      <ContentSectionCard title="Newsletter" emoji="📬" isSaving={saving === "newsletter"} onSave={() => save("newsletter")}>
        <ContentField label="Título" value={sections.newsletter?.title || ""} onChange={(v) => updateField("newsletter", "title", v)} />
        <ContentField label="Subtítulo" value={sections.newsletter?.subtitle || ""} onChange={(v) => updateField("newsletter", "subtitle", v)} />
        <ContentField label="Texto do botão" value={sections.newsletter?.button_text || ""} onChange={(v) => updateField("newsletter", "button_text", v)} />
      </ContentSectionCard>

      {/* Footer */}
      <ContentSectionCard title="Rodapé, contacto e redes sociais" emoji="📍" isSaving={saving === "footer"} onSave={() => save("footer")}>
        <ContentField label="Descrição da empresa" value={sections.footer?.description || ""} onChange={(v) => updateField("footer", "description", v)} multiline />
        <p className="text-xs font-medium text-muted-foreground pt-1 border-t border-border">WhatsApp (cabeçalho, rodapé e botão flutuante)</p>
        <div className="grid grid-cols-2 gap-3">
          <ContentField
            label="Telefone — texto visível (ex.: (67) 99999-9999)"
            value={sections.footer?.phone || ""}
            onChange={(v) => updateField("footer", "phone", v)}
          />
          <ContentField
            label="WhatsApp — só números, com código do país (ex.: 5567999535548)"
            value={sections.footer?.phone_link || ""}
            onChange={(v) => updateField("footer", "phone_link", v)}
          />
        </div>
        <ContentField
          label="Mensagem inicial no WhatsApp (botão flutuante e links)"
          value={sections.footer?.whatsapp_prefill || ""}
          onChange={(v) => updateField("footer", "whatsapp_prefill", v)}
          multiline
        />
        <p className="text-[11px] text-muted-foreground -mt-1">
          Usada no texto pré-preenchido ao abrir o WhatsApp. O número acima é o que entra em <code className="rounded bg-muted px-1">wa.me</code>.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <ContentField label="E-mail" value={sections.footer?.email || ""} onChange={(v) => updateField("footer", "email", v)} />
          <ContentField label="Cidade" value={sections.footer?.city || ""} onChange={(v) => updateField("footer", "city", v)} />
        </div>
        <p className="text-xs font-medium text-muted-foreground pt-2 border-t border-border">Redes sociais (ícones no rodapé)</p>
        <p className="text-[11px] text-muted-foreground -mt-1 mb-1">
          Cole o link completo (ex.: <span className="whitespace-nowrap">https://instagram.com/sua_pagina</span>). Deixe em branco para ocultar o ícone.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ContentField label="Instagram (URL)" value={sections.footer?.social_instagram || ""} onChange={(v) => updateField("footer", "social_instagram", v)} />
          <ContentField label="Facebook (URL)" value={sections.footer?.social_facebook || ""} onChange={(v) => updateField("footer", "social_facebook", v)} />
          <ContentField label="YouTube (URL)" value={sections.footer?.social_youtube || ""} onChange={(v) => updateField("footer", "social_youtube", v)} />
          <ContentField label="LinkedIn (URL)" value={sections.footer?.social_linkedin || ""} onChange={(v) => updateField("footer", "social_linkedin", v)} />
        </div>
        <p className="text-xs font-medium text-muted-foreground pt-2 border-t border-border">Links de navegação do rodapé</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <ContentField label="Link 1" value={sections.footer?.nav1 || ""} onChange={(v) => updateField("footer", "nav1", v)} />
          <ContentField label="Link 2" value={sections.footer?.nav2 || ""} onChange={(v) => updateField("footer", "nav2", v)} />
          <ContentField label="Link 3" value={sections.footer?.nav3 || ""} onChange={(v) => updateField("footer", "nav3", v)} />
          <ContentField label="Link 4" value={sections.footer?.nav4 || ""} onChange={(v) => updateField("footer", "nav4", v)} />
          <ContentField label="Link 5" value={sections.footer?.nav5 || ""} onChange={(v) => updateField("footer", "nav5", v)} />
        </div>
      </ContentSectionCard>

      {/* Visibilidade */}
      <div className="bg-card rounded-xl border border-border/80 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 gap-3">
          <h3 className="text-base font-semibold text-foreground tracking-tight">
            <span className="mr-2" aria-hidden>
              👁️
            </span>
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
