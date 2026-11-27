// Alerta para importar o Excel do Noturno (#416). O Excel é a base de
// verdade do estoque, então a importação precisa ser regular. O site não vê
// o download no Noturno: o sinal é a importação concluída em
// /admin/lancamento/importar, gravada em `intake_meta/import`.

export const DEFAULT_IMPORT_PERIOD_DAYS = 2;
const DAY_MS = 24 * 60 * 60 * 1000;

// Período válido é inteiro >= 1; qualquer outra coisa cai no padrão.
export function importPeriodDays(periodDays: number | null | undefined): number {
  return periodDays != null && Number.isInteger(periodDays) && periodDays >= 1
    ? periodDays
    : DEFAULT_IMPORT_PERIOD_DAYS;
}

// Nunca importado conta como vencido. No limite exato já vence: com
// período de 2 dias, importar na segunda à tarde avisa na quarta à tarde.
export function isNoturnoImportDue(
  lastImportedMs: number | null,
  periodDays: number | null | undefined,
  nowMs: number
): boolean {
  if (lastImportedMs == null) return true;
  return nowMs - lastImportedMs >= importPeriodDays(periodDays) * DAY_MS;
}

// Dias inteiros desde a última importação (arredonda para baixo).
export function daysSinceImport(lastImportedMs: number, nowMs: number): number {
  return Math.max(0, Math.floor((nowMs - lastImportedMs) / DAY_MS));
}
