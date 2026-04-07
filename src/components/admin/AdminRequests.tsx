import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

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

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  contacted: "Contatada",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
};

const statusColors: Record<string, string> = {
  pending: "bg-sunshine text-sunshine-foreground",
  contacted: "bg-turquoise text-turquoise-foreground",
  confirmed: "bg-primary text-primary-foreground",
  cancelled: "bg-destructive text-destructive-foreground",
};

const AdminRequests = () => {
  const [requests, setRequests] = useState<TravelRequest[]>([]);
  const [loading, setLoading] = useState(true);
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

  if (loading) return <p className="text-muted-foreground">Carregando...</p>;

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-bold text-foreground">{requests.length} Solicitações</h2>
      {requests.length === 0 && <p className="text-muted-foreground">Nenhuma solicitação ainda.</p>}
      {requests.map((req) => (
        <Card key={req.id} className="border-border">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-foreground">{req.name}</h3>
                <p className="text-sm text-muted-foreground">{req.email} {req.phone && `· ${req.phone}`}</p>
              </div>
              <Badge className={statusColors[req.status] || ""}>{statusLabels[req.status] || req.status}</Badge>
            </div>
            <div className="text-sm space-y-1">
              <p><strong>Destino:</strong> {req.destination}</p>
              {req.dates && <p><strong>Datas:</strong> {req.dates}</p>}
              {req.budget && <p><strong>Orçamento:</strong> {req.budget}</p>}
              {req.trip_type && <p><strong>Tipo:</strong> {req.trip_type}</p>}
              {req.notes && <p><strong>Obs:</strong> {req.notes}</p>}
            </div>
            <div className="flex items-center gap-2">
              <Select value={req.status} onValueChange={(v) => updateStatus(req.id, v)}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="contacted">Contatada</SelectItem>
                  <SelectItem value="confirmed">Confirmada</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
              <a href={`https://wa.me/${req.phone?.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline">WhatsApp</Button>
              </a>
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(req.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminRequests;
