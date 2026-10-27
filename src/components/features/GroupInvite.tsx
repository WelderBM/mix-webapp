"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { MessageCircle, X } from "lucide-react";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { groupInviteSeen, markGroupInviteSeen } from "@/lib/orderTracking";

// Link padrão do grupo; o admin troca em Configurações (whatsappGroupLink).
const DEFAULT_GROUP_LINK = "https://chat.whatsapp.com/LF5bdeHcyjk5LF1NuAFRVm";
// O convite espera o cliente ver o pedido primeiro (relatório 27/10): sem
// pular na cara logo de cara, e uma vez só por aparelho.
export const GROUP_INVITE_DELAY_MS = 8000;

export function GroupInvite() {
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState(DEFAULT_GROUP_LINK);

  useEffect(() => {
    if (groupInviteSeen()) return;
    let alive = true;
    getDoc(doc(db, "settings", "general"))
      .then((snap) => {
        const custom = snap.exists() ? snap.data().whatsappGroupLink : null;
        if (alive && typeof custom === "string" && custom.trim()) setLink(custom.trim());
      })
      .catch(() => {});
    const timer = setTimeout(() => {
      if (!alive) return;
      setOpen(true);
      markGroupInviteSeen();
    }, GROUP_INVITE_DELAY_MS);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, []);

  if (!open) return null;

  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(link)}`;
  return (
    <aside
      aria-label="Convite para o grupo do WhatsApp"
      className="fixed inset-x-4 bottom-4 z-40 mx-auto max-w-md rounded-2xl border border-green-200 bg-white p-4 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700 motion-reduce:animate-none"
    >
      <button
        type="button"
        onClick={() => setOpen(false)}
        aria-label="Fechar convite"
        className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center text-slate-400 hover:text-slate-600"
      >
        <X size={18} />
      </button>
      <div className="flex items-center gap-4 pr-8">
        {/* eslint-disable-next-line @next/next/no-img-element -- QR externo, tamanho fixo */}
        <img src={qr} alt="QR code do grupo do WhatsApp" width={96} height={96} className="hidden h-24 w-24 shrink-0 rounded-lg border sm:block" />
        <div className="space-y-2">
          <p className="flex items-center gap-2 font-bold text-slate-800">
            <MessageCircle className="text-green-600" size={18} aria-hidden="true" />
            Entre no nosso grupo VIP
          </p>
          <p className="text-sm text-slate-600">Novidades e ofertas exclusivas, direto no seu WhatsApp.</p>
          <Button
            className="h-11 w-full gap-2 bg-green-600 text-white hover:bg-green-700"
            onClick={() => window.open(link, "_blank", "noopener")}
          >
            Entrar no grupo
          </Button>
        </div>
      </div>
    </aside>
  );
}
