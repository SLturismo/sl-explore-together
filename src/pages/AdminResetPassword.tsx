import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { usePublicSite } from "@/contexts/PublicSiteContext";

/** Página aberta pelo link do e-mail "Redefinir senha" do Supabase (redirectTo). */
const AdminResetPassword = () => {
  const { logoSrc } = usePublicSite();
  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const finishLoading = () => {
      if (!cancelled) setLoadingSession(false);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      if (cancelled) return;
      setSession(next);
      finishLoading();
    });

    const run = async () => {
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      const search = typeof window !== "undefined" ? window.location.search : "";
      const code = new URLSearchParams(search).get("code");

      if (code && typeof (supabase.auth as { exchangeCodeForSession?: (c: string) => Promise<unknown> }).exchangeCodeForSession === "function") {
        try {
          await (supabase.auth as { exchangeCodeForSession: (c: string) => Promise<{ error?: { message: string } }> }).exchangeCodeForSession(code);
        } catch {
          /* fluxo continua com getSession */
        }
      }

      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      setSession(data.session);

      const waitForTokens =
        !data.session &&
        (hash.includes("access_token") || hash.includes("type=recovery") || Boolean(code));

      if (data.session) {
        finishLoading();
        return;
      }

      if (waitForTokens) {
        timeoutId = setTimeout(async () => {
          if (cancelled) return;
          const { data: d2 } = await supabase.auth.getSession();
          setSession(d2.session);
          finishLoading();
        }, 700);
        return;
      }

      finishLoading();
    };

    void run();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
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
        <p className="text-muted-foreground text-sm">A validar o link…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-rose-light px-4">
        <div className="w-full max-w-md bg-card rounded-2xl shadow-xl p-8 border border-border text-center space-y-4">
          <img src={logoSrc} alt="SL Turismo" className="h-16 w-auto mx-auto rounded-xl" />
          <h1 className="font-display text-xl font-bold text-foreground">Link inválido ou expirado</h1>
          <p className="text-sm text-muted-foreground">
            Peça um novo e-mail na tela de login em <strong>Esqueci minha senha</strong> e use o link mais recente. Confirme também se abriu o site correto (ex.: www.slturismo.com).
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
          <img src={logoSrc} alt="SL Turismo" className="h-16 w-auto mx-auto rounded-xl mb-3" />
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
