"use client";

import { MapPin, Phone, Clock, Star, Gift, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function HeroSection() {
  const handleOpenMap = () => {
    // Link direto para o Google Maps com o endereço da loja
    window.open(
      "https://www.google.com/maps/search/?api=1&query=Rua+Pedro+Aldemar+Bantim,+945,+Boa+Vista+RR",
      "_blank"
    );
  };

  const handleWhatsApp = () => {
    window.open("https://wa.me/5595984244194", "_blank");
  };

  return (
    <section className="relative w-full bg-purple-950 overflow-hidden border-b-4 border-yellow-500">
      {/* 1. IMAGEM DE FUNDO (Background) */}
      <div className="absolute inset-0 z-0">
        {/* Imagem de fundo temática (Bokeh Natalino Roxo/Dourado) */}
        <div
          className="w-full h-full bg-cover bg-center opacity-40 mix-blend-soft-light saturate-150"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1576919228636-240395c90b85?q=80&w=2070&auto=format&fit=crop')`,
          }}
        ></div>

        {/* Gradiente para escurecer e dar foco no texto */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-950 via-purple-900/90 to-purple-900/50"></div>
      </div>

      {/* 2. CONTEÚDO PRINCIPAL */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
        {/* ESQUERDA: Texto de Boas Vindas */}
        <div className="space-y-6 animate-in slide-in-from-left-4 duration-700 fade-in">
          <div>
            <Badge
              variant="outline"
              className="text-yellow-400 border-yellow-500 mb-4 px-3 py-1 text-xs tracking-widest uppercase flex items-center gap-2 w-fit"
            >
              <Sparkles size={14} /> Natal Mix Novidades
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
              O Presente Perfeito <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-500">
                Ilumina o Natal.
              </span>
            </h1>
          </div>

          <p className="text-lg text-purple-100 leading-relaxed max-w-lg">
            Celebre a magia com nossa seleção especial de kits Natura e
            presentes criativos. Tudo à pronta entrega em Boa Vista para fazer
            este Natal inesquecível.
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            <Button
              size="lg"
              className="bg-yellow-500 hover:bg-yellow-600 text-purple-900 font-bold h-12 px-8 shadow-lg shadow-yellow-500/20 transition-all border border-yellow-400/50"
              onClick={handleWhatsApp}
            >
              <Gift className="mr-2 h-5 w-5" />
              Peça pelo WhatsApp
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="border-purple-400 text-purple-200 hover:bg-purple-900/50 hover:text-white h-12 px-8 bg-transparent"
              onClick={handleOpenMap}
            >
              Visitar a Loja
            </Button>
          </div>
        </div>

        {/* DIREITA: Card de Informações (Vidro Fosco) - Escondido em celular muito pequeno, visível em tablet/pc */}
        <div className="relative animate-in slide-in-from-bottom-8 duration-1000 fade-in delay-200 hidden md:block">
          {/* Efeito de brilho atrás do card */}
          <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500 to-purple-600 rounded-2xl blur opacity-30 animate-pulse"></div>

          <div className="relative bg-purple-950/80 backdrop-blur-xl border border-yellow-500/30 p-8 rounded-2xl shadow-2xl space-y-6">
            <div className="flex items-center gap-4 border-b border-purple-800/50 pb-6">
              <div className="bg-yellow-500/10 p-3 rounded-xl border border-yellow-500/20">
                <Star className="text-yellow-400 fill-yellow-400" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-white text-xl">
                  Horário Especial de Natal
                </h3>
                <p className="text-sm text-purple-300">
                  Aberto todos os dias para você!
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Local */}
              <div
                className="flex gap-4 group cursor-pointer"
                onClick={handleOpenMap}
              >
                <div className="bg-purple-900 p-2.5 rounded-full h-11 w-11 flex items-center justify-center shrink-0 group-hover:bg-yellow-500 transition-colors duration-300">
                  <MapPin
                    className="text-purple-200 group-hover:text-purple-900"
                    size={20}
                  />
                </div>
                <div>
                  <p className="text-sm font-bold text-purple-100 group-hover:text-yellow-400 transition-colors">
                    Nossa Loja
                  </p>
                  <p className="text-sm text-purple-300 leading-snug">
                    Rua Pedro Aldemar Bantim, 945
                    <br />
                    Silvio Botelho, Boa Vista - RR
                  </p>
                </div>
              </div>

              {/* Horário */}
              <div className="flex gap-4">
                <div className="bg-purple-900 p-2.5 rounded-full h-11 w-11 flex items-center justify-center shrink-0">
                  <Clock className="text-yellow-500" size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-yellow-500">
                    Atendimento Estendido
                  </p>
                  <p className="text-sm text-purple-300">
                    Seg à Sáb: 08h - 20h{" "}
                    <span className="text-purple-500 mx-1">|</span> Dom: 08h -
                    14h
                  </p>
                </div>
              </div>

              {/* Contato */}
              <div
                className="flex gap-4 group cursor-pointer"
                onClick={handleWhatsApp}
              >
                <div className="bg-purple-900 p-2.5 rounded-full h-11 w-11 flex items-center justify-center shrink-0 group-hover:bg-green-600 transition-colors duration-300">
                  <Phone
                    className="text-purple-200 group-hover:text-white"
                    size={20}
                  />
                </div>
                <div>
                  <p className="text-sm font-bold text-purple-100 group-hover:text-green-400 transition-colors">
                    Compre Online
                  </p>
                  <p className="text-sm text-purple-300">+55 95 98424-4194</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
