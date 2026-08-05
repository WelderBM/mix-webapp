import { describe, it, expect } from "vitest";
import { getVisibleProductTypes, PRODUCT_TYPE_META } from "./status-badge";

// Issue #165 — os 4 tipos exclusivos de kit (BASE_CONTAINER/FILLER/
// ACCESSORY/WRAPPER) só devem aparecer nas listas de OPÇÕES de
// criação/filtro do admin quando `StoreSettings.features.customKitEnabled`
// estiver ligada. ASSEMBLED_KIT nunca vem deste helper — cada consumidor já
// trata esse tipo à parte (ver comentário em status-badge.tsx).
describe("getVisibleProductTypes", () => {
  it("com customKitEnabled desligado, retorna só STANDARD_ITEM e RIBBON", () => {
    expect(getVisibleProductTypes(false)).toEqual(["STANDARD_ITEM", "RIBBON"]);
  });

  it("com customKitEnabled ligado, retorna todos os tipos exceto ASSEMBLED_KIT", () => {
    const visible = getVisibleProductTypes(true);

    expect(visible).not.toContain("ASSEMBLED_KIT");
    expect(visible.sort()).toEqual(
      [
        "BASE_CONTAINER",
        "STANDARD_ITEM",
        "FILLER",
        "ACCESSORY",
        "WRAPPER",
        "RIBBON",
      ].sort()
    );
  });

  it("nunca retorna ASSEMBLED_KIT, em nenhum dos dois estados da flag", () => {
    expect(getVisibleProductTypes(false)).not.toContain("ASSEMBLED_KIT");
    expect(getVisibleProductTypes(true)).not.toContain("ASSEMBLED_KIT");
  });

  it("todo valor retornado existe em PRODUCT_TYPE_META (sem tipo inventado)", () => {
    const knownTypes = Object.keys(PRODUCT_TYPE_META);
    for (const type of getVisibleProductTypes(true)) {
      expect(knownTypes).toContain(type);
    }
  });
});
