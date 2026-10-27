"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PackageSearch, X } from "lucide-react";
import {
  TRACKING_EVENT,
  dismissTrackingHint,
  lastOrderId,
  trackingHintOn,
} from "@/lib/orderTracking";

const BUBBLE_MS = 10000;

// "Meu pedido" ao lado do carrinho (relatório 27/10): o rastreio fica
// sempre à mão. Depois de uma compra, o ícone pulsa e mostra "Seu pedido
// fica aqui" até o cliente tocar nele.
export function TrackingIcon() {
  const [hint, setHint] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  // O balão some sozinho (ou com um toque) para não cobrir a página; o
  // pontinho continua pulsando até o cliente tocar no ícone.
  const [bubble, setBubble] = useState(true);
  useEffect(() => {
    if (!hint) return;
    setBubble(true);
    const t = setTimeout(() => setBubble(false), BUBBLE_MS);
    return () => clearTimeout(t);
  }, [hint]);

  useEffect(() => {
    const sync = () => {
      setHint(trackingHintOn());
      setOrderId(lastOrderId());
    };
    sync();
    window.addEventListener(TRACKING_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(TRACKING_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <div className="relative">
      <Link
        href={orderId ? `/meu-pedido?id=${orderId}` : "/meu-pedido"}
        onClick={dismissTrackingHint}
        aria-label={hint ? "Meu pedido: acompanhe aqui o seu pedido" : "Meu pedido"}
        className="relative flex h-11 w-11 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100"
      >
        <PackageSearch className="h-5 w-5" aria-hidden="true" />
        {hint && (
          <span className="absolute right-1.5 top-1.5 flex h-2.5 w-2.5" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75 motion-reduce:animate-none" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-purple-600" />
          </span>
        )}
      </Link>
      {hint && bubble && (
        <div
          role="status"
          className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl bg-purple-700 py-2 pl-3 pr-9 text-xs font-semibold text-white shadow-lg animate-in fade-in slide-in-from-top-2 duration-500 motion-reduce:animate-none"
        >
          <span className="absolute -top-1.5 right-4 h-3 w-3 rotate-45 bg-purple-700" aria-hidden="true" />
          Seu pedido fica aqui. Toque no ícone para acompanhar.
          <button
            type="button"
            onClick={() => setBubble(false)}
            aria-label="Fechar aviso"
            className="absolute right-0 top-0 flex h-full w-9 items-center justify-center text-white/80 hover:text-white"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
