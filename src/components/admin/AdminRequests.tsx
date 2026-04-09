import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Eye, Filter } from "lucide-react";

type TravelRequest = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  destination: string;
  dates: string | null;
  budget: string | null;
  trip_type: string | null;
  notes: string | null;
  status: string;
  created_at: string;
};

const allStatuses = ["pending", "seen", "in_progress", "contacted", "confirmed", "cancelled"] as const;

const statusLabels: Record<string, string> = {
  pending: "Nova",
  seen: "Visualizada",
  in_progress: "Em andamento",
  contacted: "Contatada",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
};

const statusColors: Record<string, string> = {
  pending: "bg-sunshine text-sunshine-foreground",
  seen: "bg-muted text-muted-foreground",
  in_progress: "bg-accent text-accent-foreground",
  contacted: "bg-turquoise text-turquoise-foreground",
  confirmed: "bg-primary text-primary-foreground",
  cancelled: "bg-destructive text-destructive-foreground",
};

const AdminRequests = () => {
  const [requests, setRequests] = useState<TravelRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from("travel_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Erro ao carregar solicitações", variant: "destructive" });
    } else {
      setRequests(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("travel_requests").update({ status }).eq("id", id);
    if (error) {
      toast({ title: "Erro ao atualizar status", variant: "destructive" });
    } else {
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      toast({ title: "Status atualizado!" });
    }
  };

  const handleExpand = async (req: TravelRequest) => {
    if (expandedId === req.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(req.id);
    if (req.status === "pending") {
      await updateStatus(req.id, "seen");
    }
  };

  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter);

  const counts = requests.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading) return <p className="text-muted-foreground">Carregando...</p>;

  return (
    <div className="space-y-4">
      {/* Counters */}
      <div className="flex flex-wrap gap-2">
        {allStatuses.map((s) => (
          <Badge key={s} variant="outline" className={`${counts[s] ? statusColors[s] : "opacity-50"} cursor-pointer`} onClick={() => setFilter(filter === s ? "all" : s)}>
            {statusLabels[s]}: {counts[s] || 0}
          </Badge>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas ({requests.length})</SelectItem>
            {allStatuses.map((s) => (
              <SelectItem key={s} value={s}>{statusLabels[s]} ({counts[s] || 0})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <h2 className="font-display text-xl font-bold text-foreground">{filtered.length} Solicitações</h2>
      {filtered.length === 0 && <p className="text-muted-foreground">Nenhuma solicitação encontrada.</p>}

      {filtered.map((req) => (
        <Card key={req.id} className="border-border cursor-pointer" onClick={() => handleExpand(req)}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  {req.name}
                  {req.status === "pending" && <Eye className="h-4 w-4 text-sunshine animate-pulse" />}
                </h3>
                <p className="text-sm text-muted-foreground">{req.destination} · {new Date(req.created_at).toLocaleDateString("pt-BR")}</p>
              </div>
              <Badge className={statusColors[req.status] || ""}>{statusLabels[req.status] || req.status}</Badge>
            </div>

            {expandedId === req.id && (
              <div className="space-y-3 pt-2 border-t border-border" onClick={(e) => e.stopPropagation()}>
                <div className="text-sm space-y-1">
                  <p><strong>Email:</strong> {req.email}</p>
                  {req.phone && <p><strong>Telefone:</strong> {req.phone}</p>}
                  <p><strong>Destino:</strong> {req.destination}</p>
                  {req.dates && <p><strong>Datas:</strong> {req.dates}</p>}
                  {req.budget && <p><strong>Orçamento:</strong> {req.budget}</p>}
                  {req.trip_type && <p><strong>Tipo:</strong> {req.trip_type}</p>}
                  {req.notes && <p><strong>Obs:</strong> {req.notes}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Select value={req.status} onValueChange={(v) => updateStatus(req.id, v)}>
                    <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {allStatuses.map((s) => (
                        <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {req.phone && (
                    <a href={`https://wa.me/${req.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline">WhatsApp</Button>
                    </a>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(req.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminRequests;
