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

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.getByText("Escolha o Tipo e Tamanho")).toBeTruthy();
    });

    // Check if "Liso" is rendered
    expect(screen.getByText("Liso")).toBeTruthy();
    // Check if size option is there
    expect(screen.getByText('9"')).toBeTruthy();
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

    await waitFor(() => screen.getByText('9"'));

    // Click on size
    fireEvent.click(screen.getByText('9"'));

    // Click "Escolher Cor"
    const nextButton = screen.getByText("Escolher Cor") as HTMLButtonElement;
    expect(nextButton.disabled).toBe(false);

    fireEvent.click(nextButton);

    // Should see Step 2 title
    await waitFor(() => {
      expect(screen.getByText("Escolha a Cor")).toBeTruthy();
    });

    // Check if colors are displayed
    expect(screen.getByText("Azul")).toBeTruthy();
  });
});
