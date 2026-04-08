import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import logoImg from "@/assets/logo-sl-turismo.jpg";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
    } else {
      navigate("/admin");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "A senha deve ter pelo menos 6 caracteres", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "Erro ao criar conta", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Conta criada com sucesso! ✅", description: "Agora faça login para acessar o painel." });
      setIsSignup(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-rose-light px-4">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-xl p-8 border border-border">
        <div className="text-center mb-8">
          <img src={logoImg} alt="SL Turismo" className="h-20 w-auto mx-auto rounded-xl mb-4" />
          <h1 className="font-display text-2xl font-bold text-foreground">Painel Administrativo</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isSignup ? "Crie sua conta de administrador" : "Acesse com suas credenciais"}
          </p>
        </div>
        <form onSubmit={isSignup ? handleSignup : handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
            {loading ? (isSignup ? "Criando..." : "Entrando...") : (isSignup ? "Criar Conta" : "Entrar")}
          </Button>
        </form>
        <div className="text-center mt-4">
          <button
            type="button"
            className="text-sm text-primary hover:underline"
            onClick={() => setIsSignup(!isSignup)}
          >
            {isSignup ? "Já tem conta? Faça login" : "Primeiro acesso? Criar conta"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
