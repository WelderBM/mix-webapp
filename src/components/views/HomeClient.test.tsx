// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderToString } from "react-dom/server";
import { render, screen } from "@testing-library/react";
import HomeClient from "./HomeClient";
import { useSettingsStore } from "@/store/settingsStore";
import type { StoreSettings } from "@/types";

vi.mock("@/lib/firebase", () => ({ db: {} }));
vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
}));
vi.mock("@/components/layout/StoreHeader", () => ({ StoreHeader: () => null }));
vi.mock("@/components/sections/SectionRenderer", () => ({
  SectionRenderer: ({ section }: { section: { title: string } }) => (
    <section>{section.title}</section>
  ),
}));

const real = {
  id: "general",
  homeSections: [
    { id: "a", type: "product_shelf", title: "Fitas para seu laço", isActive: true, width: "full" },
    { id: "b", type: "banner_balloon", title: "Banner desligado", isActive: false, width: "full" },
  ],
} as unknown as StoreSettings;

describe("HomeClient — HTML do servidor (vitrine vazia)", () => {
  beforeEach(() => {
    // Estado de quem acabou de abrir o site: store ainda com o padrão.
    useSettingsStore.setState(useSettingsStore.getInitialState(), true);
  });

  it("usa as configurações do servidor enquanto a store não carregou", () => {
    const html = renderToString(
      <HomeClient initialProducts={[]} initialSettings={real} initialRecipes={[]} />
    );
    expect(html).toContain("Fitas para seu laço");
    expect(html).not.toContain("Banner desligado");
    expect(html).not.toContain("Estamos arrumando a vitrine");
  });

  it("sem seção ativa, leva o cliente para as páginas da loja (sem falar de admin)", () => {
    const html = renderToString(
      <HomeClient
        initialProducts={[]}
        initialSettings={{ id: "general", homeSections: [] } as unknown as StoreSettings}
        initialRecipes={[]}
      />
    );
    expect(html).toContain("Estamos arrumando a vitrine");
    expect(html).toContain('href="/fitas"');
    expect(html).not.toContain("Admin");
  });

  it("leitura do servidor falhou: não mostra aviso enquanto o navegador busca", () => {
    const html = renderToString(
      <HomeClient
        initialProducts={[]}
        initialSettings={{} as StoreSettings}
        initialRecipes={[]}
      />
    );
    expect(html).not.toContain("Estamos arrumando a vitrine");
  });

  it("no navegador, depois de montar, continua mostrando as seções reais", () => {
    render(<HomeClient initialProducts={[]} initialSettings={real} initialRecipes={[]} />);
    expect(screen.getByText("Fitas para seu laço")).toBeTruthy();
    expect(screen.queryByText("Estamos arrumando a vitrine.")).toBeNull();
  });
});
