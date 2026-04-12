import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { KeyRound, Shield } from "lucide-react";

const AdminSettings = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast({ title: "A senha deve ter pelo menos 6 caracteres", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "As senhas não coincidem", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (error) {
      toast({ title: "Erro ao alterar senha", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: "Senha alterada com sucesso! ✅",
        description: "Na próxima vez, use esta senha na tela de login do painel.",
      });
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <div className="max-w-lg space-y-6">
      <div className="bg-card rounded-xl border border-border/80 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-foreground tracking-tight flex items-center gap-2 mb-6">
          <KeyRound className="h-5 w-5 text-primary shrink-0" />
          Alterar senha
        </h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nova Senha</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required placeholder="Mínimo 6 caracteres" />
          </div>
          <div className="space-y-1.5">
            <Label>Confirmar Nova Senha</Label>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="Repita a nova senha" />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Alterando..." : "Alterar Senha"}
          </Button>
        </form>
      </div>

      <div className="bg-card rounded-xl border border-border/80 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-foreground tracking-tight flex items-center gap-2 mb-3">
          <Shield className="h-5 w-5 text-primary shrink-0" />
          Segurança
        </h3>
        <p className="text-sm text-muted-foreground">
          Mantenha sua senha segura e não a compartilhe. Use no mínimo 6 caracteres com letras e números.
        </p>
      </div>
    </div>
  );
};

export default AdminSettings;
