import { describe, it, expect } from "vitest";
import { balloonItemLabel, foilCharacters } from "./balloonFoil";

describe("balão foil de letras e números", () => {
  it("limpa o que o cliente digita: maiúscula, sem acento, sem espaço", () => {
    expect(foilCharacters("Ana")).toBe("ANA");
    expect(foilCharacters("joão 15!")).toBe("JOAO15");
    expect(foilCharacters("A & B")).toBe("A&B");
    expect(foilCharacters("x".repeat(30))).toHaveLength(20);
  });

  it("rótulo do item com a unidade certa e os caracteres", () => {
    expect(
      balloonItemLabel({ typeId: "foil_numeros", typeName: "Números & Letras (Foil)", size: "40cm", characters: "ANA" }),
    ).toBe("Números & Letras (Foil) 40 cm: ANA");
    expect(balloonItemLabel({ typeId: "simples", typeName: "Balão Simples", size: "9" })).toBe('Balão Simples 9"');
  });
});
