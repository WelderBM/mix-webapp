"use client";

import { useEffect, useState, useRef } from "react";
import { useKitStore } from "@/store/kitStore";
import { motion, AnimatePresence } from "framer-motion";
import { Wand2, PackagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BuilderTrigger() {
  const { openBuilder } = useKitStore();
  const bannerRef = useRef<HTMLDivElement>(null);
  const [isBannerVisible, setIsBannerVisible] = useState(true);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsBannerVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (bannerRef.current) {
      observer.observe(bannerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={bannerRef} className="w-full mb-8">
        <div
          onClick={openBuilder}
          className="relative overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-xl cursor-pointer group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
        >
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>

          <div className="p-8 flex items-center justify-between">
            <div className="text-white space-y-2 z-10">
              <div className="flex items-center gap-2 text-purple-200 font-semibold text-sm uppercase tracking-wider">
                <Wand2 size={16} />
                Exclusivo
              </div>
              <h2 className="text-3xl font-bold leading-tight">
                Crie seu Kit <br /> Personalizado
              </h2>
              <p className="text-purple-100 max-w-md">
                Escolha a cesta, recheie com Natura e finalize com laços
                artesanais. O "Narrador" te ajuda a montar.
              </p>
              <Button
                variant="secondary"
                className="mt-4 bg-white text-purple-700 hover:bg-purple-50 border-0"
              >
                Começar a Montar Agora
              </Button>
            </div>

            <div className="hidden md:block opacity-30 transform rotate-12 group-hover:rotate-0 transition-transform duration-500">
              <PackagePlus size={120} color="white" />
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {!isBannerVisible && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50 md:bottom-10 md:right-10"
          >
            <Button
              onClick={openBuilder}
              size="lg"
              className="h-14 rounded-full px-6 shadow-2xl bg-slate-900 text-white hover:bg-slate-800 gap-2 border-2 border-white/20"
            >
              <Wand2 className="mr-1" />
              Montar Kit
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
