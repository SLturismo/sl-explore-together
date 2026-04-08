import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Image, Calendar, Mail, ShieldCheck, Settings } from "lucide-react";
import logoImg from "@/assets/logo-sl-turismo.jpg";
import AdminGallery from "@/components/admin/AdminGallery";
import AdminEvents from "@/components/admin/AdminEvents";
import AdminRequests from "@/components/admin/AdminRequests";
import AdminCadastur from "@/components/admin/AdminCadastur";
import AdminSettings from "@/components/admin/AdminSettings";

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/admin/login");
        return;
      }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin");

      if (!roles || roles.length === 0) {
        toast({ title: "Acesso negado", description: "Você não tem permissão de administrador.", variant: "destructive" });
        await supabase.auth.signOut();
        navigate("/admin/login");
        return;
      }
      setIsAdmin(true);
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") navigate("/admin/login");
    });

    checkAuth();
    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-rose-light">
        <div className="text-center">
          <img src={logoImg} alt="SL Turismo" className="h-16 mx-auto mb-4 rounded-xl" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-rose-light">
      <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logoImg} alt="SL Turismo" className="h-10 rounded-lg" />
          <h1 className="font-display text-lg font-bold text-foreground">Painel Admin</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1">
          <LogOut className="h-4 w-4" /> Sair
        </Button>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="w-full justify-start mb-6 bg-card flex-wrap">
            <TabsTrigger value="requests" className="gap-1"><Mail className="h-4 w-4" />Solicitações</TabsTrigger>
            <TabsTrigger value="gallery" className="gap-1"><Image className="h-4 w-4" />Galeria</TabsTrigger>
            <TabsTrigger value="events" className="gap-1"><Calendar className="h-4 w-4" />Eventos</TabsTrigger>
            <TabsTrigger value="cadastur" className="gap-1"><ShieldCheck className="h-4 w-4" />Cadastur</TabsTrigger>
            <TabsTrigger value="settings" className="gap-1"><Settings className="h-4 w-4" />Configurações</TabsTrigger>
          </TabsList>
          <TabsContent value="requests"><AdminRequests /></TabsContent>
          <TabsContent value="gallery"><AdminGallery /></TabsContent>
          <TabsContent value="events"><AdminEvents /></TabsContent>
          <TabsContent value="cadastur"><AdminCadastur /></TabsContent>
          <TabsContent value="settings"><AdminSettings /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
