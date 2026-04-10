import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  LogOut, Image, Calendar, Mail, ShieldCheck, Settings, FileText, Users,
  LayoutDashboard, ChevronLeft, ChevronRight, MessageSquare
} from "lucide-react";
import logoImg from "@/assets/logo-sl-turismo.jpg";
import AdminGallery from "@/components/admin/AdminGallery";
import AdminEvents from "@/components/admin/AdminEvents";
import AdminRequests from "@/components/admin/AdminRequests";
import AdminCadastur from "@/components/admin/AdminCadastur";
import AdminSettings from "@/components/admin/AdminSettings";
import AdminNewsletter from "@/components/admin/AdminNewsletter";
import AdminContent from "@/components/admin/AdminContent";

const menuItems = [
  { key: "requests", label: "Solicitações", icon: MessageSquare },
  { key: "gallery", label: "Galeria", icon: Image },
  { key: "events", label: "Eventos", icon: Calendar },
  { key: "content", label: "Conteúdo", icon: FileText },
  { key: "newsletter", label: "Newsletter", icon: Users },
  { key: "cadastur", label: "Cadastur", icon: ShieldCheck },
  { key: "settings", label: "Configurações", icon: Settings },
];

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeSection, setActiveSection] = useState("requests");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/admin/login"); return; }
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin");
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
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <img src={logoImg} alt="SL Turismo" className="h-16 mx-auto mb-4 rounded-xl" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  const currentItem = menuItems.find((i) => i.key === activeSection);

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Sidebar */}
      <aside
        className={`${sidebarCollapsed ? "w-[68px]" : "w-60"} bg-card border-r border-border flex flex-col transition-all duration-200 shrink-0 sticky top-0 h-screen`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-border flex items-center gap-3">
          <img src={logoImg} alt="SL Turismo" className="h-9 w-9 rounded-lg shrink-0 object-cover" />
          {!sidebarCollapsed && (
            <span className="font-display text-sm font-bold text-foreground truncate">SL Turismo</span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveSection(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Collapse + Logout */}
        <div className="border-t border-border p-2 space-y-1">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {!sidebarCollapsed && <span>Recolher</span>}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-sm border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            {currentItem && <currentItem.icon className="h-5 w-5 text-primary" />}
            <div>
              <h1 className="font-display text-xl font-bold text-foreground">{currentItem?.label}</h1>
              <p className="text-xs text-muted-foreground">Painel Administrativo · SL Turismo</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6 max-w-6xl">
          {activeSection === "requests" && <AdminRequests />}
          {activeSection === "gallery" && <AdminGallery />}
          {activeSection === "events" && <AdminEvents />}
          {activeSection === "content" && <AdminContent />}
          {activeSection === "newsletter" && <AdminNewsletter />}
          {activeSection === "cadastur" && <AdminCadastur />}
          {activeSection === "settings" && <AdminSettings />}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
