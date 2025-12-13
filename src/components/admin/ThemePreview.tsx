"use client";

import {
  Store,
  ShoppingCart,
  User,
  Home,
  Gift,
  Heart,
  Snowflake,
  Flower,
  Scissors,
  Leaf,
  Plus,
  Package,
  Grip,
} from "lucide-react";
import { cn, hexToRgb } from "@/lib/utils";

interface ThemePreviewProps {
  primaryColor: string;
  secondaryColor: string;
  theme: "default" | "christmas" | "mothers_day" | "valentines";
}

export function ThemePreview({
  primaryColor,
  secondaryColor,
  theme,
}: ThemePreviewProps) {
  const primaryRgb = hexToRgb(primaryColor);

  // Variáveis CSS locais para facilitar a aplicação da cor no preview
  const previewStyles = {
    "--preview-primary": primaryColor,
    "--preview-primary-rgb": primaryRgb,
    "--preview-secondary": secondaryColor,
  } as React.CSSProperties;

  // --- MINI ATMOSFERAS (Animações do Topo) ---
  const renderMiniAtmosphere = () => {
    switch (theme) {
      case "christmas":
        return (
          <>
            <div className="absolute top-0 left-0 w-full flex justify-between px-1 z-20">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full mt-[-2px] animate-pulse",
                    i % 2 ? "bg-red-400" : "bg-green-400"
                  )}
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
            <div className="absolute inset-0 overflow-hidden z-10 pointer-events-none">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="absolute bg-white/60 rounded-full animate-mini-fall"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `-5px`,
                    width: `${Math.random() * 3 + 1}px`,
                    height: `${Math.random() * 3 + 1}px`,
                    animationDuration: `${Math.random() * 3 + 2}s`,
                    animationDelay: `${Math.random() * 2}s`,
                  }}
                />
              ))}
            </div>
          </>
        );
      case "valentines":
        return (
          <div className="absolute inset-0 overflow-hidden z-10 pointer-events-none opacity-50">
            {[...Array(6)].map((_, i) => (
              <Heart
                key={i}
                size={10}
                className="absolute text-red-300 animate-mini-float"
                style={{
                  left: `${Math.random() * 100}%`,
                  bottom: `-10px`,
                  animationDuration: `${Math.random() * 4 + 3}s`,
                  animationDelay: `${Math.random() * 3}s`,
                }}
              />
            ))}
          </div>
        );
      case "mothers_day":
        return (
          <div className="absolute top-1 right-1 z-10 opacity-50">
            <Flower
              size={16}
              className="text-pink-300 rotate-12 absolute top-0 right-0"
            />
            <Flower
              size={12}
              className="text-purple-300 -rotate-12 absolute top-4 right-3"
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="border-4 border-slate-800 rounded-[2.5rem] overflow-hidden w-[300px] h-[600px] bg-slate-50 flex flex-col relative shadow-xl mx-auto transform scale-90 origin-top"
      style={previewStyles}
    >
      {/* ESTILOS DAS MINI ANIMAÇÕES */}
      <style jsx>{`
        @keyframes mini-fall {
          to {
            transform: translateY(150px);
            opacity: 0;
          }
        }
        @keyframes mini-float {
          0% {
            opacity: 0;
            transform: translateY(0) scale(0.5);
          }
          20% {
            opacity: 1;
          }
          100% {
            transform: translateY(-150px) scale(1);
            opacity: 0;
          }
        }
        .animate-mini-fall {
          animation: mini-fall linear infinite;
        }
        .animate-mini-float {
          animation: mini-float ease-in infinite;
        }
      `}</style>

      {/* FAKE STATUS BAR */}
      <div className="h-6 bg-slate-800 w-full flex justify-between items-center px-4 text-[10px] text-white font-bold shrink-0">
        <span>09:41</span>
        <div className="flex gap-1">
          <span>Items</span>
          <span>Wi-Fi</span>
          <span>🔋</span>
        </div>
      </div>

      {/* CABEÇALHO DA LOJA (Com a cor selecionada) */}
      <div
        className="relative h-32 w-full overflow-hidden flex justify-center items-end pb-3 shrink-0 transition-colors duration-500"
        style={{ backgroundColor: primaryColor }}
      >
        {renderMiniAtmosphere()}
        <div className="absolute inset-0 opacity-20 bg-[url('/images/fachada-mix.jpg')] bg-cover bg-center grayscale mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-0"></div>
        <div className="relative z-20 text-center text-white px-4">
          <h2 className="font-bold text-lg leading-tight drop-shadow-sm">
            Mix Novidades
          </h2>
        </div>
      </div>

      {/* CORPO DA PÁGINA (SIMULAÇÃO DA HOME) */}
      <div className="flex-1 p-3 space-y-4 overflow-y-auto bg-slate-50 relative no-scrollbar">
        {/* 1. BANNER GRANDE (Monte seu Kit) - Base neutra, acento na cor */}
        <div className="h-32 rounded-2xl bg-slate-50 border border-slate-200 p-4 flex flex-col justify-between relative overflow-hidden">
          <div
            className="absolute top-0 right-0 p-2 opacity-10"
            style={{ color: primaryColor }}
          >
            <Gift size={60} />
          </div>
          <div>
            <div
              className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-full text-[8px] font-bold border shadow-sm"
              style={{
                color: primaryColor,
                borderColor: `rgba(${primaryRgb}, 0.2)`,
              }}
            >
              <Gift size={8} /> Personalizado
            </div>
            <h3 className="font-bold text-slate-800 text-sm mt-1">
              Monte seu Kit
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full text-white flex items-center justify-center shadow-sm"
              style={{ backgroundColor: primaryColor }}
            >
              <Plus size={12} />
            </div>
            <span
              className="text-[10px] font-bold"
              style={{ color: primaryColor }}
            >
              Começar
            </span>
          </div>
        </div>

        {/* 2. GRID DE BANNERS MENORES (Fitas e Natura) - Base neutra, acento na cor */}
        <div className="grid grid-cols-2 gap-3">
          {/* Fitas */}
          <div className="h-24 rounded-2xl bg-slate-50 border border-slate-200 p-3 flex flex-col justify-between relative overflow-hidden">
            <div
              className="absolute -right-2 -top-2 opacity-10 rotate-12"
              style={{ color: primaryColor }}
            >
              <Scissors size={40} />
            </div>
            <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
              <Grip size={8} /> Fitas
            </span>
            <h3 className="font-bold text-slate-800 text-xs leading-tight">
              Central de Corte
            </h3>
            <span
              className="text-[8px] underline decoration-2"
              style={{
                color: primaryColor,
                textDecorationColor: `rgba(${primaryRgb}, 0.3)`,
              }}
            >
              Ver opções
            </span>
          </div>
          {/* Natura */}
          <div className="h-24 rounded-2xl bg-slate-50 border border-slate-200 p-3 flex flex-col justify-between relative overflow-hidden text-center items-center">
            <div
              className="p-1.5 rounded-full bg-white shadow-sm"
              style={{ color: primaryColor }}
            >
              <Leaf size={14} />
            </div>
            <h3 className="font-bold text-slate-800 text-xs leading-tight">
              Universo Natura
            </h3>
            <span
              className="text-[8px] font-bold uppercase tracking-wider"
              style={{ color: primaryColor }}
            >
              Explorar
            </span>
          </div>
        </div>

        {/* 3. MINI VITRINE (Simulação de Produtos) */}
        <div>
          <h3
            className="text-sm font-bold text-slate-800 pl-2 border-l-4 mb-2"
            style={{ borderColor: primaryColor }}
          >
            Destaques
          </h3>
          <div className="flex gap-2 overflow-x-hidden">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-24 h-36 rounded-xl bg-white border border-slate-100 p-2 flex flex-col shrink-0"
              >
                <div className="flex-1 bg-slate-50 rounded-lg mb-2 relative overflow-hidden">
                  {/* Placeholder de imagem com tom da cor */}
                  <div
                    className="absolute inset-0 opacity-10"
                    style={{ backgroundColor: primaryColor }}
                  ></div>
                  <Package className="m-auto text-slate-300 mt-4" size={24} />
                </div>
                <div className="h-2 w-full bg-slate-100 rounded mb-1"></div>
                <div className="h-2 w-2/3 bg-slate-100 rounded mb-2"></div>
                {/* Botão com a cor selecionada */}
                <div
                  className="h-5 w-full rounded-md flex items-center justify-center text-[8px] font-bold text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  Adicionar
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* NAVBAR (Com indicador na cor selecionada) */}
      <div className="h-12 bg-white border-t flex justify-around items-center text-slate-400 relative shrink-0">
        {/* Indicador Ativo */}
        <div
          className="absolute top-0 h-0.5 w-8 bg-current transition-all duration-300"
          style={{ color: primaryColor, left: "15%" }}
        />

        <div
          className="flex flex-col items-center transition-colors duration-300"
          style={{ color: primaryColor }}
        >
          <Home size={16} />
          <span className="text-[8px] font-bold mt-0.5">Início</span>
        </div>
        <div className="flex flex-col items-center hover:text-slate-600">
          <Gift size={16} />
          <span className="text-[8px] mt-0.5">Kits</span>
        </div>
        <div className="flex flex-col items-center hover:text-slate-600 relative">
          <ShoppingCart size={16} />
          <span
            className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full text-[6px] text-white flex items-center justify-center"
            style={{ backgroundColor: primaryColor }}
          >
            2
          </span>
          <span className="text-[8px] mt-0.5">Cesta</span>
        </div>
        <div className="flex flex-col items-center hover:text-slate-600">
          <User size={16} />
          <span className="text-[8px] mt-0.5">Perfil</span>
        </div>
      </div>

      {/* Home Indicator */}
      <div className="h-1 w-1/3 bg-slate-300 rounded-full mx-auto mb-2 absolute bottom-1 left-1/3"></div>
    </div>
  );
}
