// Horário de funcionamento da loja física — fonte única. Badge "Aberto/Fechado"
// (StoreStatusBadge), rodapé (Footer) e dados estruturados (OrganizationJsonLd)
// leem daqui, pra não divergirem de novo (antes cada um tinha "09:00 - 13:00"
// escrito à mão).
//
// Dono, 26/11/2026: seg a sáb 8h às 19h; domingo 9h às 13h. Substitui o
// "todos os dias, 09:00 - 13:00" de 28/10.

export interface DayHours {
  open: number; // hora decimal (8.5 = 08:30)
  close: number;
}

// Índice = Date.getDay() (0 = domingo). Dia sem entrada = fechado.
export const STORE_HOURS: Record<number, DayHours> = {
  0: { open: 9, close: 13 }, // Domingo
  1: { open: 8, close: 19 }, // Segunda
  2: { open: 8, close: 19 },
  3: { open: 8, close: 19 },
  4: { open: 8, close: 19 },
  5: { open: 8, close: 19 },
  6: { open: 8, close: 19 }, // Sábado
};

export function formatHour(value: number): string {
  const h = Math.floor(value);
  const m = Math.round((value % 1) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Linhas pra exibir (tooltip, rodapé), agrupando dias com o mesmo horário.
export const STORE_HOURS_DISPLAY: { label: string; open: string; close: string }[] = [
  { label: "Seg a Sáb", open: formatHour(STORE_HOURS[1].open), close: formatHour(STORE_HOURS[1].close) },
  { label: "Domingo", open: formatHour(STORE_HOURS[0].open), close: formatHour(STORE_HOURS[0].close) },
];

const SCHEMA_DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

// schema.org OpeningHoursSpecification, um bloco por horário distinto.
export function openingHoursSpecification() {
  const groups = new Map<string, string[]>();
  for (let day = 0; day < 7; day++) {
    const hours = STORE_HOURS[day];
    if (!hours) continue;
    const key = `${formatHour(hours.open)}-${formatHour(hours.close)}`;
    groups.set(key, [...(groups.get(key) ?? []), SCHEMA_DAYS[day]]);
  }
  return [...groups.entries()].map(([key, dayOfWeek]) => {
    const [opens, closes] = key.split("-");
    return { "@type": "OpeningHoursSpecification", dayOfWeek, opens, closes };
  });
}
