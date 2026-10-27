import { describe, expect, it } from "vitest";
import { customerOrderMessage, customerWhatsAppUrl, waPhone } from "./orderMessage";

const fita = {
  id: "f1",
  name: "Fita Plástica 32mm Xingo Listrada Laranja",
  type: "RIBBON",
  price: 1,
  category: "Fitas",
  unit: "m",
  inStock: true,
  disabled: false,
  ribbonInventory: { status: "ABERTO", remainingMeters: 10, totalRollMeters: 100 },
};

const order = {
  id: "p5txGy0a2KViaz7iPq76",
  customerName: "Welder Barroso",
  customerPhone: "(95) 98424-4194",
  total: 6.5,
  paymentMethod: "credit_card" as const,
  deliveryMethod: "pickup" as const,
  items: [
    {
      cartId: "a",
      type: "CUSTOM_RIBBON",
      quantity: 1,
      kitName: "Laço Bola - Fita Plástica 32mm Xingo Listrada Laranja",
      kitTotalAmount: 5,
    },
    { cartId: "b", type: "SIMPLE", quantity: 1.5, product: fita },
  ],
} as never;

describe("customerOrderMessage (relatório 27/10)", () => {
  it("segue o modelo do dono, com o nome e o ID inteiro", () => {
    expect(customerOrderMessage(order, "https://www.mixnovidades.com")).toBe(
      [
        "PEDIDO - MIX NOVIDADES",
        "",
        "Olá, Welder! Estamos separando seu pedido. Qualquer informação passamos por aqui, obrigado pela preferência!",
        "",
        "ITENS:",
        "1x Laço Bola - Fita Plástica 32mm Xingo Listrada Laranja - R$ 5,00",
        "1,5 m de Fita Plástica 32mm Xingo Listrada Laranja - R$ 1,50",
        "",
        "Total: R$ 6,50",
        "Pagamento: Cartão de Crédito",
        "Entrega: Retirada no Local",
        "Acompanhe seu pedido (ID - p5txGy0a2KViaz7iPq76): https://www.mixnovidades.com/meu-pedido?id=p5txGy0a2KViaz7iPq76",
      ].join("\n"),
    );
  });

  it("entrega mostra o endereço; dinheiro mostra o troco", () => {
    const msg = customerOrderMessage(
      {
        ...(order as object),
        paymentMethod: "cash",
        changeFor: "50",
        deliveryMethod: "delivery",
        addressDetails: { street: "Rua A", number: "10", neighborhood: "Centro" },
      } as never,
      "https://x.com/",
    );
    expect(msg).toContain("Pagamento: Dinheiro (troco para R$ 50)");
    expect(msg).toContain("Entrega: Rua A, 10 - Centro (+ corrida do motoboy)");
    expect(msg).toContain("https://x.com/meu-pedido?id=");
  });
});

describe("waPhone", () => {
  it("põe o 55 e tira a máscara", () => {
    expect(waPhone("(95) 98424-4194")).toBe("5595984244194");
    expect(waPhone("95 3224-1234")).toBe("559532241234");
    expect(waPhone("+55 95 98424-4194")).toBe("5595984244194");
    expect(waPhone("1234")).toBeNull();
    expect(waPhone(undefined)).toBeNull();
  });

  it("monta o link do wa.me para o cliente", () => {
    const url = customerWhatsAppUrl(order as never, "https://www.mixnovidades.com")!;
    expect(url.startsWith("https://wa.me/5595984244194?text=PEDIDO%20-%20MIX%20NOVIDADES")).toBe(true);
  });
});
