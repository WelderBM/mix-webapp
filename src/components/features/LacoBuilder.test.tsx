// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LacoBuilder } from "./LacoBuilder";
import { Product, StoreSettings, BowModel } from "@/types";

const addItem = vi.fn();
const openCart = vi.fn();

const ribbon: Product = {
  id: "ribbon-1",
  name: "Fita Cetim Vermelha",
  price: 0.5,
  type: "RIBBON",
  category: "Fitas",
  unit: "m",
  inStock: true,
  disabled: false,
  imageUrl: "https://placehold.co/100",
  ribbonInventory: { status: "ABERTO", remainingMeters: 50, totalRollMeters: 100 },
};

let mockSettings: StoreSettings;

vi.mock("@/store/productStore", () => ({
  useProductStore: () => ({ allProducts: [ribbon] }),
}));

vi.mock("@/store/cartStore", () => ({
  useCartStore: () => ({ addItem, openCart }),
}));

vi.mock("@/store/settingsStore", () => ({
  useSettingsStore: () => ({ settings: mockSettings }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/image-utils", () => ({
  getProductImage: (url: string) => url,
}));

vi.mock("../ui/SafeImage", () => ({
  SafeImage: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

function baseSettings(overrides: Partial<StoreSettings> = {}): StoreSettings {
  return {
    id: "general",
    storeName: "Loja",
    whatsappNumber: "5500000000000",
    theme: { primaryColor: "#000", activeTheme: "default" },
    filters: { activeCategories: [], categoryOrder: [] },
    homeSections: [],
    bowSizes: [
      { id: "P", name: "Pequeno", price: 3 },
      { id: "M", name: "Médio", price: 4 },
      { id: "G", name: "Grande", price: 5 },
    ],
    ...overrides,
  };
}

describe("LacoBuilder — tamanho por modelo (#144)", () => {
  it("modelo com um único sizeId auto-seleciona o tamanho, sem exigir escolha extra", () => {
    mockSettings = baseSettings({
      bowModels: [
        {
          id: "bola",
          name: "Bola",
          subtitle: "Clássico",
          imageUrl: "",
          sizeIds: ["M"],
        },
      ],
    });

    render(<LacoBuilder />);

    fireEvent.click(screen.getByText("Fita Cetim Vermelha"));
    fireEvent.click(screen.getByText("Bola"));

    // Auto-selecionado: mostra o tamanho fixo, sem chips clicáveis pra escolher
    // (o nome também aparece no resumo lateral, daí getAllByText em vez de getByText).
    expect(screen.getAllByText("Médio").length).toBeGreaterThan(0);
    expect(screen.queryByText("Pequeno")).not.toBeInTheDocument();
    expect(screen.getAllByText("R$ 4.00").length).toBeGreaterThan(0);
  });

  it("modelo com vários sizeIds exige escolha do cliente, e o preço segue o tamanho escolhido", () => {
    mockSettings = baseSettings({
      bowModels: [
        {
          id: "bola",
          name: "Bola",
          subtitle: "Clássico",
          imageUrl: "",
          sizeIds: ["P", "G"],
        },
      ],
    });

    render(<LacoBuilder />);

    fireEvent.click(screen.getByText("Fita Cetim Vermelha"));
    fireEvent.click(screen.getByText("Bola"));

    // Nenhum tamanho auto-selecionado — os dois oferecidos pelo modelo aparecem como opção.
    expect(screen.getByText("Pequeno")).toBeInTheDocument();
    expect(screen.getByText("Grande")).toBeInTheDocument();
    // Médio não é oferecido por este modelo — não deve aparecer como opção de tamanho.
    expect(screen.queryByText("Médio")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Grande"));

    expect(screen.getAllByText("R$ 5.00").length).toBeGreaterThan(0);
  });

  it("modelo legado com sizeId (sem sizeIds) continua funcionando via leitura tolerante", () => {
    const legacyModel: BowModel = {
      id: "borboleta",
      name: "Borboleta",
      subtitle: "Legado",
      imageUrl: "",
      sizeId: "P",
    };
    mockSettings = baseSettings({ bowModels: [legacyModel] });

    render(<LacoBuilder />);

    fireEvent.click(screen.getByText("Fita Cetim Vermelha"));
    fireEvent.click(screen.getByText("Borboleta"));

    expect(screen.getAllByText("Pequeno").length).toBeGreaterThan(0);
    expect(screen.getAllByText("R$ 3.00").length).toBeGreaterThan(0);
  });

  it("trocar de modelo reseta o tamanho selecionado", () => {
    mockSettings = baseSettings({
      bowModels: [
        {
          id: "bola",
          name: "Bola",
          subtitle: "Clássico",
          imageUrl: "",
          sizeIds: ["P", "G"],
        },
        {
          id: "borboleta",
          name: "Borboleta",
          subtitle: "Simples",
          imageUrl: "",
          sizeIds: ["M"],
        },
      ],
    });

    render(<LacoBuilder />);

    fireEvent.click(screen.getByText("Fita Cetim Vermelha"));
    fireEvent.click(screen.getByText("Bola"));
    fireEvent.click(screen.getByText("Grande"));
    expect(screen.getAllByText("R$ 5.00").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByText("Borboleta"));

    // Modelo novo tem só um tamanho: auto-seleciona o dele (Médio), não
    // carrega a escolha (Grande) do modelo anterior.
    expect(screen.getAllByText("R$ 4.00").length).toBeGreaterThan(0);
  });
});
