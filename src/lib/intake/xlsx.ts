import { unzipSync, strFromU8 } from "fflate";

// Leitor mínimo de .xlsx (primeira planilha) pro importador do Noturno.
// Um .xlsx é um zip de XMLs; com fflate (~8 KB) + DOMParser do navegador
// evitamos uma lib de planilha inteira (centenas de KB) no admin, que roda
// em celular fraco. Cobre o que o export do Noturno usa: strings
// compartilhadas, inline e números. Fórmulas vêm com o valor em cache.

export type Cell = string | number | null;

function colIndex(ref: string): number {
  const letters = ref.match(/^[A-Z]+/)?.[0] ?? "A";
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

function textOf(el: Element | null): string {
  if (!el) return "";
  // <si>/<is> podem ter vários <t> (rich text) — concatena todos.
  const ts = el.getElementsByTagName("t");
  if (ts.length === 0) return el.textContent ?? "";
  let s = "";
  for (let i = 0; i < ts.length; i++) s += ts[i].textContent ?? "";
  return s;
}

export function readFirstSheet(data: Uint8Array): Cell[][] {
  const files = unzipSync(data);
  const parser = new DOMParser();
  const xml = (path: string) =>
    files[path]
      ? parser.parseFromString(strFromU8(files[path]), "application/xml")
      : null;

  const shared: string[] = [];
  const sst = xml("xl/sharedStrings.xml");
  if (sst) {
    const items = sst.getElementsByTagName("si");
    for (let i = 0; i < items.length; i++) shared.push(textOf(items[i]));
  }

  const sheetPath =
    Object.keys(files)
      .filter((p) => /^xl\/worksheets\/sheet\d+\.xml$/.test(p))
      .sort()[0] ?? "";
  const sheet = xml(sheetPath);
  if (!sheet) throw new Error("Planilha não encontrada no arquivo .xlsx");

  const rows: Cell[][] = [];
  const rowEls = sheet.getElementsByTagName("row");
  for (let r = 0; r < rowEls.length; r++) {
    const rowEl = rowEls[r];
    const rowNum = Number(rowEl.getAttribute("r") ?? r + 1) - 1;
    const row: Cell[] = [];
    const cells = rowEl.getElementsByTagName("c");
    for (let c = 0; c < cells.length; c++) {
      const cell = cells[c];
      const idx = colIndex(cell.getAttribute("r") ?? "");
      const type = cell.getAttribute("t");
      const v = cell.getElementsByTagName("v")[0]?.textContent ?? null;
      let value: Cell = null;
      if (type === "s" && v != null) value = shared[Number(v)] ?? null;
      else if (type === "inlineStr")
        value = textOf(cell.getElementsByTagName("is")[0] ?? null);
      else if (type === "str" || type === "b") value = v;
      else if (v != null && v !== "") value = Number(v);
      row[idx] = value;
    }
    for (let i = 0; i < row.length; i++) if (row[i] === undefined) row[i] = null;
    rows[rowNum] = row;
  }
  for (let i = 0; i < rows.length; i++) if (!rows[i]) rows[i] = [];
  return rows;
}
