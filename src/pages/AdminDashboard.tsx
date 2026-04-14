import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  LogOut, Image, Calendar, ShieldCheck, Settings, FileText, Users,
  ChevronLeft, ChevronRight, MessageSquare,
} from "lucide-react";
import { usePublicSite } from "@/contexts/PublicSiteContext";
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
  const { logoSrc } = usePublicSite();
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
      <div className="min-h-screen flex items-center justify-center bg-muted/50">
        <div className="text-center rounded-2xl border border-border/80 bg-card px-10 py-8 shadow-sm">
          <img src={logoSrc} alt="SL Turismo" className="h-14 w-14 mx-auto mb-4 rounded-xl object-cover shadow-sm ring-1 ring-border/60" />
          <p className="text-sm font-medium text-foreground">A carregar painel</p>
          <p className="text-xs text-muted-foreground mt-1">Um momento…</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  const currentItem = menuItems.find((i) => i.key === activeSection);

  return (
    <div className="flex min-h-dvh max-h-dvh bg-muted/40">
      {/* Sidebar */}
      <aside
        className={`${sidebarCollapsed ? "w-[72px]" : "w-[240px]"} bg-card border-r border-border/80 flex flex-col transition-all duration-200 shrink-0 h-dvh overflow-y-auto shadow-[2px_0_12px_-4px_rgba(0,0,0,0.06)]`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-border/80 flex items-center gap-3 min-h-[4.25rem]">
          <img src={logoSrc} alt="SL Turismo" className="h-10 w-10 rounded-lg shrink-0 object-cover ring-1 ring-border/60 shadow-sm" />
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <span className="block text-sm font-semibold text-foreground tracking-tight truncate">SL Turismo</span>
              <span className="block text-[11px] text-muted-foreground">Painel</span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2.5 space-y-0.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveSection(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/15"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                } ${sidebarCollapsed ? "justify-center px-2" : ""}`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : ""}`} />
                {!sidebarCollapsed && <span className="truncate text-left">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Collapse + Logout */}
        <div className="border-t border-border/80 p-2 space-y-0.5 mt-auto">
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-colors"
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4 mx-auto" /> : <ChevronLeft className="h-4 w-4 shrink-0" />}
            {!sidebarCollapsed && <span>Recolher menu</span>}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* Main Content: scroll aqui (não na janela) para listas longas e Select/Dialog não puxarem o documento */}
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="mx-auto max-h-full w-full max-w-6xl flex-1 space-y-6 overflow-y-auto p-5 sm:p-6 lg:p-8">
          <header className="rounded-xl border border-border/80 bg-card px-5 py-4 shadow-sm flex items-start gap-4">
            {currentItem && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <currentItem.icon className="h-5 w-5" />
              </div>
            )}
            <div className="min-w-0 pt-0.5">
              <h1 className="text-lg font-semibold text-foreground tracking-tight">{currentItem?.label}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Painel administrativo · SL Turismo</p>
            </div>
          </header>

          <div className="min-w-0">
            {activeSection === "requests" && <AdminRequests />}
            {activeSection === "gallery" && <AdminGallery />}
            {activeSection === "events" && <AdminEvents />}
            {activeSection === "content" && <AdminContent />}
            {activeSection === "newsletter" && <AdminNewsletter />}
            {activeSection === "cadastur" && <AdminCadastur />}
            {activeSection === "settings" && <AdminSettings />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
