// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BalloonBuilderTrigger } from "./BalloonBuilderTrigger";
import * as firestore from "firebase/firestore";

// Mock Firebase
vi.mock("firebase/firestore", async () => {
  const actual = await vi.importActual("firebase/firestore");
  return {
    ...actual,
    doc: vi.fn(),
    getDoc: vi.fn(),
  };
});

vi.mock("@/lib/firebase", () => ({
  db: {},
}));

// Mock SafeImage seguindo o padrão já usado em ProductCard.test.tsx
vi.mock("@/components/ui/SafeImage", () => ({
  SafeImage: ({ alt, src }: { alt: string; src?: string | null }) => (
    <img alt={alt} data-testid="safe-image" data-src={src ?? ""} />
  ),
}));

describe("BalloonBuilderTrigger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders SafeImage with the fetched placeholderUrl when Firestore has one", async () => {
    (firestore.getDoc as any).mockResolvedValue({
      exists: () => true,
      data: () => ({ placeholderUrl: "https://example.com/balloon.png" }),
    });

    render(<BalloonBuilderTrigger />);

    const image = await screen.findByTestId("safe-image");
    expect(image).toHaveAttribute("alt", "Balões");
    expect(image).toHaveAttribute("data-src", "https://example.com/balloon.png");
  });

  it("renders the BalloonIcon fallback when the Firestore doc has no placeholderUrl", async () => {
    (firestore.getDoc as any).mockResolvedValue({
      exists: () => true,
      data: () => ({}),
    });

    const { container } = render(<BalloonBuilderTrigger />);

    await waitFor(() => {
      expect(firestore.getDoc).toHaveBeenCalled();
    });

    expect(screen.queryByTestId("safe-image")).not.toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders the BalloonIcon fallback when the Firestore doc does not exist", async () => {
    (firestore.getDoc as any).mockResolvedValue({
      exists: () => false,
      data: () => ({}),
    });

    const { container } = render(<BalloonBuilderTrigger />);

    await waitFor(() => {
      expect(firestore.getDoc).toHaveBeenCalled();
    });

    expect(screen.queryByTestId("safe-image")).not.toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders exactly one <img> element (via SafeImage) and no raw <img> duplicates", async () => {
    (firestore.getDoc as any).mockResolvedValue({
      exists: () => true,
      data: () => ({ placeholderUrl: "https://example.com/balloon.png" }),
    });

    const { container } = render(<BalloonBuilderTrigger />);

    await screen.findByTestId("safe-image");

    const images = container.querySelectorAll("img");
    expect(images).toHaveLength(1);
    expect(images[0]).toHaveAttribute("data-testid", "safe-image");
  });
});
