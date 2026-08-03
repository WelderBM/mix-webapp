// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ProductPageClient from "./ProductPageClient";
import { Product, ProductVariant } from "@/types";

// Mock stores
const addItem = vi.fn();
const openCart = vi.fn();
vi.mock("@/store/cartStore", () => ({
  useCartStore: () => ({
    addItem,
    openCart,
  }),
}));

// Mock sonner
const toastSuccess = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
  },
}));

// Mock lucide-react (avoid pulling real icon SVGs into the DOM assertions)
vi.mock("lucide-react", () => ({
  ShoppingCart: () => <span data-testid="icon-cart" />,
  Check: () => <span data-testid="icon-check" />,
  ShieldCheck: () => <span data-testid="icon-shield" />,
}));

// Mock ProductImageGallery — its own behavior is out of scope here, we only
// need it to expose enough to trigger onSelectImage from a test.
vi.mock("@/components/features/ProductImageGallery", () => ({
  ProductImageGallery: ({
    images,
    onSelectImage,
  }: {
    images: { url: string; label?: string }[];
    onSelectImage: (url: string) => void;
  }) => (
    <div data-testid="gallery">
      {images.map((img) => (
        <button key={img.url} onClick={() => onSelectImage(img.url)}>
          img:{img.label || img.url}
        </button>
      ))}
    </div>
  ),
}));

// Mock BackButton (irrelevant to interactive behavior under test)
vi.mock("@/components/ui/BackButton", () => ({
  BackButton: () => <button>Voltar</button>,
}));

const makeProduct = (overrides: Partial<Product> = {}): Product => ({
  id: "prod-1",
  name: "Cesta de Natal",
  description: "Uma cesta bonita para presentear",
  price: 150,
  type: "BASE_CONTAINER",
  category: "Cestas",
  unit: "un",
  inStock: true,
  disabled: false,
  ...overrides,
});

describe("ProductPageClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders product name, price and description from the resolved prop", () => {
    const product = makeProduct();
    render(<ProductPageClient product={product} />);

    expect(screen.getByText("Cesta de Natal")).toBeInTheDocument();
    expect(screen.getByText(/R\$ 150\.00/)).toBeInTheDocument();
    expect(
      screen.getByText("Uma cesta bonita para presentear")
    ).toBeInTheDocument();
  });

  it("shows 'Preço Indisponível' when the product has no effective price", () => {
    const product = makeProduct({ price: undefined });
    render(<ProductPageClient product={product} />);

    expect(screen.getByText("Preço indisponível")).toBeInTheDocument();
    expect(screen.getByText("Preço Indisponível")).toBeInTheDocument();
  });

  describe("modo matriz (dimensões combinadas)", () => {
    // 3 variações: a partir do default (P-Azul), tanto "Vermelho" (mesmo
    // Tamanho) quanto "G" (mesma Cor) formam combinação existente — os dois
    // chips aparecem habilitados (isOptionAvailable exige bater com toda a
    // seleção atual nas outras dimensões).
    const matrixVariants: ProductVariant[] = [
      {
        id: "v-p-azul",
        type: "Tamanho",
        name: "P - Azul",
        price: 100,
        inStock: true,
        attributes: { Tamanho: "P", Cor: "Azul" },
      },
      {
        id: "v-p-vermelho",
        type: "Tamanho",
        name: "P - Vermelho",
        price: 110,
        inStock: true,
        attributes: { Tamanho: "P", Cor: "Vermelho" },
      },
      {
        id: "v-g-azul",
        type: "Tamanho",
        name: "G - Azul",
        price: 130,
        inStock: false,
        attributes: { Tamanho: "G", Cor: "Azul" },
      },
    ];

    it("pre-selects the first variant and shows its price by default", () => {
      const product = makeProduct({ variants: matrixVariants, price: undefined });
      render(<ProductPageClient product={product} />);

      expect(screen.getByText(/R\$ 100\.00/)).toBeInTheDocument();
      expect(screen.getByText("Adicionar ao Carrinho")).toBeInTheDocument();
    });

    it("selecting a dimension value updates the effective price", () => {
      const product = makeProduct({ variants: matrixVariants, price: undefined });
      render(<ProductPageClient product={product} />);

      fireEvent.click(screen.getByRole("button", { name: "Vermelho" }));

      expect(screen.getByText(/R\$ 110\.00/)).toBeInTheDocument();
    });

    it("selecting a chip that resolves to an out-of-stock variant blocks add-to-cart", () => {
      const product = makeProduct({ variants: matrixVariants, price: undefined });
      render(<ProductPageClient product={product} />);

      fireEvent.click(screen.getByRole("button", { name: "G" }));
      expect(screen.getByText("Esgotado Nessa Opção")).toBeInTheDocument();

      fireEvent.click(screen.getByText("Esgotado Nessa Opção"));

      expect(addItem).not.toHaveBeenCalled();
      expect(
        screen.getByText("Essa opção está esgotada. Escolha outra.")
      ).toBeInTheDocument();
    });
  });

  describe("modo legado (variantGroups por .type)", () => {
    const legacyVariants: ProductVariant[] = [
      { id: "v-p", type: "Tamanho", name: "P", price: 90, inStock: true },
      { id: "v-g", type: "Tamanho", name: "G", price: 110, inStock: false },
    ];

    it("blocks add-to-cart and shows an alert when the selected variant is out of stock", () => {
      const product = makeProduct({ variants: legacyVariants, price: undefined });
      render(<ProductPageClient product={product} />);

      // A primeira variação da lista é pré-selecionada por padrão.
      expect(screen.getByText(/R\$ 90\.00/)).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "G" }));
      // "G" está com inStock: false — bloqueia a ação.
      expect(screen.getByText("Esgotado Nessa Opção")).toBeInTheDocument();
      fireEvent.click(screen.getByText("Esgotado Nessa Opção"));

      expect(addItem).not.toHaveBeenCalled();
      expect(
        screen.getByText("Essa opção está esgotada. Escolha outra.")
      ).toBeInTheDocument();
    });

    it("switching to an in-stock variant re-enables add-to-cart", () => {
      const product = makeProduct({ variants: legacyVariants, price: undefined });
      render(<ProductPageClient product={product} />);

      fireEvent.click(screen.getByRole("button", { name: "G" }));
      fireEvent.click(screen.getByRole("button", { name: "P" }));
      fireEvent.click(screen.getByText("Adicionar ao Carrinho"));

      expect(addItem).toHaveBeenCalledTimes(1);
      expect(openCart).toHaveBeenCalledTimes(1);
      expect(toastSuccess).toHaveBeenCalledWith("Adicionado ao carrinho!");
    });
  });

  describe("adicionar ao carrinho (produto simples, sem variações)", () => {
    it("calls addItem with the resolved product and opens the cart", () => {
      const product = makeProduct();
      render(<ProductPageClient product={product} />);

      fireEvent.click(screen.getByText("Adicionar ao Carrinho"));

      expect(addItem).toHaveBeenCalledTimes(1);
      expect(addItem.mock.calls[0][0]).toMatchObject({
        type: "SIMPLE",
        quantity: 1,
        product,
      });
      expect(openCart).toHaveBeenCalledTimes(1);
      expect(toastSuccess).toHaveBeenCalledWith("Adicionado ao carrinho!");
    });

    it("resets selection state when the product prop changes (client navigation)", () => {
      const productA = makeProduct({ id: "a", name: "Produto A" });
      const productB = makeProduct({
        id: "b",
        name: "Produto B",
        images: [{ id: "img-b", url: "url-b", isCover: true, label: "Capa B" }],
      });

      const { rerender } = render(<ProductPageClient product={productA} />);
      expect(screen.getByText("Produto A")).toBeInTheDocument();

      rerender(<ProductPageClient product={productB} />);
      expect(screen.getByText("Produto B")).toBeInTheDocument();
    });
  });
});
