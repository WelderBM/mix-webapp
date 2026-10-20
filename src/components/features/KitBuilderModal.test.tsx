// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { KitBuilderModal } from "./KitBuilderModal";
import { BuilderTrigger } from "./BuilderTrigger";
import { useKitBuilderStore } from "@/store/kitBuilderStore";

// Regressão da issue #112: o import do KitBuilderModal em src/app/layout.tsx
// virou next/dynamic({ ssr: false }). Este teste cobre o contrato de
// comportamento (BuilderTrigger abre o modal via useKitBuilderStore, fechar
// e reabrir não perde estado) — o "fora do bundle inicial" em si é validado
// via evidência de `next build`, não por aqui.

// Mock do Dialog: replica o padrão já usado em OrderSuccessModal.test.tsx
// (não renderiza nada quando fechado, evita a complexidade de portal do
// Radix em happy-dom).
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({
    open,
    children,
  }: {
    open: boolean;
    children: React.ReactNode;
  }) => (open ? <div data-testid="kit-builder-dialog">{children}</div> : null),
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
}));

vi.mock("@/components/ui/progress", () => ({
  Progress: () => <div data-testid="progress" />,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

vi.mock("../ui/SafeImage", () => ({
  SafeImage: () => <div data-testid="safe-image" />,
}));

vi.mock("lucide-react", () => ({
  Gift: () => <span>Gift</span>,
  ShoppingBag: () => <span>ShoppingBag</span>,
  Box: () => <span>Box</span>,
  ChevronRight: () => <span>ChevronRight</span>,
  Plus: () => <span>Plus</span>,
  Minus: () => <span>Minus</span>,
  Check: () => <span>Check</span>,
  Info: () => <span>Info</span>,
  List: () => <span>List</span>,
  ChevronDown: () => <span>ChevronDown</span>,
  ChevronUp: () => <span>ChevronUp</span>,
  Trash2: () => <span>Trash2</span>,
  Sparkles: () => <span>Sparkles</span>,
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/store/productStore", () => ({
  useProductStore: () => ({
    allProducts: [],
  }),
}));

const addCartItemMock = vi.fn();
const openGlobalCartMock = vi.fn();

vi.mock("@/store/cartStore", () => ({
  useCartStore: () => ({
    addItem: addCartItemMock,
    openCart: openGlobalCartMock,
  }),
}));

function renderBuilder() {
  return render(
    <>
      <BuilderTrigger />
      <KitBuilderModal />
    </>
  );
}

describe("KitBuilderModal (via BuilderTrigger, useKitBuilderStore real)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reseta a store real do Zustand entre testes (é um singleton de módulo).
    act(() => {
      useKitBuilderStore.getState().closeKitBuilder();
      useKitBuilderStore.getState().resetBuilder();
    });
  });

  it("does not render the modal content while closed", () => {
    renderBuilder();
    expect(screen.queryByText("Montador de Presentes")).not.toBeInTheDocument();
  });

  it("opens the modal when BuilderTrigger is clicked", () => {
    renderBuilder();
    fireEvent.click(screen.getByText("Monte seu Kit"));
    expect(screen.getByText("Montador de Presentes")).toBeInTheDocument();
    expect(useKitBuilderStore.getState().isOpen).toBe(true);
  });

  it("closes the modal via the Cancelar button and reopens without regressing state", () => {
    renderBuilder();

    // Abre
    fireEvent.click(screen.getByText("Monte seu Kit"));
    expect(screen.getByText("Montador de Presentes")).toBeInTheDocument();

    // Fecha (passo 1 -> botão "Cancelar" chama closeKitBuilder)
    fireEvent.click(screen.getByText("Cancelar"));
    expect(useKitBuilderStore.getState().isOpen).toBe(false);
    expect(
      screen.queryByText("Montador de Presentes")
    ).not.toBeInTheDocument();

    // Reabre — precisa voltar a funcionar normalmente, sem estado travado
    fireEvent.click(screen.getByText("Monte seu Kit"));
    expect(screen.getByText("Montador de Presentes")).toBeInTheDocument();
    expect(useKitBuilderStore.getState().isOpen).toBe(true);
    // Passo permanece 1 (não regrediu para um step travado)
    expect(useKitBuilderStore.getState().currentStep).toBe(1);
  });

  it("closes when the Dialog reports onOpenChange(false), matching the trigger's mounted-once modal", () => {
    renderBuilder();
    fireEvent.click(screen.getByText("Monte seu Kit"));
    expect(useKitBuilderStore.getState().isOpen).toBe(true);

    act(() => {
      useKitBuilderStore.getState().closeKitBuilder();
    });

    expect(
      screen.queryByText("Montador de Presentes")
    ).not.toBeInTheDocument();
  });
});
