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

        <div className="max-w-4xl mx-auto px-4 -mt-6 relative z-10">
          <div className="mb-6 flex items-center justify-between">
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-500 hover:text-slate-900"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
            </Link>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-10 mb-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
                Orçamento de Balões 🎈
              </h1>
              <p className="text-lg text-slate-500 leading-relaxed">
                Personalize seus balões do seu jeito! Escolha entre diversos
                tamanhos, formatos e acabamentos. Adicione ao carrinho para
                solicitar seu orçamento via WhatsApp.
              </p>
            </div>

            <BalloonBuilder />
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
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
