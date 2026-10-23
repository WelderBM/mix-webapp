import { describe, it, expect } from "vitest";
import { ordenar, pontuar } from "./prioridade.mjs";

const issue = (number, labels, title = `issue ${number}`) => ({ number, title, labels });

describe("pontuar", () => {
  it("3·O + 2·S + A + D − E − R", () => {
    expect(pontuar(["o:5", "s:2", "a:3", "e:p"]).pontos).toBe(21);
    expect(pontuar(["o:4", "s:2", "a:2", "e:p", "destrava"]).pontos).toBe(19);
    expect(pontuar(["o:3", "s:2", "a:3", "e:m", "risco"]).pontos).toBe(13);
  });
  it("sem algum eixo: sem pontuação", () => {
    expect(pontuar(["o:5", "s:2", "e:p"])).toBeNull();
  });
  it("sem 'autonomo' vai para a fila do dono", () => {
    expect(pontuar(["o:5", "s:2", "a:3", "e:p"]).dono).toBe(true);
    expect(pontuar(["o:5", "s:2", "a:3", "e:p", "autonomo"]).dono).toBe(false);
  });
});

describe("ordenar (desempate em 6 degraus)", () => {
  const base = ["s:2", "a:2", "autonomo"];
  it("separa as filas e ignora lembrete, vistoria-resumo e épico", () => {
    const r = ordenar([
      issue(1, ["o:5", ...base, "e:p"]),
      issue(2, ["o:5", "s:2", "a:2", "e:p", "precisa-de-voce"]),
      issue(3, ["lembrete"]),
      issue(4, ["epic", "o:5", ...base, "e:p"]),
      issue(5, ["bug"]),
    ]);
    expect(r.autonoma.map((i) => i.number)).toEqual([1]);
    expect(r.dono.map((i) => i.number)).toEqual([2]);
    expect(r.semPontos.map((i) => i.number)).toEqual([5]);
  });

  it("empate de pontos: destrava → não conflita com PR aberto → frente atual → esforço → número", () => {
    const r = ordenar(
      [
        issue(10, ["o:3", ...base, "e:p", "frente:fitas"]),
        issue(11, ["o:3", ...base, "e:p", "frente:montador"]),
        issue(12, ["o:3", ...base, "e:p", "frente:home"]),
        issue(13, ["o:3", ...base, "e:p", "frente:fitas"]), // tem PR aberto
        issue(9, ["o:3", ...base, "e:p", "frente:home"]),
      ],
      { frente: "montador", emAndamento: new Set([13]) },
    );
    // 13 sai (em andamento); 10 vai para o fim (a frente "fitas" está ocupada);
    // 11 primeiro (frente atual); depois 9 e 12 pelo número.
    expect(r.autonoma.map((i) => i.number)).toEqual([11, 9, 12, 10]);
  });

  it("destrava vence o resto do desempate", () => {
    const r = ordenar([
      issue(1, ["o:3", ...base, "e:m"]), // 9+4+2−2 = 13
      issue(2, ["o:3", ...base, "e:g", "destrava"]), // 9+4+2+2−3 = 14
      issue(3, ["o:3", "s:2", "a:2", "e:p", "autonomo", "destrava"]), // 9+4+2+2−1 = 16
    ]);
    expect(r.autonoma.map((i) => i.number)).toEqual([3, 2, 1]);
  });
});
