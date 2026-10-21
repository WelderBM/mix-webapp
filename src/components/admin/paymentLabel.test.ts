import { describe, it, expect, vi } from "vitest";

// OrdersTab importa Firebase no topo; aqui só interessa a função pura.
vi.mock("@/lib/firebase", () => ({ db: {}, auth: {}, storage: {} }));

import { paymentLabel } from "./OrdersTab";

describe("paymentLabel (#244)", () => {
  it("um nome só por forma de pagamento", () => {
    expect(paymentLabel("pix")).toBe("PIX");
    expect(paymentLabel("cash")).toBe("Dinheiro");
    expect(paymentLabel("credit_card")).toBe("Crédito");
    expect(paymentLabel("debit_card")).toBe("Débito");
  });

  it("texto longo para o motoboy", () => {
    expect(paymentLabel("credit_card", true)).toBe("Cartão de crédito");
    expect(paymentLabel("debit_card", true)).toBe("Cartão de débito");
  });

  it("forma desconhecida não vira PIX", () => {
    expect(paymentLabel(undefined)).toBe("Não informado");
    expect(paymentLabel("boleto")).toBe("Não informado");
  });
});
