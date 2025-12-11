"use client";

import { runSeed } from "@/lib/seed";
import { Button } from "@/components/ui/button";
import { Database, AlertTriangle } from "lucide-react";

export default function SeedPage() {
  const handleSeed = async () => {
    const confirm = window.confirm(
      "ATENÇÃO: Isso vai sobrescrever/adicionar dados no banco. Você apagou os antigos no Firebase Console?"
    );
    if (confirm) {
      await runSeed();
      alert("Processo finalizado! Verifique o console.");
    }
  };

  return (
    <div className="flex flex-col h-screen w-full items-center justify-center bg-slate-50 gap-6">
      <div className="flex flex-col items-center gap-2 text-slate-800">
        <Database size={64} className="text-slate-300" />
        <h1 className="text-3xl font-bold">Ferramenta de Seed</h1>
        <p className="text-slate-500">
          Use isso apenas em ambiente de desenvolvimento.
        </p>
      </div>

      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg max-w-md text-sm text-yellow-800 flex gap-3">
        <AlertTriangle className="shrink-0" />
        <p>
          Antes de clicar, certifique-se de ter apagado a coleção{" "}
          <strong>products</strong> no Firebase Console para evitar duplicidade
          de IDs ou mistura de schemas antigos.
        </p>
      </div>

      <Button
        onClick={handleSeed}
        size="lg"
        className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 h-16 text-lg shadow-xl"
      >
        POPULAR BANCO DE DADOS
      </Button>

      <a
        href="/"
        className="text-slate-400 hover:text-slate-600 underline mt-8"
      >
        Voltar para a Loja
      </a>
    </div>
  );
}
