// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import Navbar from "./Navbar";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

// Mock next/link as a plain anchor
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: React.PropsWithChildren<{ href: string }>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock UI building blocks not relevant to this component's own logic
vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    ...props
  }: React.PropsWithChildren<{ onClick?: () => void }>) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/features/CartSidebar", () => ({
  CartSidebar: () => null,
  CartIcon: () => <button>CartIcon</button>,
}));

// Sheet (Radix-based) collapsed to a simple conditional render so mobile menu
// content can be asserted without dealing with portals/animations.
vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({ open, children }: React.PropsWithChildren<{ open: boolean }>) =>
    open ? <div data-testid="mobile-sheet">{children}</div> : null,
  SheetContent: ({ children }: React.PropsWithChildren<unknown>) => (
    <div>{children}</div>
  ),
  SheetHeader: ({ children }: React.PropsWithChildren<unknown>) => (
    <div>{children}</div>
  ),
  SheetTitle: ({ children }: React.PropsWithChildren<unknown>) => (
    <div>{children}</div>
  ),
  SheetClose: ({ children }: React.PropsWithChildren<unknown>) => (
    <div>{children}</div>
  ),
}));

const openKitBuilderMock = vi.fn();
vi.mock("@/store/kitBuilderStore", () => ({
  useKitBuilderStore: (selector: (state: any) => unknown) =>
    selector({ openKitBuilder: openKitBuilderMock }),
}));

vi.mock("@/store/settingsStore", () => ({
  useSettingsStore: (selector: (state: any) => unknown) =>
    selector({ settings: { storeName: "Mix Novidades" } }),
}));

// Mutable fixtures for the two data-driven stores behind the "Loja" mega-menu
// (issue #70) — `vi.hoisted` so the factories below (hoisted above imports
// by Vitest) can close over the same objects the tests mutate.
const { mockCategoryState, mockProductState } = vi.hoisted(() => ({
  mockCategoryState: {
    categories: [] as any[],
    isLoading: false,
    hasSubscribed: false,
    subscribe: vi.fn(),
  },
  mockProductState: {
    allProducts: [] as any[],
    isLoading: false,
    fetchProducts: vi.fn(),
  },
}));

vi.mock("@/store/categoryStore", () => ({
  useCategoryStore: (selector: (state: any) => unknown) =>
    selector(mockCategoryState),
}));

vi.mock("@/store/productStore", () => {
  const useProductStore = (selector: (state: any) => unknown) =>
    selector(mockProductState);
  // Navbar's fetch-guard reads the store imperatively (useProductStore.getState())
  // from inside a queueMicrotask, mirroring Zustand's real static API.
  useProductStore.getState = () => mockProductState;
  return { useProductStore };
});

describe("Navbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCategoryState.categories = [];
    mockProductState.allProducts = [];
  });

  describe("badge de área de atendimento (issue #159)", () => {
    it("renders 'Entregamos em Boa Vista - RR' visible on every page", () => {
      render(<Navbar />);
      expect(
        screen.getByText("Entregamos em Boa Vista - RR")
      ).toBeInTheDocument();
    });

    it("renders the badge as a single element shared by desktop and mobile (not duplicated per breakpoint)", () => {
      render(<Navbar />);
      expect(
        screen.getAllByText("Entregamos em Boa Vista - RR")
      ).toHaveLength(1);
    });
  });

  describe("serviços fixos (regressão)", () => {
    it("renders 'Central de Fitas' linking to /fitas", () => {
      render(<Navbar />);
      const links = screen.getAllByText("Central de Fitas").map(
        (el) => el.closest("a")?.getAttribute("href")
      );
      expect(links).toContain("/fitas");
    });

    it("opens the Kit Builder modal when 'Monte Sua Cesta' is clicked", () => {
      render(<Navbar />);
      const trigger = screen.getAllByText("Monte Sua Cesta")[0];
      trigger.closest("button")!.click();
      expect(openKitBuilderMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("menu 'Loja' (issue #70)", () => {
    it("does not render the 'Loja' trigger when there are no visible categories", () => {
      mockCategoryState.categories = [];
      mockProductState.allProducts = [];
      render(<Navbar />);
      expect(screen.queryByTestId("loja-menu-trigger")).not.toBeInTheDocument();
    });

    it("does not render 'Loja' when the only category is inactive", () => {
      mockCategoryState.categories = [
        { id: "fitas", name: "Fitas", order: 0, active: false, subcategories: [] },
      ];
      mockProductState.allProducts = [
        { id: "p1", name: "Fita A", category: "Fitas", inStock: true, disabled: false, type: "STANDARD_ITEM", unit: "un" },
      ];
      render(<Navbar />);
      expect(screen.queryByTestId("loja-menu-trigger")).not.toBeInTheDocument();
    });

    it("does not render 'Loja' when the active category has no in-stock product", () => {
      mockCategoryState.categories = [
        { id: "fitas", name: "Fitas", order: 0, active: true, subcategories: [] },
      ];
      mockProductState.allProducts = [
        { id: "p1", name: "Fita A", category: "Fitas", inStock: false, disabled: false, type: "STANDARD_ITEM", unit: "un" },
      ];
      render(<Navbar />);
      expect(screen.queryByTestId("loja-menu-trigger")).not.toBeInTheDocument();
    });

    it("renders visible categories ordered by `order`, linking to /categoria/[slug]", () => {
      mockCategoryState.categories = [
        { id: "baloes", name: "Balões", order: 1, active: true, subcategories: [] },
        { id: "fitas", name: "Fitas", order: 0, active: true, subcategories: [] },
      ];
      mockProductState.allProducts = [
        { id: "p1", name: "Fita A", category: "Fitas", inStock: true, disabled: false, type: "STANDARD_ITEM", unit: "un" },
        { id: "p2", name: "Balão A", category: "Balões", inStock: true, disabled: false, type: "STANDARD_ITEM", unit: "un" },
      ];
      render(<Navbar />);

      expect(screen.getByTestId("loja-menu-trigger")).toBeInTheDocument();

      const fitasLink = screen.getByText("Fitas").closest("a");
      const baloesLink = screen.getByText("Balões").closest("a");
      expect(fitasLink).toHaveAttribute("href", "/categoria/fitas");
      expect(baloesLink).toHaveAttribute("href", "/categoria/baloes");

      // DOM order should follow category `order` (Fitas=0 before Balões=1)
      const allLinks = screen.getAllByRole("link").map((l) => l.getAttribute("href"));
      expect(allLinks.indexOf("/categoria/fitas")).toBeLessThan(
        allLinks.indexOf("/categoria/baloes")
      );
    });

    it("renders subcategories with in-stock products, linking to /categoria/[slug]?sub=[subSlug]", () => {
      mockCategoryState.categories = [
        {
          id: "fitas",
          name: "Fitas",
          order: 0,
          active: true,
          subcategories: [{ id: "cetim", name: "Cetim", order: 0 }],
        },
      ];
      mockProductState.allProducts = [
        {
          id: "p1",
          name: "Fita Cetim",
          category: "Fitas",
          subcategory: "Cetim",
          inStock: true,
          disabled: false,
          type: "STANDARD_ITEM",
          unit: "un",
        },
      ];
      render(<Navbar />);

      const subLinks = screen
        .getAllByText("Cetim")
        .map((el) => el.closest("a")?.getAttribute("href"));
      expect(subLinks).toContain("/categoria/fitas?sub=cetim");
    });

    it("hides a subcategory with zero in-stock products while keeping the parent category visible", () => {
      mockCategoryState.categories = [
        {
          id: "fitas",
          name: "Fitas",
          order: 0,
          active: true,
          subcategories: [
            { id: "cetim", name: "Cetim", order: 0 },
            { id: "organza", name: "Organza", order: 1 },
          ],
        },
      ];
      mockProductState.allProducts = [
        {
          id: "p1",
          name: "Fita Cetim",
          category: "Fitas",
          subcategory: "Cetim",
          inStock: true,
          disabled: false,
          type: "STANDARD_ITEM",
          unit: "un",
        },
        {
          id: "p2",
          name: "Fita Organza",
          category: "Fitas",
          subcategory: "Organza",
          inStock: false,
          disabled: false,
          type: "STANDARD_ITEM",
          unit: "un",
        },
      ];
      render(<Navbar />);

      expect(screen.getByTestId("loja-menu-trigger")).toBeInTheDocument();
      expect(screen.getAllByText("Fitas").length).toBeGreaterThan(0);
      expect(screen.queryByText("Organza")).not.toBeInTheDocument();
    });
  });
});
