"use client";

import { useSettingsStore } from "@/store/settingsStore";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function SeasonalAtmosphere() {
  const { settings } = useSettingsStore();
  const theme = settings.theme?.activeTheme || "default";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted || theme === "default") return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
      aria-hidden="true"
    >
      {/* TEMA: NATAL (Luzes + Neve) */}
      {theme === "christmas" && (
        <>
          {/* Luzinhas no Topo (CSS puro simulando fio de luz) */}
          <div className="absolute top-0 left-0 w-full h-12 flex justify-between px-2 overflow-hidden z-[60]">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-3 h-3 rounded-full mt-[-6px] shadow-lg animate-pulse",
                  i % 2 === 0
                    ? "bg-red-500 shadow-red-500/50"
                    : "bg-green-500 shadow-green-500/50"
                )}
                style={{
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: "1.5s",
                }}
              />
            ))}
          </div>

          {/* Partículas de Neve (CSS) */}
          <div className="absolute inset-0 opacity-30">
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                className="absolute bg-white rounded-full animate-fall"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `-10px`,
                  width: `${Math.random() * 6 + 2}px`,
                  height: `${Math.random() * 6 + 2}px`,
                  animationDuration: `${Math.random() * 5 + 5}s`,
                  animationDelay: `${Math.random() * 5}s`,
                }}
              />
            ))}
          </div>
        </>
      )}

      {/* TEMA: DIA DOS NAMORADOS (Corações subindo) */}
      {theme === "valentines" && (
        <div className="absolute inset-0 opacity-20">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute text-red-500 animate-float-up text-2xl"
              style={{
                left: `${Math.random() * 100}%`,
                bottom: `-30px`,
                animationDuration: `${Math.random() * 6 + 4}s`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            >
              ❤️
            </div>
          ))}
        </div>
      )}

      {/* TEMA: DIA DAS MÃES (Flores Suaves) */}
      {theme === "mothers_day" && (
        <div className="absolute top-0 right-0 p-4 opacity-40">
          <div className="w-32 h-32 bg-pink-200/30 blur-3xl rounded-full absolute top-0 right-0" />
          <span className="text-4xl absolute top-4 right-4 rotate-12">🌸</span>
          <span className="text-3xl absolute top-12 right-12 -rotate-12">
            💐
          </span>
        </div>
      )}

      {/* Estilos Globais para Animação (Injetados aqui para não sujar o global.css) */}
      <style jsx global>{`
        @keyframes fall {
          0% {
            transform: translateY(0) translateX(0);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) translateX(20px);
            opacity: 0;
          }
        }
        @keyframes float-up {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) scale(1.5);
            opacity: 0;
          }
        }
        .animate-fall {
          animation-name: fall;
          animation-timing-function: linear;
          iteration-count: infinite;
        }
        .animate-float-up {
          animation-name: float-up;
          animation-timing-function: ease-in;
          iteration-count: infinite;
        }
      `}</style>
    </div>
  );
}
