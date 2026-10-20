// Registro central da REGRA DE FIDELIDADE DO SEED (ver comentário de
// manutenção no topo de scripts/seed-staging.ts): todo campo seedado deve
// ser alcançável pela UI/admin. Quando um dataset em seed-data/ precisa
// incluir um campo que a UI ainda não expõe, ele entra aqui — não no
// documento em si (isto é metadado do dataset, não do documento que vai
// pro Firestore) — junto da issue de admin-gap que cobre o buraco.
//
// Sem entrada aqui, um campo sem caminho de admin vira dado morto que
// finge ser feature (foi exatamente o que quase aconteceu com
// theme.accentColor, ver issue #118 — corrigido lá: não chegou a ser um
// campo de seed-data de fato, mas o risco que esta regra cobre é real).
//
// Marcação manual e deliberada, de propósito — NÃO existe varredura
// automática comparando o shape do modelo com os formulários do admin.
// Esse tipo de heurística é frágil e garante falso positivo (campo
// derivado, opcional por design, etc. todos pareceriam "sem caminho"). O
// valor deste registro está em obrigar a decisão no momento de seedar um
// campo sem UI, não em adivinhar.

export interface UnreachableFieldEntry {
  /** Caminho legível do campo (ex.: "settings/general.theme.accentColor"). Só documentação — não é lido programaticamente. */
  field: string;
  /** Número da issue no GitHub que cobre o admin-gap correspondente. */
  issue: number;
  /** Por que este campo está fora do alcance da UI hoje. */
  reason: string;
}

// Nenhum campo unreachable registrado no momento. Quando um dataset
// precisar de um campo sem caminho de admin, adicionar entrada aqui com a
// issue correspondente — scripts/seed-staging.ts recusa rodar se alguma
// entrada não tiver uma issue válida associada.
export const unreachableFields: UnreachableFieldEntry[] = [];

/**
 * Valida a integridade do registro: toda entrada precisa de uma issue de
 * admin-gap válida (inteiro positivo) e de campo/motivo preenchidos. Lança
 * um Error com mensagem clara se algo estiver incompleto — quem chama
 * decide como reportar (scripts/seed-staging.ts usa isso pra abortar antes
 * de inserir qualquer coisa no Firestore).
 *
 * Aceita uma lista opcional (default: o registro real `unreachableFields`)
 * só pra permitir testar a validação em isolamento, sem mutar o registro
 * exportado.
 */
export function assertFidelityRegistryValid(
  entries: UnreachableFieldEntry[] = unreachableFields
): void {
  const invalid = entries.filter(
    (entry) =>
      !entry.field ||
      !entry.reason ||
      !Number.isInteger(entry.issue) ||
      entry.issue <= 0
  );

  if (invalid.length > 0) {
    const fields = invalid.map((entry) => entry.field || "(sem nome)").join(", ");
    throw new Error(
      `campo(s) seedado(s) inalcançável(is) pelo admin sem issue de ` +
        `admin-gap associada: ${fields}. Crie a issue ou remova o campo do ` +
        `seed (ver REGRA DE FIDELIDADE DO SEED em seed-staging.ts).`
    );
  }
}
