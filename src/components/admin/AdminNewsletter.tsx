import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Search, Download, Mail, Users } from "lucide-react";

type Subscriber = { id: string; email: string; created_at: string };

const AdminNewsletter = () => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    supabase.from("newsletter_subscribers").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      setSubscribers(data || []);
      setLoading(false);
    });
  }, []);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("newsletter_subscribers").delete().eq("id", id);
    if (!error) { setSubscribers((p) => p.filter((s) => s.id !== id)); toast({ title: "Inscrito removido" }); }
  };

  const exportCSV = () => {
    const csv = "Email,Data de Inscrição\n" + subscribers.map((s) => `${s.email},${new Date(s.created_at).toLocaleDateString("pt-BR")}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "newsletter-inscritos.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = subscribers.filter((s) => s.email.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <p className="text-muted-foreground">Carregando...</p>;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{subscribers.length} {subscribers.length === 1 ? "inscrito" : "inscritos"}</p>
            <p className="text-xs text-muted-foreground">E-mails captados pelo formulário do site</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px] sm:flex-initial sm:min-w-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar e-mail…"
              className="pl-8 h-9 w-full sm:w-56 bg-background text-sm border-border/80"
            />
          </div>
          <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5 shrink-0 border-border/80">
            <Download className="h-3.5 w-3.5" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/90 bg-muted/20 px-6 py-16 text-center">
          <Mail className="h-12 w-12 mx-auto text-muted-foreground/35 mb-4" strokeWidth={1.25} />
          <p className="text-sm font-medium text-foreground">
            {subscribers.length === 0 ? "Ainda não há inscritos" : "Nenhum resultado para esta pesquisa"}
          </p>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            {subscribers.length === 0
              ? "Quando visitantes assinarem a newsletter no site, a lista aparecerá aqui."
              : "Tente outro termo na caixa de busca."}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border/80 bg-card shadow-sm overflow-hidden divide-y divide-border/60">
          {filtered.map((sub) => (
            <div key={sub.id} className="px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-muted/25 transition-colors">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{sub.email}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Inscrito em {new Date(sub.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0" onClick={() => handleDelete(sub.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminNewsletter;
