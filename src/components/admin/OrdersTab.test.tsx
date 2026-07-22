// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { OrdersTab } from "./OrdersTab";
import * as firestore from "firebase/firestore";
import type { Order } from "@/types/order";

// Mesmo padrão de src/app/meu-pedido/page.test.tsx: objeto estável pro
// useSearchParams (evita loop infinito de efeito por identidade nova a
// cada render) com um URLSearchParams mutável por trás pra cada teste
// controlar o param `?pedido=`.
const replaceMock = vi.fn();
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
  useRouter: () => ({ replace: replaceMock }),
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
