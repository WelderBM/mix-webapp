"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export function StoreStatusBadge() {
  const [status, setStatus] = useState<{
    isOpen: boolean;
    text: string;
    colorClass: string;
  } | null>(null);

  useEffect(() => {
    const checkStatus = () => {
      const now = new Date();
      const day = now.getDay(); // 0 = Domingo, 1 = Segunda...
      const hour = now.getHours();
      const minutes = now.getMinutes();
      const currentTime = hour + minutes / 60;

      // HORÁRIOS (Baseado na sua imagem)
      // Seg(1) a Sáb(6): 08:00 - 19:00
      // Dom(0): 08:00 - 12:00
      const schedule: Record<number, { open: number; close: number }> = {
        0: { open: 8, close: 12 }, // Domingo
        1: { open: 8, close: 19 }, // Segunda
        2: { open: 8, close: 19 },
        3: { open: 8, close: 19 },
        4: { open: 8, close: 19 },
        5: { open: 8, close: 19 },
        6: { open: 8, close: 19 }, // Sábado
      };

      const today = schedule[day];
      let isOpen = false;
      let text = "";
      let colorClass = "bg-slate-800 text-slate-300 border-slate-700"; // Padrão (Fechado)

      // 1. Verifica se está ABERTO agora
      if (currentTime >= today.open && currentTime < today.close) {
        isOpen = true;

        // Formata hora de fechamento (ex: 19:00)
        const closeHour = Math.floor(today.close);
        const closeMin = (today.close % 1) * 60;
        const closeStr = `${closeHour.toString().padStart(2, "0")}:${closeMin
          .toString()
          .padStart(2, "0")}`;

        // Lógica "Fecha em Breve" (Faltando menos de 1 hora)
        if (today.close - currentTime <= 1) {
          text = `Fecha em breve às ${closeStr}`;
          colorClass = "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
        } else {
          text = `Aberto até às ${closeStr}`;
          colorClass = "bg-green-500/10 text-green-500 border-green-500/20";
        }
      } else {
        // 2. Se estiver FECHADO, calcula a próxima abertura
        let nextDayIndex = day;
        let foundNext = false;
        let label = "Amanhã";
        let daysChecked = 0;

        // Loop para achar o próximo dia de trabalho
        while (!foundNext && daysChecked < 7) {
          // Avança pro próximo dia (se for fechado hoje a noite, começa testando amanhã)
          // Se for antes de abrir hoje (madrugada), temos que testar hoje mesmo, mas o currentTime < open já cobriu isso?
          // Não, se for 06:00 (antes de abrir), o loop abaixo vai pegar "Hoje" corretamente se ajustarmos a lógica,
          // mas simplificando: se já passou do horário hoje, nextDay começa amanhã.

          if (daysChecked === 0 && currentTime < today.open) {
            // É hoje de manhã cedo
            nextDayIndex = day;
            label = "Hoje";
          } else {
            nextDayIndex = (nextDayIndex + 1) % 7;
            // Ajusta label
            if (daysChecked === 0) label = "Amanhã";
            else if (nextDayIndex === 1)
              label = "Segunda"; // Se pulou domingo, mostra dia da semana
            else {
              const weekDays = [
                "Domingo",
                "Segunda",
                "Terça",
                "Quarta",
                "Quinta",
                "Sexta",
                "Sábado",
              ];
              label = weekDays[nextDayIndex];
            }
          }

          if (schedule[nextDayIndex]) {
            const nextOpen = schedule[nextDayIndex].open;
            const openHour = Math.floor(nextOpen);
            const openMin = (nextOpen % 1) * 60;
            const openStr = `${openHour.toString().padStart(2, "0")}:${openMin
              .toString()
              .padStart(2, "0")}`;

            text = `Abre ${label} às ${openStr}`;
            foundNext = true;
          }
          daysChecked++;
        }
      }

      setStatus({ isOpen, text, colorClass });
    };

    checkStatus();
    const interval = setInterval(checkStatus, 60000); // Atualiza a cada minuto
    return () => clearInterval(interval);
  }, []);

  if (!status)
    return (
      <div className="h-8 w-32 bg-slate-800/50 rounded-full animate-pulse" />
    );

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-help group relative",
        status.colorClass
      )}
    >
      <Clock size={14} />
      <span>{status.text}</span>

      {/* Tooltip com horários completos ao passar o mouse */}
      <div className="absolute top-full left-0 mt-2 w-48 bg-slate-900 p-3 rounded-xl shadow-xl border border-slate-800 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all z-50 text-slate-300 font-normal pointer-events-none">
        <p className="text-[10px] uppercase font-bold text-slate-500 mb-2">
          Horário de Funcionamento
        </p>
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>Seg - Sáb</span>
            <span className="font-bold text-white">08:00 - 19:00</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Domingo</span>
            <span className="font-bold text-white">08:00 - 12:00</span>
          </div>
        </div>
      </div>
    </div>
  );
}
