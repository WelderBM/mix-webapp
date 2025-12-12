"use client";

import { ShoppingCart, Menu, ChevronRight, Plus, Search } from "lucide-react";

interface ThemePreviewProps {
  primaryColor: string;
  secondaryColor: string;
}

export function ThemePreview({
  primaryColor,
  secondaryColor,
}: ThemePreviewProps) {
  return (
    <div className="border rounded-3xl overflow-hidden shadow-2xl bg-slate-50 w-full max-w-[320px] mx-auto font-sans text-xs select-none pointer-events-none">
      {/* 1. Header Simulado */}
      <div className="bg-white p-3 flex justify-between items-center border-b">
        <div className="flex items-center gap-2">
          <Menu size={16} className="text-slate-400" />
          <span className="font-bold text-slate-800">Sua Loja</span>
        </div>
        <ShoppingCart size={16} style={{ color: primaryColor }} />
      </div>

      {/* 2. Hero / Banners */}
      <div className="p-3 space-y-3">
        <div className="h-24 rounded-xl bg-gradient-to-r from-slate-200 to-slate-100 relative overflow-hidden flex items-center justify-center border border-slate-200">
          <span className="text-slate-400 font-bold text-lg opacity-50">
            Banner
          </span>
        </div>

        {/* 3. Filtros / Botões Primários */}
        <div className="flex gap-2 overflow-hidden">
          <div
            className="px-3 py-1 rounded-full text-white font-semibold shadow-sm"
            style={{ backgroundColor: primaryColor }}
          >
            Início
          </div>
          <div className="px-3 py-1 rounded-full bg-white border text-slate-600">
            Kits
          </div>
          <div className="px-3 py-1 rounded-full bg-white border text-slate-600">
            Fitas
          </div>
        </div>

        {/* 4. Lista de Produtos */}
        <div className="grid grid-cols-2 gap-2">
          {/* Produto 1 */}
          <div className="bg-white p-2 rounded-lg border shadow-sm flex flex-col gap-2">
            <div className="h-20 bg-slate-100 rounded-md w-full relative border border-slate-100">
              <div className="absolute top-1 left-1 bg-white px-1 rounded text-[8px] border font-medium text-slate-500">
                Novo
              </div>
            </div>
            <div className="space-y-1">
              <div className="h-2 w-3/4 bg-slate-200 rounded"></div>
              <div className="h-2 w-1/2 bg-slate-100 rounded"></div>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="font-bold text-slate-800">R$ 25,00</span>
              {/* Botão Secundário (Ação de Compra) */}
              <div
                className="p-1 rounded text-white shadow-sm"
                style={{ backgroundColor: secondaryColor }}
              >
                <Plus size={12} />
              </div>
            </div>
          </div>

          {/* Produto 2 */}
          <div className="bg-white p-2 rounded-lg border shadow-sm flex flex-col gap-2">
            <div className="h-20 bg-slate-100 rounded-md w-full border border-slate-100"></div>
            <div className="space-y-1">
              <div className="h-2 w-full bg-slate-200 rounded"></div>
            </div>
            <div className="flex justify-between items-center mt-auto">
              <span className="font-bold text-slate-800">R$ 12,90</span>
              <div
                className="p-1 rounded text-white shadow-sm"
                style={{ backgroundColor: secondaryColor }}
              >
                <Plus size={12} />
              </div>
            </div>
          </div>
        </div>

        {/* 5. Botão "Ver Mais" (Estilo Outline com Cor Primária) */}
        <div className="flex justify-center mt-2">
          <div
            className="px-4 py-2 rounded-full border bg-white font-bold flex items-center gap-1 shadow-sm"
            style={{ borderColor: primaryColor, color: primaryColor }}
          >
            <Plus size={12} /> Ver mais grupos
          </div>
        </div>
      </div>

      {/* Footer Falso */}
      <div className="bg-white p-2 text-center text-slate-300 text-[8px] border-t">
        Simulação em Tempo Real
      </div>
    </div>
  );
}
