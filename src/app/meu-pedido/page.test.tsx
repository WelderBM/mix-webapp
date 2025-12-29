import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TrackOrderContent } from "./page";
import * as firestore from "firebase/firestore";

// Mock Next.js Navigation
const replaceMock = vi.fn();
const getMock = vi.fn();
const params = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key: string) => params.get(key),
    toString: () => params.toString(),
  }),
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

// Mock Firebase
vi.mock("firebase/firestore", async () => {
  const actual = await vi.importActual("firebase/firestore");
  return {
    ...actual,
    doc: vi.fn(),
    onSnapshot: vi.fn(),
  };
});

vi.mock("@/lib/firebase", () => ({
  db: {},
}));

// Mock formatCurrency to avoid locale issues in test
vi.mock("@/lib/utils", async () => {
  const actual = await vi.importActual("@/lib/utils");
  return {
    ...actual,
    formatCurrency: (val: number) => `R$ ${val.toFixed(2).replace(".", ",")}`,
  };
});

describe("TrackOrderContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    params.delete("id");
  });

  it("should render search input when no order is loaded", () => {
    (firestore.onSnapshot as any).mockImplementation(() => () => {});
    render(<TrackOrderContent />);
    expect(
      screen.getByPlaceholderText("Cole o ID do pedido aqui...")
    ).toBeTruthy();
  });

  it("should auto-load order if ID is in URL", async () => {
    params.set("id", "order123");

    const mockOrder = {
      id: "order123",
      customerName: "Maria Silva",
      status: "pending",
      total: 150,
      items: [],
      deliveryMethod: "pickup",
    };

    (firestore.onSnapshot as any).mockImplementation(
      (_ref: any, callback: any) => {
        callback({
          exists: () => true,
          data: () => mockOrder,
          id: "order123",
        });
        return () => {};
      }
    );

    render(<TrackOrderContent />);

    await waitFor(() => {
      expect(screen.getByText(/Olá, Maria/)).toBeTruthy();
    });

    expect(screen.getByText(/Rastrear Pedido/)).toBeTruthy();
  });

  it("should show error if order not found", async () => {
    (firestore.onSnapshot as any).mockImplementation(
      (_ref: any, callback: any) => {
        callback({
          exists: () => false,
        });
        return () => {};
      }
    );

    render(<TrackOrderContent />);

    const input = screen.getByPlaceholderText("Cole o ID do pedido aqui...");
    fireEvent.change(input, { target: { value: "invalid-id" } });
    fireEvent.submit(input.closest("form")!);

    await waitFor(() => {
      expect(screen.getByText("Pedido não encontrado.")).toBeTruthy();
    });
  });

  it("should update URL when searching manually", async () => {
    const mockOrder = {
      id: "manual123",
      customerName: "João",
      status: "pending",
      total: 50,
      items: [],
      deliveryMethod: "delivery",
      address: "Rua A",
    };

    // Mock success response
    (firestore.onSnapshot as any).mockImplementation(
      (_ref: any, callback: any) => {
        callback({
          exists: () => true,
          data: () => mockOrder,
          id: "manual123",
        });
        return () => {};
      }
    );

    render(<TrackOrderContent />);

    const input = screen.getByPlaceholderText("Cole o ID do pedido aqui...");
    fireEvent.change(input, { target: { value: "manual123" } });
    fireEvent.submit(input.closest("form")!);

    await waitFor(() => {
      expect(screen.getByText(/Olá, João/)).toBeTruthy();
    });

    // Check if URL was updated
    // Note: The component logic checks if currentUrlId !== id. Initial URL param is empty.
    // So it should call router.replace
    expect(replaceMock).toHaveBeenCalled();
    expect(replaceMock.mock.calls[0][0]).toContain("id=manual123");
  });
});
