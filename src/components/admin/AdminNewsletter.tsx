import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Mail } from "lucide-react";

type Subscriber = {
  id: string;
  email: string;
  created_at: string;
};

const AdminNewsletter = () => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetch_ = async () => {
    const { data } = await supabase.from("newsletter_subscribers").select("*").order("created_at", { ascending: false });
    setSubscribers(data || []);
    setLoading(false);
  };

  useEffect(() => { fetch_(); }, []);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("newsletter_subscribers").delete().eq("id", id);
    if (!error) {
      setSubscribers((prev) => prev.filter((s) => s.id !== id));
      toast({ title: "Inscrito removido" });
    }
  };

  if (loading) return <p className="text-muted-foreground">Carregando...</p>;

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
        <Mail className="h-5 w-5" /> {subscribers.length} Inscritos na Newsletter
      </h2>
      {subscribers.length === 0 && <p className="text-muted-foreground">Nenhum inscrito ainda.</p>}
      {subscribers.map((sub) => (
        <Card key={sub.id} className="border-border">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">{sub.email}</p>
              <p className="text-xs text-muted-foreground">{new Date(sub.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}</p>
            </div>
            <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDelete(sub.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminNewsletter;
