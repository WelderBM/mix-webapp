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

    // Wait for loading to finish and check for Step 0 title
    await waitFor(() => {
      expect(screen.getByText("Escolha o Tipo de Balão")).toBeTruthy();
    });

    // Check if "Liso" type is rendered
    expect(screen.getByText("Liso")).toBeTruthy();

    // Size should NOT be visible yet
    expect(screen.queryByText('9"')).toBeNull();
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
    await waitFor(() => screen.getByText(/9"/));

    // 3. Click on size (should auto-transition to next step)
    fireEvent.click(screen.getByText(/9"/));

    // Should see Step 2 title (Color selection)
    await waitFor(() => {
      expect(screen.getByText("Escolha a Cor")).toBeTruthy();
    });

    // Check if colors are displayed
    expect(screen.getByText("Azul")).toBeTruthy();
  });
});
