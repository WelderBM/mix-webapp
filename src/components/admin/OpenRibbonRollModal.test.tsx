// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { Product } from "@/types/product";

const { addDocMock } = vi.hoisted(() => ({ addDocMock: vi.fn(async () => ({ id: "novo" })) }));
vi.mock("@/lib/firebase", () => ({ db: {} }));
vi.mock("firebase/firestore", () => ({
  addDoc: addDocMock,
  collection: vi.fn(() => "products"),
  serverTimestamp: vi.fn(() => "TS"),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { OpenRibbonRollModal } from "./OpenRibbonRollModal";

const roll = {
  id: "rolo1",
  name: "Maxi 32mm Vermelho",
  type: "RIBBON",
  category: "Fitas",
  unit: "un",
  inStock: true,
  disabled: false,
  rollPrice: 45,
  ribbonInventory: { status: "FECHADO", remainingMeters: 50, totalRollMeters: 50 },
} as Product;

describe("OpenRibbonRollModal (#413)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("cria o p/ metro com nome e preço prontos, sem mexer no rolo", async () => {
    const onOpened = vi.fn();
    render(<OpenRibbonRollModal fita={roll} products={[roll]} onOpenChange={() => {}} onOpened={onOpened} />);
    expect((screen.getByLabelText("Nome na loja") as HTMLInputElement).value).toBe("Maxi 32mm Vermelho p/ metro");
    expect((screen.getByLabelText("Preço por Metro") as HTMLInputElement).value).toBe("0.9");
    fireEvent.click(screen.getByText("Confirmar abertura"));
    await waitFor(() => expect(addDocMock).toHaveBeenCalledTimes(1));
    const [, data] = addDocMock.mock.calls[0] as unknown as [unknown, Record<string, unknown>];
    expect(data).toMatchObject({ openedFromId: "rolo1", unit: "m", price: 0.9, name: "Maxi 32mm Vermelho p/ metro" });
    expect(onOpened).toHaveBeenCalled();
  });

  it("com um p/ metro ativo do mesmo rolo, avisa e não deixa abrir outro", () => {
    const aberto = {
      ...roll,
      id: "pm",
      name: "Maxi 32mm Vermelho p/ metro",
      openedFromId: "rolo1",
      ribbonInventory: { status: "ABERTO", remainingMeters: 12, totalRollMeters: 50 },
    } as Product;
    render(<OpenRibbonRollModal fita={roll} products={[roll, aberto]} onOpenChange={() => {}} onOpened={() => {}} />);
    expect(screen.getByRole("alert").textContent).toContain("12 m");
    expect((screen.getByText("Confirmar abertura").closest("button") as HTMLButtonElement).disabled).toBe(true);
  });
});
