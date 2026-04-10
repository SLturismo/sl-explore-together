import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { Eye, Filter, MessageCircle, Phone, Mail as MailIcon, MapPin, CalendarDays, DollarSign, FileText, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
  const [selectedReq, setSelectedReq] = useState<TravelRequest | null>(null);
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
      if (selectedReq?.id === id) setSelectedReq((prev) => prev ? { ...prev, status } : null);
      toast({ title: "Status atualizado!" });
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("travel_requests").delete().eq("id", id);
    if (!error) {
      setRequests((prev) => prev.filter((r) => r.id !== id));
      if (selectedReq?.id === id) setSelectedReq(null);
      toast({ title: "Solicitação removida" });
    }
  };

  const openDetail = async (req: TravelRequest) => {
    setSelectedReq(req);
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
    <div className="space-y-6">
      {/* Metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {allStatuses.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(filter === s ? "all" : s)}
            className={`rounded-xl p-3 text-center transition-all border ${
              filter === s ? "ring-2 ring-primary border-primary" : "border-border"
            } bg-card hover:shadow-md`}
          >
            <p className="text-2xl font-bold text-foreground">{counts[s] || 0}</p>
            <p className="text-xs text-muted-foreground">{statusLabels[s]}</p>
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-lg font-bold text-foreground">
          {filtered.length} Solicitações
        </h2>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-44 bg-card"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas ({requests.length})</SelectItem>
              {allStatuses.map((s) => (
                <SelectItem key={s} value={s}>{statusLabels[s]} ({counts[s] || 0})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">Nenhuma solicitação encontrada.</p>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Nome</TableHead>
                <TableHead>Destino</TableHead>
                <TableHead className="hidden md:table-cell">Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Recebido</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((req) => (
                <TableRow
                  key={req.id}
                  className="cursor-pointer"
                  onClick={() => openDetail(req)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {req.name}
                      {req.status === "pending" && <Eye className="h-3.5 w-3.5 text-sunshine animate-pulse" />}
                    </div>
                  </TableCell>
                  <TableCell>{req.destination}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{req.dates || "—"}</TableCell>
                  <TableCell>
                    <Badge className={`${statusColors[req.status] || ""} text-xs`}>
                      {statusLabels[req.status] || req.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground text-xs">
                    {new Date(req.created_at).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {req.phone && (
                        <a href={`https://wa.me/${req.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-accent">
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        </a>
                      )}
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(req.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Detail Sheet */}
      <Sheet open={!!selectedReq} onOpenChange={(open) => !open && setSelectedReq(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          {selectedReq && (
            <>
              <SheetHeader>
                <SheetTitle className="font-display">{selectedReq.name}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-5">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <MailIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{selectedReq.email}</span>
                  </div>
                  {selectedReq.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>{selectedReq.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{selectedReq.destination}</span>
                  </div>
                  {selectedReq.dates && (
                    <div className="flex items-center gap-3 text-sm">
                      <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>{selectedReq.dates}</span>
                    </div>
                  )}
                  {selectedReq.budget && (
                    <div className="flex items-center gap-3 text-sm">
                      <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>{selectedReq.budget}</span>
                    </div>
                  )}
                  {selectedReq.trip_type && (
                    <div className="flex items-center gap-3 text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>{selectedReq.trip_type}</span>
                    </div>
                  )}
                  {selectedReq.notes && (
                    <div className="bg-muted/50 rounded-lg p-3 text-sm">
                      <p className="font-medium text-xs text-muted-foreground mb-1">Observações</p>
                      <p>{selectedReq.notes}</p>
                    </div>
                  )}
                </div>

                <div className="border-t border-border pt-4 space-y-3">
                  <p className="text-xs font-medium text-muted-foreground">Status do atendimento</p>
                  <Select value={selectedReq.status} onValueChange={(v) => updateStatus(selectedReq.id, v)}>
                    <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {allStatuses.map((s) => (
                        <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  {selectedReq.phone && (
                    <a href={`https://wa.me/${selectedReq.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex-1">
                      <Button className="w-full gap-2 bg-accent hover:bg-accent/90">
                        <MessageCircle className="h-4 w-4" /> WhatsApp
                      </Button>
                    </a>
                  )}
                  <a href={`mailto:${selectedReq.email}`} className="flex-1">
                    <Button variant="outline" className="w-full gap-2">
                      <MailIcon className="h-4 w-4" /> E-mail
                    </Button>
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
