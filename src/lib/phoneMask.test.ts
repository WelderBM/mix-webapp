import { describe, expect, it } from "vitest";
import { maskPhone } from "./phoneMask";

describe("maskPhone", () => {
  it("formata enquanto digita", () => {
    expect(maskPhone("9")).toBe("9");
    expect(maskPhone("95")).toBe("95");
    expect(maskPhone("959")).toBe("(95) 9");
    expect(maskPhone("9598424")).toBe("(95) 98424");
    expect(maskPhone("95984244")).toBe("(95) 98424-4");
    expect(maskPhone("95984244194")).toBe("(95) 98424-4194");
    expect(maskPhone("959842441941")).toBe("(95) 98424-4194"); // no máximo 11
  });

  it("apagar o hífen do fim funciona (bug do carrinho)", () => {
    // "(95) 98424-" → backspace no hífen → o navegador manda "(95) 98424"
    expect(maskPhone("(95) 98424")).toBe("(95) 98424");
    // e apagar o último número também tira o hífen
    expect(maskPhone("(95) 98424-")).toBe("(95) 98424");
  });
});
