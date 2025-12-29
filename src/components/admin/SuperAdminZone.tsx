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

        {/* Seed de Balões */}
        <div className="space-y-2">
          <h3 className="font-bold text-white">Importar Catálogo de Balões</h3>
          <p className="text-sm text-slate-400">
            Atualiza apenas os preços e tipos de balões (Simples, Metálico,
            Candy, etc) sem apagar seus produtos ou outras configurações.
          </p>
          <Button
            onClick={handleSeedBalloons}
            disabled={isLoading}
            variant="secondary"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
          >
            {isLoading ? "Processando..." : "🚀 Atualizar Apenas Balões"}
          </Button>
        </div>
      </div>
    </div>
  );
}
