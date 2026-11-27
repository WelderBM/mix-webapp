"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

// Metros de fita de um tamanho de laço (#415). O texto digitado fica no
// próprio campo: com o valor controlado pelo número, digitar "0" (a caminho
// de "0,5") apagava o campo. Aceita vírgula. Vazio ou 0 = sem metragem.
export function parseMeters(text: string): number | undefined {
  const n = Number.parseFloat(text.trim().replace(",", "."));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : undefined;
}

export function BowMetersInput({
  meters,
  label,
  onChange,
}: {
  meters?: number;
  label: string;
  onChange: (meters: number | undefined) => void;
}) {
  const [text, setText] = useState(meters != null ? String(meters).replace(".", ",") : "");
  // Valor trocado por fora (outro tamanho, recarga das configurações).
  useEffect(() => {
    if (parseMeters(text) !== meters) {
      setText(meters != null ? String(meters).replace(".", ",") : "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meters]);

  return (
    <div className="relative">
      <Input
        type="text"
        inputMode="decimal"
        placeholder="Metros"
        aria-label={label}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onChange(parseMeters(e.target.value));
        }}
        className="pr-7 text-sm"
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">m</span>
    </div>
  );
}
