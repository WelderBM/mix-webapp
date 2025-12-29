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
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secretCode, setSecretCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isRegistering) {
        // Simple security check to prevent public registration
        if (secretCode !== "MIX2025") {
          throw new Error("SECRET_CODE_INVALID");
        }
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success("Conta criada com sucesso!");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success("Login realizado com sucesso!");
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      let message = "Erro na autenticação.";

      if (error.message === "SECRET_CODE_INVALID") {
        message = "Código de segurança inválido.";
      } else if (error.code === "auth/invalid-credential") {
        message = "E-mail ou senha incorretos.";
      } else if (error.code === "auth/email-already-in-use") {
        message = "Este e-mail já está em uso.";
      } else if (error.code === "auth/weak-password") {
        message = "A senha deve ter pelo menos 6 caracteres.";
      } else if (error.code === "auth/configuration-not-found") {
        message =
          "Erro de Configuração: Ative o Login por E-mail no Firebase Console.";
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
          <h1 className="text-2xl font-bold text-slate-800">
            {isRegistering ? "Novo Admin" : "Acesso Admin"}
          </h1>
          <p className="text-sm text-slate-500 text-center mt-1">
            {isRegistering
              ? "Crie sua conta de administrador"
              : "Entre com suas credenciais seguras."}
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@exemplo.com"
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
              placeholder="Sua senha"
              required
              className="h-12"
              autoComplete={isRegistering ? "new-password" : "current-password"}
            />
          </div>

          {isRegistering && (
            <div className="space-y-2 animate-in slide-in-from-top-2 fade-in">
              <Input
                type="password"
                value={secretCode}
                onChange={(e) => setSecretCode(e.target.value)}
                placeholder="Código de Segurança (Master Key)"
                required
                className="h-12 border-purple-200 focus:border-purple-500"
              />
              <p className="text-[10px] text-slate-400 text-center">
                Solicite o código ao proprietário do sistema.
              </p>
            </div>
          )}

          <Button
            className="w-full h-12 text-base font-bold bg-purple-600 hover:bg-purple-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                {isRegistering ? "Criando..." : "Entrando..."}
              </>
            ) : isRegistering ? (
              "Criar Conta"
            ) : (
              "Entrar no Painel"
            )}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-sm text-purple-600 hover:underline font-medium"
            >
              {isRegistering
                ? "Já tenho conta? Entrar"
                : "Não tem conta? Cadastrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
