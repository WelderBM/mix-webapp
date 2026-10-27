import { describe, it, expect } from "vitest";
import { balloonItemLabel, foilCharacters, foilPieces, foilWords } from "./balloonFoil";

describe("balão foil de letras e números", () => {
  it("limpa o que o cliente digita: maiúscula, sem acento, um espaço entre palavras", () => {
    expect(foilCharacters("Ana")).toBe("ANA");
    expect(foilCharacters("joão 15!")).toBe("JOAO 15");
    expect(foilCharacters("A & B")).toBe("A & B");
    expect(foilCharacters("  feliz   15 ")).toBe("FELIZ 15 ");
  });

  it("não tem limite de caracteres (#342)", () => {
    expect(foilCharacters("x".repeat(30))).toHaveLength(30);
  });

  it("espaço não é balão; cada palavra numa linha", () => {
    expect(foilPieces("FELIZ 15 ANOS")).toBe("FELIZ15ANOS");
    expect(foilWords("FELIZ 15 ANOS ")).toEqual(["FELIZ", "15", "ANOS"]);
  });

  it("rótulo do item com a unidade certa e os caracteres", () => {
    expect(
      balloonItemLabel({ typeId: "foil_numeros", typeName: "Números & Letras (Foil)", size: "40cm", characters: "ANA" }),
    ).toBe('Números & Letras (Foil) 40 cm · 16": ANA');
    expect(
      balloonItemLabel({ typeId: "foil_numeros", typeName: "Números & Letras (Foil)", size: "40cm", characters: "FELIZ 15" }),
    ).toBe('Números & Letras (Foil) 40 cm · 16": FELIZ / 15');
    expect(balloonItemLabel({ typeId: "simples", typeName: "Balão Simples", size: "9" })).toBe('Balão Simples 9" · 23 cm');
  });
});
