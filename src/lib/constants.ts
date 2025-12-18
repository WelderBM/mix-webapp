import { Unit } from "@/types";

export const UNIT_LABELS: Record<Unit, string> = {
  un: "Unitário",
  m: "Metro",
  pct: "Pacote",
};

export const UNIT_OPTIONS = [
  { value: "un", label: "Unidade (un)" },
  { value: "m", label: "Metro (m)" },
  { value: "pct", label: "Pacote (pct)" },
];
