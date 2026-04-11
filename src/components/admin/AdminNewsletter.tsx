import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Search, Download, Mail } from "lucide-react";

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
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-muted-foreground flex items-center gap-1.5"><Mail className="h-4 w-4" />{subscribers.length} inscritos</p>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar e-mail..." className="pl-8 h-9 w-52 bg-card text-sm" />
          </div>
          <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5"><Download className="h-3.5 w-3.5" />CSV</Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">Nenhum inscrito encontrado.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((sub) => (
            <div key={sub.id} className="bg-card rounded-lg border border-border px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{sub.email}</p>
                <p className="text-[11px] text-muted-foreground">{new Date(sub.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(sub.id)}>
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
