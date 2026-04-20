import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { usePublicSite } from "@/contexts/PublicSiteContext";
import { getPasswordResetRedirectUrl } from "@/lib/app-url";

const AdminLogin = () => {
  const { logoSrc } = usePublicSite();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const loginErrorDescription = (message: string) => {
    const lower = message.toLowerCase();
    if (
      lower.includes("invalid login") ||
      lower.includes("invalid credentials") ||
      lower.includes("credenciais")
    ) {
      return `${message} Se você acabou de se cadastrar, confirme o link enviado ao e-mail (Supabase exige isso por padrão). Verifique também se está usando o mesmo e-mail e senha, sem espaços.`;
    }
    return message;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailTrim = email.trim();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: emailTrim, password });
    setLoading(false);
    if (error) {
      toast({
        title: "Erro ao entrar",
        description: loginErrorDescription(error.message),
        variant: "destructive",
      });
    } else {
      navigate("/admin");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailTrim = email.trim();
    if (!emailTrim) {
      toast({ title: "Informe seu e-mail", variant: "destructive" });
      return;
    }
    setForgotLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(emailTrim, {
      redirectTo: getPasswordResetRedirectUrl(),
    });
    setForgotLoading(false);
    if (error) {
      toast({ title: "Não foi possível enviar o e-mail", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: "E-mail enviado",
      description: "Se existir uma conta com esse e-mail, você receberá o link para redefinir a senha. Verifique também o spam.",
      duration: 10000,
    });
    setShowForgot(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-rose-light px-4">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-xl p-8 border border-border">
        <div className="text-center mb-8">
          {logoSrc ? <img src={logoSrc} alt="SL Turismo" className="h-20 w-auto mx-auto rounded-xl mb-4" /> : null}
          <h1 className="font-display text-2xl font-bold text-foreground">Painel Administrativo</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {showForgot
              ? "Informe o e-mail da sua conta"
              : "Acesse com suas credenciais"}
          </p>
        </div>
        {showForgot ? (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={forgotLoading}>
              {forgotLoading ? "Enviando..." : "Enviar link de redefinição"}
            </Button>
            <button
              type="button"
              className="w-full text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setShowForgot(false)}
            >
              Voltar ao login
            </button>
          </form>
        ) : (
          <>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
            <div className="text-center mt-2">
              <button type="button" className="text-sm text-primary hover:underline" onClick={() => setShowForgot(true)}>
                Esqueci minha senha
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminLogin;
