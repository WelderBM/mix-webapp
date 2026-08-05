// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { setDoc } from "firebase/firestore";
import AdminPage from "./page";

// Mesmo padrão de src/app/meu-pedido/page.test.tsx e
// src/components/admin/OrdersTab.test.tsx: objeto estável pro
// useSearchParams (evita loop infinito de efeito por identidade nova a
// cada render) com um URLSearchParams mutável por trás pra cada teste
// controlar `?view=`/`?aba=`.
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
  useRouter: () => ({ replace: replaceMock, push: vi.fn() }),
  usePathname: () => "/admin",
}));

// Usuário autenticado e autorizado (whitelisted_staff ativo), pra passar
// direto pelos guards de auth do AdminPageContent.
const fakeUser = {
  uid: "u1",
  email: "dono@mixnovidades.com",
  emailVerified: true,
};

vi.mock("firebase/auth", async () => {
  const actual = await vi.importActual("firebase/auth");
  return {
    ...actual,
    onAuthStateChanged: (_auth: unknown, cb: (u: unknown) => void) => {
      cb(fakeUser);
      return () => {};
    },
    signOut: vi.fn(),
  };
});

vi.mock("firebase/firestore", async () => {
  const actual = await vi.importActual("firebase/firestore");
  const emptySnapshot = { docs: [] };
  return {
    ...actual,
    collection: vi.fn(),
    query: vi.fn(),
    orderBy: vi.fn(),
    doc: vi.fn(),
    setDoc: vi.fn(),
    onSnapshot: (_ref: unknown, cb: (s: unknown) => void) => {
      // Cobre tanto os onSnapshot de coleção (products/categories, veem
      // {docs:[]}) quanto o de documento único (settings/balloons, vê
      // exists()/data()) — o admin não distingue no mock, cada callback só
      // usa a forma que precisa.
      cb({ ...emptySnapshot, exists: () => false, data: () => undefined });
      return () => {};
    },
    getDoc: vi.fn(async () => ({
      exists: () => true,
      data: () => ({ active: true }),
    })),
  };
});

vi.mock("@/lib/firebase", () => ({
  auth: {},
  db: {},
}));

// Mutável de propósito (issue #166): a maioria dos testes deste arquivo
// quer settings/general "ainda carregando" (null, comportamento default),
// mas o describe de baixo sobre o guard de salvar precisa simular a
// primeira leitura real chegando — sem isso não dá pra testar o botão
// "Salvar Configurações" saindo do estado desabilitado.
let mockGlobalSettings: import("@/types").StoreSettings | null = null;

vi.mock("@/providers/ThemeProvider", async () => {
  const actual = await vi.importActual("@/providers/ThemeProvider");
  return {
    ...actual,
    useGlobalSettings: () => mockGlobalSettings,
  };
});

// Abas pesadas (Firestore/forms próprios) substituídas por stubs — o que
// este teste cobre é a navegação (issue #76: uma barra única, deep-link
// via ?aba=/?view= preservado), não o conteúdo de cada aba.
vi.mock("@/components/admin/OrdersTab", () => ({
  OrdersTab: () => <div data-testid="orders-tab" />,
}));
vi.mock("@/components/admin/ProductsTab", () => ({
  ProductsTab: () => <div data-testid="products-tab" />,
}));
vi.mock("@/components/admin/SectionsTab", () => ({
  SectionsTab: () => <div data-testid="sections-tab" />,
}));
vi.mock("@/components/admin/BalloonsTab", () => ({
  BalloonsTab: () => <div data-testid="balloons-tab" />,
}));
vi.mock("@/components/admin/RibbonsTab", () => ({
  RibbonsTab: () => <div data-testid="ribbons-tab" />,
}));
vi.mock("@/components/admin/ConfigTab", () => ({
  ConfigTab: () => <div data-testid="config-tab" />,
}));
vi.mock("@/components/admin/NaturaTab", () => ({
  NaturaTab: () => <div data-testid="natura-tab" />,
}));
vi.mock("@/components/admin/ProductFormDialog", () => ({
  ProductFormDialog: () => null,
}));
vi.mock("@/components/admin/SuperAdminZone", () => ({
  SuperAdminZone: () => null,
}));

describe("AdminPage — navegação unificada (issue #76) preserva ?aba=/?view=", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    params.delete("view");
    params.delete("aba");
  });

  it("sem query params abre em Pedidos (default) — OrdersTab visível, sem abas de nível 2", async () => {
    render(<AdminPage />);
    await waitFor(() => expect(screen.getByTestId("orders-tab")).toBeTruthy());
    expect(screen.queryByText("Produtos")).toBeNull();
  });

  it("?view=estoque abre direto em Gerenciar Estoque (aba Produtos por default)", async () => {
    params.set("view", "estoque");
    render(<AdminPage />);
    await waitFor(() =>
      expect(screen.getByTestId("products-tab")).toBeTruthy()
    );
    expect(
      screen.getByRole("button", { name: /gerenciar estoque/i }).getAttribute(
        "aria-current"
      )
    ).toBe("page");
  });

  it("?view=estoque&aba=fitas abre direto na aba Fitas (deep-link)", async () => {
    params.set("view", "estoque");
    params.set("aba", "fitas");
    render(<AdminPage />);
    await waitFor(() =>
      expect(screen.getByTestId("ribbons-tab")).toBeTruthy()
    );
  });

  it("?view=estoque&aba=baloes abre direto na aba Balões (deep-link)", async () => {
    params.set("view", "estoque");
    params.set("aba", "baloes");
    render(<AdminPage />);
    await waitFor(() =>
      expect(screen.getByTestId("balloons-tab")).toBeTruthy()
    );
  });

  it("clicar em 'Gerenciar Estoque' troca pra Estoque e grava ?view=estoque na URL", async () => {
    render(<AdminPage />);
    await waitFor(() => expect(screen.getByTestId("orders-tab")).toBeTruthy());

    fireEvent.click(screen.getByRole("button", { name: /gerenciar estoque/i }));

    await waitFor(() =>
      expect(screen.getByTestId("products-tab")).toBeTruthy()
    );
    expect(replaceMock).toHaveBeenCalledWith(
      expect.stringContaining("view=estoque"),
      { scroll: false }
    );
  });

  it("clicar na aba 'Fitas' (nível 2) grava ?aba=fitas na URL", async () => {
    params.set("view", "estoque");
    render(<AdminPage />);
    await waitFor(() =>
      expect(screen.getByTestId("products-tab")).toBeTruthy()
    );

    fireEvent.mouseDown(screen.getByRole("tab", { name: /fitas/i }), {
      button: 0,
    });

    await waitFor(() =>
      expect(screen.getByTestId("ribbons-tab")).toBeTruthy()
    );
    expect(replaceMock).toHaveBeenCalledWith(
      expect.stringContaining("aba=fitas"),
      { scroll: false }
    );
  });

  it("voltar de Estoque pra Pedidos limpa ?view=/?aba= da URL", async () => {
    params.set("view", "estoque");
    params.set("aba", "fitas");
    render(<AdminPage />);
    await waitFor(() =>
      expect(screen.getByTestId("ribbons-tab")).toBeTruthy()
    );

    fireEvent.click(screen.getByRole("button", { name: /^pedidos$/i }));

    await waitFor(() => expect(screen.getByTestId("orders-tab")).toBeTruthy());
    const lastCall = replaceMock.mock.calls.at(-1);
    expect(lastCall?.[0]).not.toMatch(/view=|aba=/);
  });
});

describe("AdminPage — guard do botão 'Salvar Configurações' (issue #166)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    params.delete("view");
    params.delete("aba");
    mockGlobalSettings = null;
  });

  it("fica desabilitado enquanto settings/general ainda não chegou (useGlobalSettings null)", async () => {
    render(<AdminPage />);
    await waitFor(() => expect(screen.getByTestId("orders-tab")).toBeTruthy());

    const saveButton = screen.getByRole("button", {
      name: /salvar configurações/i,
    });
    expect(saveButton).toBeDisabled();
  });

  it("clicar desabilitado não chama setDoc — não sobrescreve o Firestore com o default vazio", async () => {
    render(<AdminPage />);
    await waitFor(() => expect(screen.getByTestId("orders-tab")).toBeTruthy());

    fireEvent.click(
      screen.getByRole("button", { name: /salvar configurações/i })
    );

    expect(setDoc).not.toHaveBeenCalled();
  });

  it("habilita depois que settings/general entrega a primeira leitura real", async () => {
    mockGlobalSettings = {
      id: "general",
      storeName: "Mix Novidades",
      whatsappNumber: "",
      theme: { primaryColor: "#0f172a", activeTheme: "default" },
      filters: { activeCategories: [], categoryOrder: [] },
      homeSections: [
        {
          id: "sec-1",
          title: "Destaques",
          type: "product_shelf",
          width: "full",
          source: { mode: "manual", productIds: ["p1"] },
          isActive: true,
        },
      ],
    };

    render(<AdminPage />);
    await waitFor(() => expect(screen.getByTestId("orders-tab")).toBeTruthy());

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /salvar configurações/i })
      ).not.toBeDisabled()
    );
  });

  it("clicar habilitado salva o settings/general REAL recebido, não o default hardcoded", async () => {
    mockGlobalSettings = {
      id: "general",
      storeName: "Loja Real (do Firestore)",
      whatsappNumber: "5595999999999",
      theme: { primaryColor: "#0f172a", activeTheme: "default" },
      filters: { activeCategories: [], categoryOrder: [] },
      homeSections: [
        {
          id: "sec-1",
          title: "Destaques",
          type: "product_shelf",
          width: "full",
          source: { mode: "manual", productIds: ["p1"] },
          isActive: true,
        },
      ],
    };

    render(<AdminPage />);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /salvar configurações/i })
      ).not.toBeDisabled()
    );

    fireEvent.click(
      screen.getByRole("button", { name: /salvar configurações/i })
    );

    await waitFor(() => expect(setDoc).toHaveBeenCalled());
    const generalCallArgs = (setDoc as unknown as ReturnType<typeof vi.fn>).mock.calls.find(
      (call) => (call[1] as { homeSections?: unknown[] })?.homeSections
    );
    expect(generalCallArgs?.[1]).toMatchObject({
      storeName: "Loja Real (do Firestore)",
      homeSections: [expect.objectContaining({ id: "sec-1" })],
    });
  });
});
