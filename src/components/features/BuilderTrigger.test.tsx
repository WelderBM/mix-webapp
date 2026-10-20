// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BuilderTrigger } from "./BuilderTrigger";

// Mock lucide-react icons usados no card
vi.mock("lucide-react", () => ({
  Gift: () => <span>Gift</span>,
  Plus: () => <span>Plus</span>,
  Sparkles: () => <span>Sparkles</span>,
}));

const openKitBuilderMock = vi.fn();

vi.mock("@/store/kitBuilderStore", () => ({
  useKitBuilderStore: () => ({
    openKitBuilder: openKitBuilderMock,
  }),
}));

describe("BuilderTrigger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the call-to-action copy", () => {
    render(<BuilderTrigger />);
    expect(screen.getByText("Monte seu Kit")).toBeInTheDocument();
    expect(screen.getByText("Começar Agora")).toBeInTheDocument();
  });

  it("calls openKitBuilder from the store when clicked", () => {
    render(<BuilderTrigger />);
    fireEvent.click(screen.getByText("Monte seu Kit"));
    expect(openKitBuilderMock).toHaveBeenCalledTimes(1);
  });

  it("calls openKitBuilder again on a second click (no debounce/lock)", () => {
    render(<BuilderTrigger />);
    const card = screen.getByText("Monte seu Kit");
    fireEvent.click(card);
    fireEvent.click(card);
    expect(openKitBuilderMock).toHaveBeenCalledTimes(2);
  });
});
