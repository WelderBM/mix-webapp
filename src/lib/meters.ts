// Fita por metro: passo de 0,5 m e mínimo de 0,5 m (relatório 27/10).
// Valor quebrado (0,75 m) arredonda no primeiro toque: "+" vai a 1 m (não
// 1,25 m) e "−" vai a 0,5 m. O "−" nunca tira o item do carrinho; para
// isso existe a lixeira.
export const METER_STEP = 0.5;
export const MIN_METERS = 0.5;

const EPS = 1e-9;

export function stepMeters(current: number, dir: 1 | -1, max?: number | null): number {
  const q = Number.isFinite(current) ? current : MIN_METERS;
  // Já no limite (ou acima, por duas adições somadas): o "+" não mexe,
  // em vez de cortar a metragem sem aviso (revisão do #387).
  if (dir > 0 && max != null && q >= max) return q;
  const next =
    dir > 0
      ? Math.floor(q / METER_STEP + EPS) * METER_STEP + METER_STEP
      : Math.ceil(q / METER_STEP - EPS) * METER_STEP - METER_STEP;
  return clampMeters(next, max);
}

// Valor digitado: nunca abaixo do mínimo nem acima do estoque.
export function clampMeters(value: number, max?: number | null): number {
  let v = Number.isFinite(value) ? value : MIN_METERS;
  if (max != null && max >= MIN_METERS) v = Math.min(v, max);
  return Math.max(MIN_METERS, Math.round(v * 100) / 100);
}

export const formatMeters = (m: number) => String(m).replace(".", ",");
