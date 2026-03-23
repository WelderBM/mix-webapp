"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Database, Lock, CheckCircle } from "lucide-react";
import { seedDatabase, seedBalloons } from "@/lib/seed";
import { toast } from "sonner";

export function SuperAdminZone() {
  const [isLoading, setIsLoading] = useState(false);

  const handleRunSeed = async () => {
    if (
      !confirm(
        "⚠️ PERIGO: Isso vai sobrescrever as configurações e criar produtos teste. Tem certeza?"
      )
    )
      return;

    setIsLoading(true);
    try {
      await seedDatabase();
      toast.success("Banco de dados resetado e populado!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao rodar seed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeedBalloons = async () => {
    setIsLoading(true);
    try {
      await seedBalloons();
      toast.success("Configurações de balões importadas!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao importar balões.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 text-slate-100 p-8 rounded-xl border border-slate-700 space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-700 pb-4">
        <Database className="text-blue-400" />
        <h2 className="text-xl font-bold">Ferramentas de Sistema</h2>
        <span className="ml-auto bg-green-900/30 text-green-400 text-xs px-2 py-1 rounded border border-green-900 flex items-center gap-1">
          <CheckCircle size={12} /> Autenticado
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <h3 className="font-bold text-white">Resetar & Popular (Seed)</h3>
          <p className="text-sm text-slate-400">
            Apaga/Sobrescreve configurações da Home e cria produtos de exemplo
            (Sabonete, Hidratante, Cesta) com a nova lógica de slots.
          </p>
          <Button
            onClick={handleRunSeed}
            disabled={isLoading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold"
          >
            {isLoading ? "Rodando..." : "⚠️ Executar Seed Database"}
          </Button>
        </div>

        {/* Gerenciamento de Whitelist */}
        <div className="space-y-4 border-t border-slate-700 pt-6 md:col-span-2">
          <div className="flex items-center gap-2">
            <Lock className="text-yellow-400" size={20} />
            <h3 className="font-bold text-white">Whitelist de Funcionários (Acesso Admin)</h3>
          </div>
          <p className="text-sm text-slate-400">
            Adicione o e-mail do funcionário para permitir o acesso ao painel. 
            O funcionário PRECISA ter o e-mail verificado (automaticamente no Google Auth).
          </p>
          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const email = formData.get('email') as string;
              if(!email) return;
              
              setIsLoading(true);
              try {
                const { doc, setDoc } = await import("firebase/firestore");
                const { db } = await import("@/lib/firebase");
                await setDoc(doc(db, "whitelisted_staff", email.toLowerCase()), {
                  active: true,
                  addedAt: new Date().toISOString(),
                  role: "staff"
                });
                toast.success(`E-mail ${email} adicionado à whitelist!`);
                (e.target as HTMLFormElement).reset();
              } catch (error) {
                console.error(error);
                toast.error("Erro ao adicionar e-mail.");
              } finally {
                setIsLoading(false);
              }
            }}
            className="flex gap-2"
          >
            <Input 
              name="email"
              type="email" 
              placeholder="funcionario@gmail.com" 
              className="bg-slate-800 border-slate-700 text-white flex-1"
              required
            />
            <Button type="submit" disabled={isLoading} className="bg-purple-600 hover:bg-purple-700">
              {isLoading ? "Salvando..." : "Autorizar E-mail"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
