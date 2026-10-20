// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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

  describe("fallback de toque nos menus hover-only (issue #163)", () => {
    it("opens 'Fitas & Laços' via click, not just hover", () => {
      render(<Navbar />);
      const trigger = screen.getByTestId("nav-group-trigger-Fitas & Laços");
      const dropdown = screen.getByTestId(
        "nav-group-dropdown-Fitas & Laços"
      );

      expect(trigger).toHaveAttribute("aria-expanded", "false");
      // Base classes always include the CSS hover variants
      // (`group-hover:opacity-100`); the click-driven state must add the
      // *plain* utility class, not just a substring match on those variants.
      expect(dropdown.classList.contains("opacity-100")).toBe(false);

      fireEvent.click(trigger);

      expect(trigger).toHaveAttribute("aria-expanded", "true");
      expect(dropdown.classList.contains("opacity-100")).toBe(true);
      expect(dropdown.classList.contains("visible")).toBe(true);
    });

    it("toggles 'Fitas & Laços' closed on a second click", () => {
      render(<Navbar />);
      const trigger = screen.getByTestId("nav-group-trigger-Fitas & Laços");

      fireEvent.click(trigger);
      expect(trigger).toHaveAttribute("aria-expanded", "true");

      fireEvent.click(trigger);
      expect(trigger).toHaveAttribute("aria-expanded", "false");
    });

    it("opens 'Balões & Presentes' via click", () => {
      render(<Navbar />);
      const trigger = screen.getByTestId(
        "nav-group-trigger-Balões & Presentes"
      );
      const dropdown = screen.getByTestId(
        "nav-group-dropdown-Balões & Presentes"
      );

      fireEvent.click(trigger);

      expect(trigger).toHaveAttribute("aria-expanded", "true");
      expect(dropdown.classList.contains("opacity-100")).toBe(true);
    });

    it("opens the 'Loja' mega-menu via click", () => {
      mockCategoryState.categories = [
        { id: "fitas", name: "Fitas", order: 0, active: true, subcategories: [] },
      ];
      mockProductState.allProducts = [
        { id: "p1", name: "Fita A", category: "Fitas", inStock: true, disabled: false, type: "STANDARD_ITEM", unit: "un" },
      ];
      render(<Navbar />);

      const trigger = screen.getByTestId("loja-menu-trigger");
      const dropdown = screen.getByTestId("loja-menu-dropdown");

      expect(trigger).toHaveAttribute("aria-expanded", "false");

      fireEvent.click(trigger);

      expect(trigger).toHaveAttribute("aria-expanded", "true");
      expect(dropdown.classList.contains("opacity-100")).toBe(true);
    });

    it("closes an open group when clicking a child item inside it", () => {
      render(<Navbar />);
      const trigger = screen.getByTestId("nav-group-trigger-Fitas & Laços");
      fireEvent.click(trigger);
      expect(trigger).toHaveAttribute("aria-expanded", "true");

      const centralDeFitasLinks = screen.getAllByText("Central de Fitas");
      // Desktop dropdown instance is the first match rendered in the DOM.
      fireEvent.click(centralDeFitasLinks[0].closest("a")!);

      expect(trigger).toHaveAttribute("aria-expanded", "false");
    });

    it("closes an open group when clicking outside the desktop nav", () => {
      render(<Navbar />);
      const trigger = screen.getByTestId("nav-group-trigger-Fitas & Laços");
      fireEvent.click(trigger);
      expect(trigger).toHaveAttribute("aria-expanded", "true");

      fireEvent.mouseDown(document.body);

      expect(trigger).toHaveAttribute("aria-expanded", "false");
    });

    it("only one group is open at a time (opening 'Loja' closes 'Fitas & Laços')", () => {
      mockCategoryState.categories = [
        { id: "fitas", name: "Fitas", order: 0, active: true, subcategories: [] },
      ];
      mockProductState.allProducts = [
        { id: "p1", name: "Fita A", category: "Fitas", inStock: true, disabled: false, type: "STANDARD_ITEM", unit: "un" },
      ];
      render(<Navbar />);

      const fitasTrigger = screen.getByTestId(
        "nav-group-trigger-Fitas & Laços"
      );
      const lojaTrigger = screen.getByTestId("loja-menu-trigger");

      fireEvent.click(fitasTrigger);
      expect(fitasTrigger).toHaveAttribute("aria-expanded", "true");

      fireEvent.click(lojaTrigger);
      expect(lojaTrigger).toHaveAttribute("aria-expanded", "true");
      expect(fitasTrigger).toHaveAttribute("aria-expanded", "false");
    });
  });
});
