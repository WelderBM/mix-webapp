// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

const { getDocMock } = vi.hoisted(() => ({ getDocMock: vi.fn() }));
vi.mock("@/lib/firebase", () => ({ db: {} }));
vi.mock("firebase/firestore", () => ({ doc: vi.fn(), getDoc: getDocMock }));

import { NoturnoImportBanner } from "./NoturnoImportBanner";

const DAY = 24 * 60 * 60 * 1000;
const snap = (data: unknown) => ({ data: () => data });

describe("NoturnoImportBanner (#416)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("nunca importado: mostra o aviso e o link para importar", async () => {
    getDocMock.mockResolvedValue(snap(undefined));
    render(<NoturnoImportBanner />);
    expect(await screen.findByText("Hora de atualizar o estoque")).toBeTruthy();
    expect(screen.getByText(/ainda não foi importado/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Importar agora" }).getAttribute("href")).toBe(
      "/admin/lancamento/importar"
    );
  });

  it("importado dentro do período: não mostra nada", async () => {
    getDocMock.mockResolvedValue(snap({ lastImportedAt: { seconds: (Date.now() - DAY / 2) / 1000 } }));
    const { container } = render(<NoturnoImportBanner periodDays={2} />);
    await waitFor(() => expect(getDocMock).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 0));
    expect(container.textContent).toBe("");
  });

  it("vencido: diz há quantos dias foi a última importação", async () => {
    getDocMock.mockResolvedValue(snap({ lastImportedAt: { seconds: (Date.now() - 3 * DAY - 1000) / 1000 } }));
    render(<NoturnoImportBanner periodDays={2} />);
    expect(await screen.findByText(/há 3 dias/)).toBeTruthy();
  });

  it("leitura falhou: não mostra aviso falso", async () => {
    getDocMock.mockImplementation(async () => {
      throw new Error("sem rede");
    });
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { container } = render(<NoturnoImportBanner />);
    await waitFor(() => expect(getDocMock).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 0));
    expect(container.textContent).toBe("");
  });
});
