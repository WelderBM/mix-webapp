"use client";

import { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";

export function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    isLoading || setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // O redirecionamento é automático pelo onAuthStateChanged do pai
      toast.success("Bem-vindo de volta!");
    } catch (error: any) {
      console.error("Login error:", error);
      let message = "Erro ao fazer login.";
      if (error.code === "auth/invalid-credential") {
        message = "E-mail ou senha incorretos.";
      } else if (error.code === "auth/too-many-requests") {
        message = "Muitas tentativas. Bloqueado temporariamente.";
      }
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm border border-slate-200">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mb-4">
            <Lock size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Acesso Admin</h1>
          <p className="text-sm text-slate-500 text-center mt-1">
            Entre com suas credenciais de gestor.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@mixnovidades.com"
              required
              className="h-12"
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha de acesso"
              required
              className="h-12"
              autoComplete="current-password"
            />
          </div>

          <Button
            className="w-full h-12 text-base font-bold bg-purple-600 hover:bg-purple-700 transition-colors"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isLoading ? "Validando..." : "Acessar Painel"}
          </Button>
        </form>
      </div>
    </div>
  );
}
