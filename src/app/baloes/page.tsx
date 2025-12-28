"use client";

import { Suspense } from "react";
import { BalloonBuilder } from "@/components/features/BalloonBuilder";
import { StoreHeader } from "@/components/layout/StoreHeader";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function BaloesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <main className="min-h-screen bg-slate-50 pb-20">
        <StoreHeader />

        {/* Container Principal ajustado igual à página de Fitas */}
        <div className="max-w-6xl mx-auto px-0 sm:px-4 -mt-4 relative z-10">
          <div className="bg-white sm:rounded-3xl shadow-sm border-t sm:border border-slate-100 overflow-hidden min-h-[600px]">
            {/* Header da Página igual Fitas */}
            <div className="p-6 sm:p-8 border-b bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-2 mb-2">
                <Link href="/" className="inline-flex md:hidden">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 -ml-2 text-slate-400"
                  >
                    <ArrowLeft size={18} />
                  </Button>
                </Link>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
                  Orçamento de Balões 🎈
                </h1>
              </div>
              <p className="text-sm sm:text-base text-slate-500 max-w-2xl">
                Personalize seus balões do seu jeito! Escolha entre diversos
                tamanhos, formatos e acabamentos. Adicione ao carrinho para
                solicitar seu orçamento.
              </p>
            </div>

            <div className="p-4 sm:p-8">
              <BalloonBuilder />
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center mt-8 px-4 sm:px-0">
            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
              <h3 className="font-bold text-blue-900 mb-2">Diversidade</h3>
              <p className="text-sm text-blue-700">
                De 5" a 39", formatos variados e acabamentos exclusivos.
              </p>
            </div>
            <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100">
              <h3 className="font-bold text-purple-900 mb-2">Qualidade</h3>
              <p className="text-sm text-purple-700">
                Trabalhamos apenas com as melhores marcas do mercado.
              </p>
            </div>
            <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
              <h3 className="font-bold text-green-900 mb-2">Personalização</h3>
              <p className="text-sm text-green-700">
                Crie arranjos únicos que combinam com sua festa.
              </p>
            </div>
          </div>
        </div>
      </main>
    </Suspense>
  );
}
