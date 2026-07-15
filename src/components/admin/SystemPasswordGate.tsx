"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";

const SESSION_KEY = "mix-system-tools-unlocked";

// Desbloqueio vale só pra aba/sessão do navegador (sessionStorage) — fecha
// o navegador, pede a senha de novo. Evita ficar reautenticando a cada
// clique dentro da mesma sessão de trabalho.
export function useSystemToolsUnlocked() {
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    setUnlocked(sessionStorage.getItem(SESSION_KEY) === "true");
  }, []);

  const unlock = () => {
    sessionStorage.setItem(SESSION_KEY, "true");
    setUnlocked(true);
  };

  return { unlocked, unlock };
}

interface SystemPasswordPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnlocked: () => void;
}

export function SystemPasswordPrompt({
  open,
  onOpenChange,
  onUnlocked,
}: SystemPasswordPromptProps) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) setPassword("");
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/verify-system-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (data.ok) {
        onUnlocked();
        onOpenChange(false);
      } else if (res.status === 500) {
        toast.error(
          "Senha de sistema não configurada — defina SYSTEM_TOOLS_PASSWORD no ambiente."
        );
      } else {
        toast.error("Senha incorreta.");
      }
    } catch {
      toast.error("Erro ao verificar a senha. Tente de novo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock size={18} /> Área restrita
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="Senha do sistema"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            required
          />
          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                "Entrar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
