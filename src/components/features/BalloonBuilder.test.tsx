// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BalloonBuilder } from "./BalloonBuilder";
import * as firestore from "firebase/firestore";

// Mock Firebase
vi.mock("firebase/firestore", async () => {
  const actual = await vi.importActual("firebase/firestore");
  return {
    ...actual,
    doc: vi.fn(),
    onSnapshot: vi.fn(),
    // Estoque dos balões (settings/balloonStock): por padrão, sem informação.
    getDoc: vi.fn(async () => ({ exists: () => false, data: () => undefined })),
  };
});

vi.mock("@/lib/firebase", () => ({
  db: {},
}));

// Mock Cart Store
const addItemMock = vi.fn();
const openCartMock = vi.fn();

vi.mock("@/store/cartStore", () => ({
  useCartStore: () => ({
    addItem: addItemMock,
    openCart: openCartMock,
  }),
}));

// Mock Sonner
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe("BalloonBuilder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render loading state initially", () => {
    // Setup onSnapshot to not return immediately or just return standard loading flow
    (firestore.onSnapshot as any).mockImplementation(() => () => {});
    render(<BalloonBuilder />);
    // Usually shows a loader, but let's check if we can find query selector for loader
    // or just check that content is not yet visible
    // However, the component renders <Loader2 /> if loading is true.
    // We can look for that.
  });

  it("should render options after loading data", async () => {
    // Mock data
    const mockData = {
      types: [
        {
          id: "t1",
          name: "Liso",
          sizes: [{ size: "9", price: 10, unitsPerPackage: 50 }],
          colors: ["Azul"],
        },
      ],
      allColors: ["Azul"],
    };

    // Mock onSnapshot implementation
    (firestore.onSnapshot as any).mockImplementation(
      (_ref: any, callback: any) => {
        callback({
          exists: () => true,
          data: () => mockData,
        });
        return () => {}; // unsubscribe function
      }
    );

    render(<BalloonBuilder />);

    // Wait for loading to finish and check for Step 0 title
    await waitFor(() => {
      expect(screen.getByText("Escolha o Tipo de Balão")).toBeTruthy();
    });

    // Check if "Liso" type is rendered
    expect(screen.getByText("Liso")).toBeTruthy();

    // Size should NOT be visible yet
    expect(screen.queryByText(/9"/)).toBeNull();
  });

  it("should allow selecting a size and transitioning to step 2", async () => {
    const mockData = {
      types: [
        {
          id: "t1",
          name: "Liso",
          sizes: [{ size: "9", price: 10, unitsPerPackage: 50 }],
          colors: ["Azul"],
        },
      ],
      allColors: ["Azul"],
    };

    (firestore.onSnapshot as any).mockImplementation(
      (_ref: any, callback: any) => {
        callback({ exists: () => true, data: () => mockData });
        return () => {};
      }
    );

    render(<BalloonBuilder />);

    // Wait for Types to load
    await waitFor(() => screen.getByText("Liso"));

    // 1. Select Type
    fireEvent.click(screen.getByText("Liso"));

    // 2. Wait for Size selection
    await waitFor(() => screen.getAllByText(/9"/)[0]);

    // 3. Click on size (should auto-transition to next step)
    fireEvent.click(await screen.findByRole("button", { name: /9"/ }));

    // Should see Step 2 title (Color selection)
    await waitFor(() => {
      expect(screen.getByText("Escolha a Cor")).toBeTruthy();
    });

    // Check if colors are displayed
    expect(screen.getByText("Azul")).toBeTruthy();
  });
  it("só mostra cor e tamanho que o Noturno tem em estoque (#236, 23/10)", async () => {
    const mockData = {
      types: [
        {
          id: "t1",
          name: "Liso",
          sizes: [
            { size: "7", price: 8, unitsPerPackage: 50 },
            { size: "9", price: 10, unitsPerPackage: 50 },
          ],
          colors: ["Azul", "Preto", "Verde"],
        },
      ],
      allColors: [],
    };
    (firestore.onSnapshot as any).mockImplementation((_ref: any, callback: any) => {
      callback({ exists: () => true, data: () => mockData });
      return () => {};
    });
    (firestore.getDoc as any).mockImplementation(async () => ({
      exists: () => true,
      data: () => ({ stock: { t1: { "9": { Azul: 4, Preto: 0 } } } }),
    }));

    render(<BalloonBuilder />);
    await waitFor(() => screen.getByText("Liso"));
    fireEvent.click(screen.getByText("Liso"));
    await waitFor(() => screen.getAllByText(/9"/)[0]);
    expect(screen.queryByText(/7"/)).toBeNull(); // nada no 7": tamanho some
    fireEvent.click(await screen.findByRole("button", { name: /9"/ }));
    await waitFor(() => screen.getByText("Escolha a Cor"));

    expect(screen.getByText("Azul")).toBeTruthy();
    expect(screen.queryByText("Verde")).toBeNull(); // o Noturno não tem no 9"
    expect(screen.queryByText("Preto")).toBeNull(); // esgotada: some
  });

  it("pede a marca primeiro: São Roque na frente; o item leva a marca (dono, 23/10)", async () => {
    const mockData = {
      types: [
        { id: "simples__riberball", name: "Liso Riberball", brand: "Riberball", imageUrl: "https://exemplo/riberball.png", sizes: [{ size: "7", price: 8, unitsPerPackage: 50 }], colors: ["Roxo"] },
        { id: "simples", name: "Liso", brand: "São Roque", sizes: [{ size: "7", price: 10, unitsPerPackage: 50 }], colors: ["Roxo Uva"] },
        { id: "neon", name: "Neon", brand: "São Roque", sizes: [{ size: "5", price: 9, unitsPerPackage: 25 }], colors: ["Verde"] },
        { id: "foil_numeros", name: "Números & Letras (Foil)", brand: "Gate", sizes: [{ size: "40cm", price: 12, unitsPerPackage: 1 }], colors: ["Dourado"] },
      ],
      allColors: [],
    };
    (firestore.onSnapshot as any).mockImplementation((_ref: any, callback: any) => {
      callback({ exists: () => true, data: () => mockData });
      return () => {};
    });
    (firestore.getDoc as any).mockImplementation(async () => ({ exists: () => false, data: () => undefined }));

    render(<BalloonBuilder />);
    await waitFor(() => screen.getByText("Escolha a Marca"));
    const cards = screen.getAllByRole("button").map((b) => b.textContent ?? "");
    const at = (txt: string) => cards.findIndex((t) => t.includes(txt));
    expect(at("São Roque")).toBeLessThan(at("Riberball"));
    expect(at("Riberball")).toBeLessThan(at("Números & Letras"));
    expect(screen.getByAltText("Pacote Riberball")).toBeTruthy(); // foto do pacote do tipo
    // Foto que não carrega cai na arte desenhada (#282).
    const foto = screen.getByAltText("Pacote Riberball") as HTMLImageElement;
    fireEvent.error(foto);
    expect(foto.src).not.toContain("exemplo/riberball.png");
    expect(screen.queryByText("Gate")).toBeNull(); // foil não é dividido por marca
    expect(screen.getByText("★ Mais pedida")).toBeTruthy();

    fireEvent.click(screen.getByAltText("Pacote Riberball"));
    // Um tamanho só: a etapa do tamanho aparece mesmo assim (relatório
    // 27/10); depois, a cor com a marca no título.
    fireEvent.click(await screen.findByRole("button", { name: /7"/ }));
    await waitFor(() => screen.getByText("Escolha a Cor"));
    expect(screen.getByText(/Liso Riberball/)).toBeTruthy();
    expect(screen.queryByText("Neon")).toBeNull();
    fireEvent.click(screen.getByText("Roxo"));
    fireEvent.click(await screen.findByRole("button", { name: /Adicionar/i }));
    expect(addItemMock).toHaveBeenCalledWith(
      expect.objectContaining({
        kitName: expect.stringContaining("Liso Riberball"),
        balloonDetails: expect.objectContaining({ brand: "Riberball", typeId: "simples__riberball" }),
      }),
    );
  });

  it("foil: só deixa usar letra/número que a cor tem, e conta as repetidas (dono, 23/10)", async () => {
    const mockData = {
      types: [{ id: "foil_numeros", name: "Números & Letras (Foil)", sizes: [{ size: "40cm", price: 12, unitsPerPackage: 1 }], colors: ["Rose Gold"] }],
      allColors: [],
    };
    (firestore.onSnapshot as any).mockImplementation((_ref: any, callback: any) => {
      callback({ exists: () => true, data: () => mockData });
      return () => {};
    });
    (firestore.getDoc as any).mockImplementation(async () => ({
      exists: () => true,
      data: () => ({
        stock: { foil_numeros: { "40cm": { "Rose Gold": 6 } } },
        chars: { "40cm": { "Rose Gold": { A: 1, N: 3, "5": 0 } } },
      }),
    }));

    render(<BalloonBuilder />);
    fireEvent.click(await screen.findByText("Números & Letras (Foil)"));
    fireEvent.click(await screen.findByRole("button", { name: /40 ?cm/ }));
    fireEvent.click(await screen.findByText("Rose Gold"));
    await screen.findByText("Quais letras ou números?");

    // Riscado: sem estoque nesta cor.
    expect((screen.getByLabelText("5: sem estoque") as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByLabelText("V: sem estoque") as HTMLButtonElement).disabled).toBe(true);

    // Digitado: o que não tem não entra, e o cliente vê o porquê.
    fireEvent.change(screen.getByPlaceholderText("Ex.: ANA ou FELIZ 15 ANOS"), { target: { value: "ANAV" } });
    expect((screen.getByPlaceholderText("Ex.: ANA ou FELIZ 15 ANOS") as HTMLInputElement).value).toBe("ANA");
    expect(screen.getByText("Sem estoque nesta cor: V")).toBeTruthy();

    // "ANA" precisa de 2 A e só há 1: avisa e não deixa adicionar.
    expect(screen.getByText(/Não temos A suficiente/)).toBeTruthy();
    expect((screen.getByRole("button", { name: /Adicionar ao Carrinho/ }) as HTMLButtonElement).disabled).toBe(true);

    // Com "NA" dá certo; o A acabou e a tecla dele fica desligada.
    fireEvent.change(screen.getByPlaceholderText("Ex.: ANA ou FELIZ 15 ANOS"), { target: { value: "NA" } });
    expect((screen.getByLabelText("A: já usado todo o estoque") as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: /Adicionar ao Carrinho/ }) as HTMLButtonElement).disabled).toBe(false);

    // Espaço separa palavras e não é balão (#342): "NA N" = 3 balões em 2 palavras.
    fireEvent.change(screen.getByPlaceholderText("Ex.: ANA ou FELIZ 15 ANOS"), { target: { value: "na  n" } });
    expect((screen.getByPlaceholderText("Ex.: ANA ou FELIZ 15 ANOS") as HTMLInputElement).value).toBe("NA N");
    expect(screen.getByText(/3 balão\(ões\) em 2 palavras/)).toBeTruthy();
  });

  it("foil: o aviso de sem estoque some ao trocar de cor (revisão do #278)", async () => {
    const mockData = {
      types: [{ id: "foil_numeros", name: "Números & Letras (Foil)", sizes: [{ size: "40cm", price: 12, unitsPerPackage: 1 }], colors: ["Rose Gold", "Dourado"] }],
      allColors: [],
    };
    (firestore.onSnapshot as any).mockImplementation((_ref: any, callback: any) => {
      callback({ exists: () => true, data: () => mockData });
      return () => {};
    });
    (firestore.getDoc as any).mockImplementation(async () => ({
      exists: () => true,
      data: () => ({
        stock: { foil_numeros: { "40cm": { "Rose Gold": 1, Dourado: 1 } } },
        chars: { "40cm": { "Rose Gold": { A: 1 }, Dourado: { "1": 1 } } },
      }),
    }));
    render(<BalloonBuilder />);
    fireEvent.click(await screen.findByText("Números & Letras (Foil)"));
    fireEvent.click(await screen.findByRole("button", { name: /40 ?cm/ }));
    fireEvent.click(await screen.findByText("Rose Gold"));
    fireEvent.change(await screen.findByPlaceholderText("Ex.: ANA ou FELIZ 15 ANOS"), { target: { value: "1" } });
    expect(screen.getByText("Sem estoque nesta cor: 1")).toBeTruthy();
    fireEvent.click(screen.getByText("Voltar"));
    fireEvent.click(await screen.findByText("Dourado"));
    await screen.findByText("Quais letras ou números?");
    expect(screen.queryByText(/Sem estoque nesta cor:/)).toBeNull();
  });
});
