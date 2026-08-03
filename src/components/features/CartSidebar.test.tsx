// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CartSidebar } from "./CartSidebar";
import * as firestore from "firebase/firestore";

// Mock Firebase. vi.mock() é hoisted acima das declarações const do módulo,
// então addDocMock precisa ser criado dentro de vi.hoisted() pra existir
// no momento em que a factory abaixo roda.
const { addDocMock } = vi.hoisted(() => ({
  addDocMock: vi.fn(async (_ref: any, data: any) => ({
    id: "order-abc12345",
  })),
}));

vi.mock("firebase/firestore", async () => {
  const actual = await vi.importActual("firebase/firestore");
  return {
    ...actual,
    collection: vi.fn(() => ({})),
    addDoc: addDocMock,
    doc: vi.fn(),
    getDoc: vi.fn(async () => ({ exists: () => false })),
  };
});

vi.mock("@/lib/firebase", () => ({
  db: {},
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

// Mock Sonner
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

// Um item SIMPLE com preço já resolvido — suficiente pra passar pelo guard
// de item indisponível (getCartItemUnavailableReason) sem precisar simular
// o catálogo inteiro do productStore.
const cartItem = {
  cartId: "cart-1",
  type: "SIMPLE" as const,
  quantity: 1,
  product: {
    id: "prod-1",
    name: "Balão Metalizado",
    price: 15,
    type: "DEFAULT",
    disabled: false,
  },
};

const removeItemMock = vi.fn();
const updateQuantityMock = vi.fn();
const closeCartMock = vi.fn();
const clearCartMock = vi.fn();
const getCartTotalMock = vi.fn(() => 15);

vi.mock("@/store/cartStore", () => ({
  useCartStore: () => ({
    items: [cartItem],
    isCartOpen: true,
    closeCart: closeCartMock,
    removeItem: removeItemMock,
    updateQuantity: updateQuantityMock,
    getCartTotal: getCartTotalMock,
    clearCart: clearCartMock,
  }),
}));

vi.mock("@/store/productStore", () => ({
  useProductStore: () => ({
    getProductById: vi.fn(),
    allProducts: [cartItem.product],
    isLoading: false,
  }),
}));

window.HTMLElement.prototype.scrollIntoView = vi.fn();
// Radix Dialog/Sheet consulta hasPointerCapture em ambientes sem ponteiro real.
if (!window.HTMLElement.prototype.hasPointerCapture) {
  window.HTMLElement.prototype.hasPointerCapture = vi.fn(() => false) as any;
}

// Os <Label> deste componente não têm htmlFor associado ao <Input>
// correspondente (gap pré-existente, não introduzido nesta issue — ver
// achado fora de escopo no relatório final). getByLabelText não funciona
// aqui; usamos placeholder, que já é a query usada nos campos de endereço.
function fillContact() {
  fireEvent.change(screen.getByPlaceholderText("Digite seu nome"), {
    target: { value: "Maria Silva" },
  });
  fireEvent.change(screen.getByPlaceholderText("(99) 99999-9999"), {
    target: { value: "95999998888" },
  });
}

describe("CartSidebar — progressive disclosure do checkout (#72)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    (window as any).open = vi.fn();
  });

  it("caminho Retirar + PIX mostra só os campos essenciais, sem endereço nem 'para quem paga'", () => {
    render(<CartSidebar />);

    expect(screen.getByPlaceholderText("Digite seu nome")).toBeTruthy();
    expect(screen.getByPlaceholderText("(99) 99999-9999")).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Retirar" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Entrega" })).toBeTruthy();
    expect(screen.getByText("Forma de Pagamento")).toBeTruthy();

    // Retirada é o padrão inicial — bloco de endereço e "para quem paga"
    // não devem existir na árvore até o usuário escolher Entrega.
    expect(screen.queryByText("CEP")).toBeNull();
    expect(screen.queryByText("Ponto de referência (Opcional)")).toBeNull();
    expect(
      screen.queryByText("Para quem você vai realizar o pagamento?")
    ).toBeNull();
  });

  it("selecionar Entrega revela endereço estruturado e o bloco 'para quem paga'", () => {
    render(<CartSidebar />);

    fireEvent.click(screen.getByRole("radio", { name: "Entrega" }));

    expect(screen.getByText("CEP")).toBeTruthy();
    expect(screen.getByText("Número")).toBeTruthy();
    expect(screen.getByText("Rua")).toBeTruthy();
    expect(screen.getByText("Bairro")).toBeTruthy();
    expect(screen.getByText("Ponto de referência (Opcional)")).toBeTruthy();
    expect(
      screen.getByText("Para quem você vai realizar o pagamento?")
    ).toBeTruthy();
  });

  it("selecionar Dinheiro revela 'Troco para quanto?' e viaja no payload/mensagem", async () => {
    render(<CartSidebar />);

    expect(screen.queryByText("Troco para quanto? (Opcional)")).toBeNull();

    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.click(await screen.findByRole("option", { name: /Dinheiro/ }));

    const changeInput = await screen.findByPlaceholderText("Ex: R$ 50");
    fireEvent.change(changeInput, { target: { value: "50" } });

    fillContact();
    fireEvent.click(screen.getByText("Finalizar Pedido"));

    await waitFor(() => expect(addDocMock).toHaveBeenCalledTimes(1));

    const payload = addDocMock.mock.calls[0][1];
    expect(payload.paymentMethod).toBe("cash");
    expect(payload.changeFor).toBe("50");
    expect(payload.pixPaymentDestination).toBeNull();

    await waitFor(() => expect((window.open as any)).toHaveBeenCalled());
    const whatsappUrl = (window.open as any).mock.calls[0][0] as string;
    const message = decodeURIComponent(whatsappUrl.split("text=")[1]);
    expect(message).toContain("Troco para R$ 50");
  });

  it("bloqueia o envio se o telefone não for preenchido, mesmo em Retirar", async () => {
    const sonner = await import("sonner");
    render(<CartSidebar />);

    fireEvent.change(screen.getByPlaceholderText("Digite seu nome"), {
      target: { value: "Maria Silva" },
    });
    fireEvent.click(screen.getByText("Finalizar Pedido"));

    await waitFor(() => {
      expect(sonner.toast.warning).toHaveBeenCalledWith(
        "Por favor, digite um telefone válido para contato."
      );
    });
    expect(addDocMock).not.toHaveBeenCalled();
  });

  it("exige endereço completo só quando Entrega está selecionado", async () => {
    const sonner = await import("sonner");
    render(<CartSidebar />);

    fillContact();
    fireEvent.click(screen.getByRole("radio", { name: "Entrega" }));
    // Não preenche Rua/Número/Bairro.
    fireEvent.click(screen.getByText("Finalizar Pedido"));

    await waitFor(() => {
      expect(sonner.toast.warning).toHaveBeenCalledWith(
        "Por favor, preencha o endereço completo (Rua, Número e Bairro)."
      );
    });
    expect(addDocMock).not.toHaveBeenCalled();
  });

  it("payload de Retirar + PIX não carrega pixPaymentDestination nem changeFor, e a mensagem de WhatsApp não menciona Destino/Troco", async () => {
    render(<CartSidebar />);

    fillContact();
    fireEvent.click(screen.getByText("Finalizar Pedido"));

    await waitFor(() => expect(addDocMock).toHaveBeenCalledTimes(1));

    const payload = addDocMock.mock.calls[0][1];
    expect(payload.deliveryMethod).toBe("pickup");
    expect(payload.pixPaymentDestination).toBeNull();
    expect(payload.changeFor).toBeNull();
    expect(payload.address).toBeNull();
    expect(payload.addressDetails).toBeNull();

    await waitFor(() => expect((window.open as any)).toHaveBeenCalled());
    const whatsappUrl = (window.open as any).mock.calls[0][0] as string;
    const message = decodeURIComponent(whatsappUrl.split("text=")[1]);
    expect(message).not.toContain("Destino:");
    expect(message).not.toContain("Troco");
    expect(message).not.toContain("Endereço:");
  });

  it("pedido de Entrega carrega endereço estruturado (não em Observação)", async () => {
    render(<CartSidebar />);

    fillContact();
    fireEvent.click(screen.getByRole("radio", { name: "Entrega" }));

    fireEvent.change(screen.getByPlaceholderText("Nome da rua"), {
      target: { value: "Rua das Flores" },
    });
    fireEvent.change(screen.getByPlaceholderText("Nº"), {
      target: { value: "123" },
    });
    fireEvent.change(screen.getByPlaceholderText("Bairro"), {
      target: { value: "Centro" },
    });
    fireEvent.change(
      screen.getByPlaceholderText("Ex: Perto do mercado, portão azul..."),
      { target: { value: "Portão verde" } }
    );

    fireEvent.click(screen.getByText("Finalizar Pedido"));

    await waitFor(() => expect(addDocMock).toHaveBeenCalledTimes(1));

    const payload = addDocMock.mock.calls[0][1];
    expect(payload.address).toBe("Rua das Flores, 123, Centro - Boa Vista");
    expect(payload.addressDetails).toMatchObject({
      street: "Rua das Flores",
      number: "123",
      neighborhood: "Centro",
      reference: "Portão verde",
    });
    // Observação continua vazia — endereço não foi empurrado pra lá.
    expect(payload.observation).toBeNull();
  });
});
