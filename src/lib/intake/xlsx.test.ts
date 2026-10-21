// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { zipSync, strToU8 } from "fflate";
import { readFirstSheet } from "./xlsx";

function makeXlsx(sheetXml: string, shared?: string[]): Uint8Array {
  const files: Record<string, Uint8Array> = {
    "xl/worksheets/sheet1.xml": strToU8(
      `<?xml version="1.0"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetXml}</sheetData></worksheet>`
    ),
  };
  if (shared) {
    files["xl/sharedStrings.xml"] = strToU8(
      `<?xml version="1.0"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${shared
        .map((s) => `<si><t>${s}</t></si>`)
        .join("")}</sst>`
    );
  }
  return zipSync(files);
}

describe("readFirstSheet", () => {
  it("lê strings compartilhadas, números e respeita posição de linha/coluna", () => {
    const data = makeXlsx(
      `<row r="1"><c r="A1" t="s"><v>0</v></c></row>
       <row r="3"><c r="A3"><v>2041</v></c><c r="C3" t="s"><v>1</v></c><c r="F3"><v>1.49</v></c></row>`,
      ["MIX NOVIDADES", " ARGOLAS DE PRESSAO"]
    );
    const rows = readFirstSheet(data);
    expect(rows[0]).toEqual(["MIX NOVIDADES"]);
    expect(rows[1]).toEqual([]);
    expect(rows[2]).toEqual([2041, null, " ARGOLAS DE PRESSAO", null, null, 1.49]);
  });

  it("lê string inline e rich text com vários <t>", () => {
    const data = makeXlsx(
      `<row r="1"><c r="A1" t="inlineStr"><is><t>FITA </t><t>CETIM</t></is></c></row>`
    );
    expect(readFirstSheet(data)[0]).toEqual(["FITA CETIM"]);
  });

  it("coluna AA vira índice 26", () => {
    const data = makeXlsx(`<row r="1"><c r="AA1"><v>7</v></c></row>`);
    const row = readFirstSheet(data)[0];
    expect(row[26]).toBe(7);
    expect(row.length).toBe(27);
  });

  it("erro claro em zip sem planilha", () => {
    expect(() => readFirstSheet(zipSync({ "a.txt": strToU8("x") }))).toThrow(/Planilha não encontrada/);
  });
});
