// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { TrackingIcon } from "./TrackingIcon";
import { GroupInvite, GROUP_INVITE_DELAY_MS } from "./GroupInvite";
import { rememberOrder } from "@/lib/orderTracking";

vi.mock("@/lib/firebase", () => ({ db: {} }));
vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  getDoc: vi.fn(async () => ({ exists: () => false })),
}));

beforeEach(() => {
  localStorage.clear();
});

describe("TrackingIcon (relatório 27/10)", () => {
  it("sem pedido: leva ao rastreio, sem destaque", () => {
    render(<TrackingIcon />);
    const link = screen.getByRole("link", { name: "Meu pedido" });
    expect(link.getAttribute("href")).toBe("/meu-pedido");
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("depois da compra: pulsa e avisa até o cliente tocar", () => {
    render(<TrackingIcon />);
    act(() => rememberOrder("abc123"));
    const link = screen.getByRole("link", { name: /acompanhe aqui/ });
    expect(link.getAttribute("href")).toBe("/meu-pedido?id=abc123");
    expect(screen.getByRole("status").textContent).toContain("Seu pedido fica aqui");
    fireEvent.click(link);
    expect(screen.queryByRole("status")).toBeNull();
  });
});

describe("GroupInvite", () => {
  it("espera uns segundos, aparece uma vez só por aparelho", () => {
    vi.useFakeTimers();
    try {
      const { unmount } = render(<GroupInvite />);
      expect(screen.queryByLabelText("Convite para o grupo do WhatsApp")).toBeNull();
      act(() => vi.advanceTimersByTime(GROUP_INVITE_DELAY_MS));
      expect(screen.getByLabelText("Convite para o grupo do WhatsApp")).toBeTruthy();
      fireEvent.click(screen.getByLabelText("Fechar convite"));
      expect(screen.queryByLabelText("Convite para o grupo do WhatsApp")).toBeNull();
      unmount();

      render(<GroupInvite />);
      act(() => vi.advanceTimersByTime(GROUP_INVITE_DELAY_MS * 2));
      expect(screen.queryByLabelText("Convite para o grupo do WhatsApp")).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
