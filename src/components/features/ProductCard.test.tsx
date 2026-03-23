// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductCard } from "./ProductCard";
import { Product } from "@/types";

// Mock stores
vi.mock("@/store/cartStore", () => ({
  useCartStore: () => ({
    addItem: vi.fn(),
    openCart: vi.fn(),
  }),
}));

vi.mock("@/store/kitBuilderStore", () => ({
  useKitBuilderStore: () => ({
    openKitBuilder: vi.fn(),
  }),
}));

// Mock SafeImage
vi.mock("@/components/ui/SafeImage", () => ({
  SafeImage: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock Button component
vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    className,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button onClick={onClick} className={className} {...props}>
      {children}
    </button>
  ),
}));

// Mock utilities
vi.mock("@/lib/utils", () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(" "),
  formatCurrency: (value: number) => `R$ ${value.toLocaleString("pt-BR")}`,
}));

// Mock lucide-react
vi.mock("lucide-react", () => ({
  ShoppingCart: () => <span>ShoppingCart</span>,
}));

// Mock sonner
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
  },
}));

// Product fixture
const makeProduct = (overrides: Partial<Product> = {}): Product => ({
  id: "prod-1",
  name: "Cesta de Natal",
  description: "Uma cesta bonita",
  price: 150.0,
  type: "BASE_CONTAINER",
  category: "Cestas",
  unit: "un",
  inStock: true,
  disabled: false,
  ...overrides,
});

describe("ProductCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders product name", () => {
    const product = makeProduct();
    render(<ProductCard product={product} />);
    expect(screen.getByText("Cesta de Natal")).toBeInTheDocument();
  });

  it("renders formatted price with R$ and correct format", () => {
    const product = makeProduct({ price: 150.0 });
    render(<ProductCard product={product} />);
    expect(screen.getByText(/R\$ 150/)).toBeInTheDocument();
  });

  it("shows 'Adicionar' button when inStock is true", () => {
    const product = makeProduct({ inStock: true });
    render(<ProductCard product={product} />);
    expect(screen.getByText("Adicionar")).toBeInTheDocument();
  });

  it("shows 'Ver Opções' button when product has multiple images", () => {
    const product = makeProduct({
      inStock: true,
      images: [
        { id: "img-1", url: "url-1", isCover: true },
        { id: "img-2", url: "url-2", isCover: false },
      ],
    });
    render(<ProductCard product={product} />);
    expect(screen.getByText("Ver Opções")).toBeInTheDocument();
  });

  it("renders a link that goes to /produto/{id}", () => {
    const product = makeProduct({ id: "prod-123" });
    render(<ProductCard product={product} />);
    const links = screen.getAllByRole("link");
    expect(links.some((link) => link.getAttribute("href") === "/produto/prod-123")).toBe(true);
  });

  it("renders 'Montar Kit' button for ASSEMBLED_KIT type", () => {
    const product = makeProduct({ type: "ASSEMBLED_KIT" });
    render(<ProductCard product={product} />);
    expect(screen.getByText("Montar Kit")).toBeInTheDocument();
  });

  it("renders product description", () => {
    const product = makeProduct({ description: "Uma cesta bonita" });
    render(<ProductCard product={product} />);
    expect(screen.getByText("Uma cesta bonita")).toBeInTheDocument();
  });
});
