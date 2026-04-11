import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { Eye, MessageCircle, Phone, Mail as MailIcon, MapPin, CalendarDays, DollarSign, FileText, Trash2 } from "lucide-react";

type TravelRequest = {
  id: string; name: string; email: string; phone: string | null;
  destination: string; dates: string | null; budget: string | null;
  trip_type: string | null; notes: string | null; status: string; created_at: string;
};

const allStatuses = ["pending", "seen", "in_progress", "contacted", "confirmed", "cancelled"] as const;
const statusLabels: Record<string, string> = { pending: "Nova", seen: "Visualizada", in_progress: "Em andamento", contacted: "Contatada", confirmed: "Confirmada", cancelled: "Cancelada" };
const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  seen: "bg-slate-100 text-slate-700 border-slate-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
  contacted: "bg-cyan-100 text-cyan-800 border-cyan-200",
  confirmed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

const AdminRequests = () => {
  const [requests, setRequests] = useState<TravelRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedReq, setSelectedReq] = useState<TravelRequest | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    supabase.from("travel_requests").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      setRequests(data || []);
      setLoading(false);
    });
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("travel_requests").update({ status }).eq("id", id);
    if (!error) {
      setRequests((p) => p.map((r) => (r.id === id ? { ...r, status } : r)));
      if (selectedReq?.id === id) setSelectedReq((p) => p ? { ...p, status } : null);
      toast({ title: "Status atualizado!" });
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("travel_requests").delete().eq("id", id);
    if (!error) {
      setRequests((p) => p.filter((r) => r.id !== id));
      if (selectedReq?.id === id) setSelectedReq(null);
      toast({ title: "Solicitação removida" });
    }
  };

  const openDetail = async (req: TravelRequest) => {
    setSelectedReq(req);
    if (req.status === "pending") await updateStatus(req.id, "seen");
  };

  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter);
  const counts = requests.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {} as Record<string, number>);

  if (loading) return <p className="text-muted-foreground">Carregando...</p>;

  return (
    <div className="space-y-5">
      {/* Status pills */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilter("all")} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${filter === "all" ? "bg-foreground text-background border-foreground" : "bg-card text-muted-foreground border-border hover:border-foreground/30"}`}>
          Todas ({requests.length})
        </button>
        {allStatuses.map((s) => (
          <button key={s} onClick={() => setFilter(filter === s ? "all" : s)} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${filter === s ? "ring-2 ring-primary " + statusColors[s] : "bg-card text-muted-foreground border-border hover:border-foreground/30"}`}>
            {statusLabels[s]} ({counts[s] || 0})
          </button>
        ))}
      </div>

      {/* Cards list */}
      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">Nenhuma solicitação encontrada.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => (
            <div key={req.id} onClick={() => openDetail(req)} className="bg-card rounded-lg border border-border p-4 hover:shadow-md transition-shadow cursor-pointer flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-foreground truncate">{req.name}</span>
                  {req.status === "pending" && <Eye className="h-3.5 w-3.5 text-amber-500 animate-pulse shrink-0" />}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{req.destination}</span>
                  {req.dates && <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{req.dates}</span>}
                  <span>{new Date(req.created_at).toLocaleDateString("pt-BR")}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge className={`${statusColors[req.status]} text-[11px] border`}>{statusLabels[req.status]}</Badge>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  {req.phone && (
                    <a href={`https://wa.me/${req.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600"><MessageCircle className="h-4 w-4" /></Button>
                    </a>
                  )}
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(req.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Sheet */}
      <Sheet open={!!selectedReq} onOpenChange={(open) => !open && setSelectedReq(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          {selectedReq && (
            <>
              <SheetHeader><SheetTitle className="font-display">{selectedReq.name}</SheetTitle></SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center gap-3"><MailIcon className="h-4 w-4 text-muted-foreground" /><span>{selectedReq.email}</span></div>
                  {selectedReq.phone && <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-muted-foreground" /><span>{selectedReq.phone}</span></div>}
                  <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-muted-foreground" /><span>{selectedReq.destination}</span></div>
                  {selectedReq.dates && <div className="flex items-center gap-3"><CalendarDays className="h-4 w-4 text-muted-foreground" /><span>{selectedReq.dates}</span></div>}
                  {selectedReq.budget && <div className="flex items-center gap-3"><DollarSign className="h-4 w-4 text-muted-foreground" /><span>{selectedReq.budget}</span></div>}
                  {selectedReq.trip_type && <div className="flex items-center gap-3"><FileText className="h-4 w-4 text-muted-foreground" /><span>{selectedReq.trip_type}</span></div>}
                  {selectedReq.notes && <div className="bg-muted/50 rounded-lg p-3 text-sm"><p className="font-medium text-xs text-muted-foreground mb-1">Observações</p><p>{selectedReq.notes}</p></div>}
                </div>
                <div className="border-t border-border pt-4 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Status do atendimento</p>
                  <Select value={selectedReq.status} onValueChange={(v) => updateStatus(selectedReq.id, v)}>
                    <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
                    <SelectContent>{allStatuses.map((s) => <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  {selectedReq.phone && (
                    <a href={`https://wa.me/${selectedReq.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex-1">
                      <Button className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"><MessageCircle className="h-4 w-4" />WhatsApp</Button>
                    </a>
                  )}
                  <a href={`mailto:${selectedReq.email}`} className="flex-1">
                    <Button variant="outline" className="w-full gap-2"><MailIcon className="h-4 w-4" />E-mail</Button>
                  </a>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Recebido em {new Date(selectedReq.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AdminRequests;
