import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import logoImg from "@/assets/logo-sl-turismo.jpg";

/** Página aberta pelo link do e-mail "Redefinir senha" do Supabase (redirectTo). */
const AdminResetPassword = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const sync = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setLoadingSession(false);
    };
    sync();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "A senha deve ter pelo menos 6 caracteres", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "As senhas não coincidem", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) {
      toast({ title: "Erro ao definir senha", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Senha atualizada! ✅", description: "Faça login com a nova senha." });
    await supabase.auth.signOut();
    navigate("/admin/login", { replace: true });
  };

  if (loadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-rose-light px-4">
        <p className="text-muted-foreground text-sm">Carregando…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-rose-light px-4">
        <div className="w-full max-w-md bg-card rounded-2xl shadow-xl p-8 border border-border text-center space-y-4">
          <img src={logoImg} alt="SL Turismo" className="h-16 w-auto mx-auto rounded-xl" />
          <h1 className="font-display text-xl font-bold text-foreground">Link inválido ou expirado</h1>
          <p className="text-sm text-muted-foreground">
            Peça um novo e-mail na tela de login em <strong>Esqueci minha senha</strong> e use o link mais recente.
          </p>
          <Button asChild className="w-full">
            <Link to="/admin/login">Voltar ao login</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-rose-light px-4">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-xl p-8 border border-border">
        <div className="text-center mb-6">
          <img src={logoImg} alt="SL Turismo" className="h-16 w-auto mx-auto rounded-xl mb-3" />
          <h1 className="font-display text-xl font-bold text-foreground">Nova senha</h1>
          <p className="text-muted-foreground text-sm mt-1">Defina a senha que usará no painel administrativo.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="np">Nova senha</Label>
            <Input
              id="np"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="npc">Confirmar senha</Label>
            <Input
              id="npc"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Salvando…" : "Salvar e ir ao login"}
          </Button>
        </form>
        <div className="text-center mt-4">
          <Link to="/admin/login" className="text-sm text-primary hover:underline">
            Voltar ao login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminResetPassword;
