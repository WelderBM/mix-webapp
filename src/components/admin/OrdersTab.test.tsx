// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { OrdersTab } from "./OrdersTab";
import * as firestore from "firebase/firestore";
import type { Order } from "@/types/order";

// Mesmo padrão de src/app/meu-pedido/page.test.tsx: objeto estável pro
// useSearchParams (evita loop infinito de efeito por identidade nova a
// cada render) com um URLSearchParams mutável por trás pra cada teste
// controlar os params (`?pedido=`, `?produto=`, `?page=`, ...).
const replaceMock = vi.fn();
const pushMock = vi.fn();
const backMock = vi.fn();
const params = new URLSearchParams();

const searchParamsMock = {
  get: (key: string) => params.get(key),
  toString: () => params.toString(),
  [Symbol.iterator]: () => params[Symbol.iterator](),
  entries: () => params.entries(),
  keys: () => params.keys(),
  values: () => params.values(),
  forEach: (cb: any) => params.forEach(cb),
  has: (key: string) => params.has(key),
  size: 0,
  sort: () => {},
  append: () => {},
  delete: () => {},
  set: () => {},
  getAll: (key: string) => params.getAll(key),
};

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParamsMock,
  useRouter: () => ({ replace: replaceMock, push: pushMock, back: backMock }),
  usePathname: () => "/admin",
}));

vi.mock("firebase/firestore", async () => {
  const actual = await vi.importActual("firebase/firestore");
  return {
    ...actual,
    collection: vi.fn(),
    query: vi.fn(),
    orderBy: vi.fn(),
    doc: vi.fn(),
    updateDoc: vi.fn(),
    onSnapshot: vi.fn(),
  };
});

window.HTMLElement.prototype.scrollIntoView = vi.fn();

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: "3K2euk9pOQb00AMcoF6X",
    customerName: "Maria Silva",
    customerPhone: "99999-0000",
    total: 50,
    status: "pending",
    paymentMethod: "pix",
    deliveryMethod: "pickup",
    createdAt: new Date().toISOString(),
    items: [
      {
        cartId: "c1",
        type: "SIMPLE",
        quantity: 1,
        product: { name: "Produto Teste" } as any,
      },
    ],
    ...overrides,
  };
}

describe("OrdersTab — deep-link ?pedido= não dispara setState-durante-render", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    params.delete("pedido");
    params.delete("produto");
    params.delete("page");
    params.delete("status");
  });

  it("expande o pedido do deep-link sem o warning 'Cannot update a component', mesmo quando ele chega só num snapshot posterior", async () => {
    params.set("pedido", "3K2euk9pOQb00AMcoF6X");

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    let emit: (orders: Order[]) => void = () => {};
    (firestore.onSnapshot as any).mockImplementation(
      (_q: any, callback: any) => {
        emit = (orders: Order[]) =>
          callback({
            docChanges: () => [],
            docs: orders.map((o) => ({ id: o.id, data: () => o })),
          });
        // Primeiro snapshot chega vazio: simula o deep-link chegando antes
        // do onSnapshot popular a lista.
        emit([]);
        return () => {};
      }
    );

    render(<OrdersTab />);

    expect(
      errorSpy.mock.calls.some((call) =>
        String(call[0]).includes("Cannot update a component")
      )
    ).toBe(false);

    // A lista carrega de fato numa atualização posterior do onSnapshot.
    emit([makeOrder()]);

    await waitFor(() => {
      expect(screen.getAllByText(/Produto Teste/).length).toBeGreaterThan(0);
    });

    // Item 2 da issue #73: além de expandir, o card do pedido deep-linkado
    // precisa rolar até a tela (scrollIntoView mockado no topo do arquivo).
    await waitFor(() => {
      expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalled();
    });

    expect(
      errorSpy.mock.calls.some((call) =>
        String(call[0]).includes("Cannot update a component")
      )
    ).toBe(false);

    errorSpy.mockRestore();
  });

  it("sem ?pedido= na URL, nenhum pedido auto-expande", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    (firestore.onSnapshot as any).mockImplementation(
      (_q: any, callback: any) => {
        callback({
          docChanges: () => [],
          docs: [makeOrder()].map((o) => ({ id: o.id, data: () => o })),
        });
        return () => {};
      }
    );

    render(<OrdersTab />);

    await waitFor(() => {
      expect(screen.getAllByText("Maria Silva").length).toBeGreaterThan(0);
    });

    expect(screen.queryAllByText(/Produto Teste/).length).toBe(0);
    expect(
      errorSpy.mock.calls.some((call) =>
        String(call[0]).includes("Cannot update a component")
      )
    ).toBe(false);

    errorSpy.mockRestore();
  });
});

describe("OrdersTab — área de pedidos mais descritiva (#54)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    params.delete("pedido");
    params.delete("produto");
    params.delete("page");
    params.delete("status");
  });

  function emitAndExpand(order: Order) {
    params.set("pedido", order.id);
    (firestore.onSnapshot as any).mockImplementation(
      (_q: any, callback: any) => {
        callback({
          docChanges: () => [],
          docs: [order].map((o) => ({ id: o.id, data: () => o })),
        });
        return () => {};
      }
    );
    render(<OrdersTab />);
  }

  it("mostra a observação do cliente quando presente, com indicador visível na linha fechada", async () => {
    emitAndExpand(
      makeOrder({ observation: "Troco para R$ 50, deixar na portaria" })
    );

    await waitFor(() => {
      expect(
        screen.getAllByText(/Troco para R\$ 50, deixar na portaria/).length
      ).toBeGreaterThan(0);
    });
    expect(
      screen.getAllByTitle("Tem observação do cliente").length
    ).toBeGreaterThan(0);
  });

  it("não mostra bloco de observação nem o indicador quando o pedido não tem uma", async () => {
    emitAndExpand(makeOrder());

    await waitFor(() => {
      expect(screen.getAllByText("Maria Silva").length).toBeGreaterThan(0);
    });
    expect(screen.queryAllByText(/Observação do cliente/).length).toBe(0);
    expect(screen.queryAllByTitle("Tem observação do cliente").length).toBe(
      0
    );
  });

  it("descreve o momento do pagamento e, pra PIX, o destino", async () => {
    emitAndExpand(
      makeOrder({
        paymentMethod: "pix",
        paymentTiming: "on_delivery",
        pixPaymentDestination: "carrier",
      })
    );

    await waitFor(() => {
      expect(
        screen.getAllByText(/Pagamento na entrega\/retirada/).length
      ).toBeGreaterThan(0);
      expect(
        screen.getAllByText(/PIX para o motoboy/).length
      ).toBeGreaterThan(0);
    });
  });

  it("pedido pago antecipado via PIX pra loja não confunde com pagamento na entrega", async () => {
    emitAndExpand(
      makeOrder({
        paymentMethod: "pix",
        paymentTiming: "prepaid",
        pixPaymentDestination: "store",
      })
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Pago antecipado/).length).toBeGreaterThan(
        0
      );
      expect(screen.getAllByText(/PIX para a loja/).length).toBeGreaterThan(
        0
      );
    });
  });
});

describe("OrdersTab — item do pedido abre produto do item (issue #73)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    params.delete("pedido");
    params.delete("produto");
    params.delete("page");
    params.delete("status");
  });

  function mount(order: Order) {
    (firestore.onSnapshot as any).mockImplementation(
      (_q: any, callback: any) => {
        callback({
          docChanges: () => [],
          docs: [order].map((o) => ({ id: o.id, data: () => o })),
        });
        return () => {};
      }
    );
    return render(<OrdersTab />);
  }

  it("item com produto: clicar dispara a navegação (push) pro `?produto=<id>` do item, não uma troca de filtro", async () => {
    params.set("pedido", "3K2euk9pOQb00AMcoF6X");
    const order = makeOrder({
      items: [
        {
          cartId: "c1",
          type: "SIMPLE",
          quantity: 2,
          product: {
            id: "prod-perfume-1",
            name: "Perfume Natura Essencial",
            type: "STANDARD_ITEM",
            category: "Perfumaria",
            unit: "un",
            inStock: true,
            disabled: false,
          } as any,
          selectedVariant: {
            id: "var1",
            type: "Cor",
            name: "Vermelho",
            inStock: true,
          },
        },
      ],
    });
    mount(order);

    await waitFor(() => {
      expect(
        screen.getAllByText(/Perfume Natura Essencial/).length
      ).toBeGreaterThan(0);
    });

    const itemButton = screen
      .getAllByText(/Perfume Natura Essencial/)[0]
      .closest("button");
    expect(itemButton).not.toBeNull();
    fireEvent.click(itemButton as HTMLButtonElement);

    expect(pushMock).toHaveBeenCalledTimes(1);
    const [url, opts] = pushMock.mock.calls[0];
    expect(url).toContain("produto=prod-perfume-1");
    expect(opts).toEqual({ scroll: false });
    // Abrir produto é navegação (push), não filtro — não pode reusar
    // router.replace, senão "voltar" não fecharia o modal.
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("com `?pedido=` e `?produto=` já na URL, o modal abre destacando a variante escolhida pelo cliente (não o produto genérico)", async () => {
    params.set("pedido", "3K2euk9pOQb00AMcoF6X");
    params.set("produto", "prod-perfume-1");
    const order = makeOrder({
      items: [
        {
          cartId: "c1",
          type: "SIMPLE",
          quantity: 1,
          product: {
            id: "prod-perfume-1",
            name: "Perfume Natura Essencial",
            type: "STANDARD_ITEM",
            category: "Perfumaria",
            unit: "un",
            inStock: true,
            disabled: false,
          } as any,
          selectedVariant: {
            id: "var1",
            type: "Cor",
            name: "Vermelho",
            inStock: true,
          },
        },
      ],
    });
    mount(order);

    await waitFor(() => {
      expect(
        screen.getByText("Escolhido pelo cliente neste pedido")
      ).toBeInTheDocument();
    });
    expect(screen.getAllByText("Cor: Vermelho").length).toBeGreaterThan(0);
  });

  it("abriu o produto por clique nesta sessão: fechar pelo 'X' usa router.back() (desfaz o push, reencontra o pedido)", async () => {
    params.set("pedido", "3K2euk9pOQb00AMcoF6X");
    const order = makeOrder({
      items: [
        {
          cartId: "c1",
          type: "SIMPLE",
          quantity: 1,
          product: {
            id: "prod-perfume-1",
            name: "Perfume Natura Essencial",
            type: "STANDARD_ITEM",
            category: "Perfumaria",
            unit: "un",
            inStock: true,
            disabled: false,
          } as any,
        },
      ],
    });
    const { rerender } = mount(order);

    await waitFor(() => {
      expect(
        screen.getAllByText(/Perfume Natura Essencial/).length
      ).toBeGreaterThan(0);
    });

    // Clique abre (push) — simula o roteador de verdade aplicando o patch
    // no `params` compartilhado (o mock só registra a chamada) e
    // re-renderiza, igual ao teste de paginação acima.
    const itemButton = screen
      .getAllByText(/Perfume Natura Essencial/)[0]
      .closest("button");
    fireEvent.click(itemButton as HTMLButtonElement);
    expect(pushMock).toHaveBeenCalledTimes(1);
    params.set("produto", "prod-perfume-1");
    rerender(<OrdersTab />);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    // Fecha pelo "X" do próprio Dialog (Radix, texto sr-only "Close").
    const closeButtons = screen.getAllByRole("button", { name: /close/i });
    fireEvent.click(closeButtons[0]);

    expect(backMock).toHaveBeenCalledTimes(1);
  });

  it("modal aberto direto por link (`?produto=` já na URL, sem clique nesta sessão): fechar NÃO usa router.back() — só remove o param, pra não sair do admin", async () => {
    params.set("pedido", "3K2euk9pOQb00AMcoF6X");
    params.set("produto", "prod-perfume-1");
    const order = makeOrder({
      items: [
        {
          cartId: "c1",
          type: "SIMPLE",
          quantity: 1,
          product: {
            id: "prod-perfume-1",
            name: "Perfume Natura Essencial",
            type: "STANDARD_ITEM",
            category: "Perfumaria",
            unit: "un",
            inStock: true,
            disabled: false,
          } as any,
        },
      ],
    });
    mount(order);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    const closeButtons = screen.getAllByRole("button", { name: /close/i });
    fireEvent.click(closeButtons[0]);

    expect(backMock).not.toHaveBeenCalled();
    expect(
      replaceMock.mock.calls.some(
        ([url]) => !String(url).includes("produto=")
      )
    ).toBe(true);
  });

  it("item composto sem produto único (CUSTOM_KIT) não quebra: abre um fallback com os componentes, sem tentar abrir o ProductInfoModal", async () => {
    params.set("pedido", "3K2euk9pOQb00AMcoF6X");
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const order = makeOrder({
      items: [
        {
          cartId: "c1",
          type: "CUSTOM_KIT",
          quantity: 1,
          kitName: "Kit Aniversário Completo",
          kitComponents: [
            { id: "comp1", name: "Bexiga Rosa" } as any,
            { id: "comp2", name: "Vela Number 5" } as any,
          ],
        },
      ],
    });
    mount(order);

    await waitFor(() => {
      expect(
        screen.getAllByText(/Kit Aniversário Completo/).length
      ).toBeGreaterThan(0);
    });

    const itemButton = screen
      .getAllByText(/Kit Aniversário Completo/)[0]
      .closest("button");
    fireEvent.click(itemButton as HTMLButtonElement);

    await waitFor(() => {
      expect(screen.getByText("Componentes do kit")).toBeInTheDocument();
    });
    expect(screen.getByText("Bexiga Rosa")).toBeInTheDocument();
    expect(screen.getByText("Vela Number 5")).toBeInTheDocument();

    // Nenhum push/replace pra `?produto=` — item composto não tem um
    // produto único pra apontar, então nunca navega pro modal de produto.
    expect(
      pushMock.mock.calls.some(([url]) => String(url).includes("produto="))
    ).toBe(false);
    expect(
      errorSpy.mock.calls.some((call) =>
        String(call[0]).includes("Cannot update a component")
      )
    ).toBe(false);
    errorSpy.mockRestore();
  });
});

describe("OrdersTab — paginação do `?pedido=` numa página > 1 (gotcha da issue #73)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    params.delete("pedido");
    params.delete("produto");
    params.delete("page");
    params.delete("status");
  });

  function makeManyOrders(count: number): Order[] {
    return Array.from({ length: count }, (_, i) =>
      makeOrder({
        id: `order-${i}`,
        customerName: `Cliente ${i}`,
        createdAt: new Date(2026, 0, count - i).toISOString(),
      })
    );
  }

  it("pedido fora da página 1: calcula a página certa (`page=`) e empurra pra URL em vez de falhar em silêncio", async () => {
    const orders = makeManyOrders(15);
    const target = orders[12]; // índice 12 => página 2 (ITEMS_PER_PAGE=10)
    params.set("pedido", target.id);

    (firestore.onSnapshot as any).mockImplementation(
      (_q: any, callback: any) => {
        callback({
          docChanges: () => [],
          docs: orders.map((o) => ({ id: o.id, data: () => o })),
        });
        return () => {};
      }
    );

    const { rerender } = render(<OrdersTab />);

    await waitFor(() => {
      expect(
        replaceMock.mock.calls.some(([url]) => String(url).includes("page=2"))
      ).toBe(true);
    });

    // O mock de router.replace só registra a chamada — simula a navegação
    // de verdade aplicando o patch no `params` compartilhado e re-renderiza,
    // como o Next faria ao processar o replace.
    params.set("page", "2");
    rerender(<OrdersTab />);

    await waitFor(() => {
      expect(screen.getAllByText(target.customerName).length).toBeGreaterThan(
        0
      );
    });
    await waitFor(() => {
      expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalled();
    });
  });
});

describe("OrdersTab — ponto de referência e troco pedido (#160)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    params.delete("pedido");
  });

  function emitAndExpand(order: Order) {
    params.set("pedido", order.id);
    (firestore.onSnapshot as any).mockImplementation(
      (_q: any, callback: any) => {
        callback({
          docChanges: () => [],
          docs: [order].map((o) => ({ id: o.id, data: () => o })),
        });
        return () => {};
      }
    );
    render(<OrdersTab />);
  }

  it("pedido de entrega com ponto de referência preenchido mostra o texto sem precisar abrir o WhatsApp", async () => {
    emitAndExpand(
      makeOrder({
        deliveryMethod: "delivery",
        address: "Rua das Flores, 123, Centro - Boa Vista",
        addressDetails: {
          street: "Rua das Flores",
          number: "123",
          neighborhood: "Centro",
          city: "Boa Vista",
          reference: "Portão azul, ao lado da padaria",
        },
      })
    );

    await waitFor(() => {
      expect(
        screen.getAllByText(/Portão azul, ao lado da padaria/).length
      ).toBeGreaterThan(0);
    });
  });

  it("pedido pago em dinheiro com troco pedido mostra o valor", async () => {
    emitAndExpand(
      makeOrder({
        paymentMethod: "cash",
        changeFor: "50",
      })
    );

    await waitFor(() => {
      expect(
        screen.getAllByText((_, node) =>
          Boolean(node?.textContent?.includes("Troco para R$ 50"))
        ).length
      ).toBeGreaterThan(0);
    });
  });

  it("pedido legado sem addressDetails/changeFor não quebra nem mostra lixo", async () => {
    emitAndExpand(
      makeOrder({
        deliveryMethod: "delivery",
        address: "Rua Antiga, 10 - Centro",
        paymentMethod: "cash",
        // addressDetails e changeFor ausentes, como pedidos gravados
        // antes da #72 — não devem aparecer no objeto.
      })
    );

    await waitFor(() => {
      expect(screen.getAllByText("Maria Silva").length).toBeGreaterThan(0);
    });

    expect(screen.queryAllByText(/Ponto de referência/).length).toBe(0);
    expect(screen.queryAllByText(/Troco para/).length).toBe(0);
    expect(screen.queryAllByText(/undefined/).length).toBe(0);
  });

  it("pedido de retirada não mostra bloco de ponto de referência mesmo se addressDetails vier populado por engano", async () => {
    emitAndExpand(
      makeOrder({
        deliveryMethod: "pickup",
        addressDetails: {
          reference: "Não deveria aparecer",
        },
      })
    );

    await waitFor(() => {
      expect(screen.getAllByText("Maria Silva").length).toBeGreaterThan(0);
    });

    expect(screen.queryAllByText(/Não deveria aparecer/).length).toBe(0);
  });
});
