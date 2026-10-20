// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { SectionsTab } from "./SectionsTab";
import type { StoreSettings, StoreSection, Category, Tag } from "@/types";

function makeSection(overrides: Partial<StoreSection> = {}): StoreSection {
  return {
    id: overrides.id ?? "sec-1",
    title: overrides.title ?? "Vitrine 1",
    type: "product_shelf",
    width: "full",
    source: { mode: "manual", productIds: [] },
    isActive: true,
    ...overrides,
  };
}

function makeSettings(homeSections: StoreSection[]): StoreSettings {
  return {
    id: "general",
    storeName: "Mix Novidades",
    whatsappNumber: "5595991136427",
    theme: { primaryColor: "#000" },
    categoryOrder: [],
    homeSections,
  } as unknown as StoreSettings;
}

const categories: Category[] = [];
const tags: Tag[] = [];

// SectionsTab é controlado (settings/setSettings vêm do pai, admin/page.tsx).
// O Harness reproduz esse contrato: dono do estado é o próprio teste, como
// já é feito em BalloonsTab.test.tsx.
function Harness({ initial }: { initial: StoreSettings }) {
  const [settings, setSettings] = useState(initial);
  return (
    <SectionsTab
      settings={settings}
      setSettings={setSettings}
      allProducts={[]}
      uniqueCategories={[]}
      categories={categories}
      tags={tags}
    />
  );
}

describe("SectionsTab", () => {
  describe("exclusão de vitrine", () => {
    it("não remove a seção ao clicar na lixeira — só abre a confirmação", () => {
      const sections = [makeSection({ id: "sec-1", title: "Vitrine A" })];
      render(<Harness initial={makeSettings(sections)} />);

      const trashButtons = screen
        .getAllByRole("button")
        .filter((b) => b.querySelector("svg.lucide-trash2"));
      fireEvent.click(trashButtons[0]);

      // A seção continua na lista — exclusão não é imediata.
      expect(screen.getByText("Vitrine A")).toBeInTheDocument();
      // O ConfirmDialog abriu com o título da seção.
      expect(
        screen.getByText(/Apagar a seção "Vitrine A"\?/)
      ).toBeInTheDocument();
    });

    it("remove a seção do array homeSections ao confirmar", () => {
      const sections = [
        makeSection({ id: "sec-1", title: "Vitrine A" }),
        makeSection({ id: "sec-2", title: "Vitrine B" }),
      ];
      render(<Harness initial={makeSettings(sections)} />);

      const trashButtons = screen
        .getAllByRole("button")
        .filter((b) => b.querySelector("svg.lucide-trash2"));
      fireEvent.click(trashButtons[0]);

      fireEvent.click(screen.getByRole("button", { name: "Apagar" }));

      expect(screen.queryByText("Vitrine A")).not.toBeInTheDocument();
      expect(screen.getByText("Vitrine B")).toBeInTheDocument();
    });

    it("mantém a seção intacta ao cancelar a confirmação", () => {
      const sections = [makeSection({ id: "sec-1", title: "Vitrine A" })];
      render(<Harness initial={makeSettings(sections)} />);

      const trashButtons = screen
        .getAllByRole("button")
        .filter((b) => b.querySelector("svg.lucide-trash2"));
      fireEvent.click(trashButtons[0]);
      fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

      expect(screen.getByText("Vitrine A")).toBeInTheDocument();
      expect(
        screen.queryByText(/Apagar a seção/)
      ).not.toBeInTheDocument();
    });
  });

  describe("renomear vitrine", () => {
    it("persiste o novo título ao salvar o modal", () => {
      const sections = [makeSection({ id: "sec-1", title: "Vitrine A" })];
      render(<Harness initial={makeSettings(sections)} />);

      const editButtons = screen
        .getAllByRole("button")
        .filter((b) => b.querySelector("svg.lucide-pencil"));
      fireEvent.click(editButtons[0]);

      const titleInput = screen.getByDisplayValue("Vitrine A");
      fireEvent.change(titleInput, {
        target: { value: "Vitrine Renomeada" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Salvar Seção" }));

      expect(screen.getByText("Vitrine Renomeada")).toBeInTheDocument();
      expect(screen.queryByText("Vitrine A")).not.toBeInTheDocument();
    });
  });

  describe("reordenar vitrines", () => {
    it("troca a posição ao clicar em 'mover para baixo' na primeira seção", () => {
      const sections = [
        makeSection({ id: "sec-1", title: "Primeira" }),
        makeSection({ id: "sec-2", title: "Segunda" }),
      ];
      render(<Harness initial={makeSettings(sections)} />);

      fireEvent.click(
        screen.getAllByRole("button", { name: "Mover seção para baixo" })[0]
      );

      const titles = screen
        .getAllByRole("heading", { level: 3 })
        .map((h) => h.textContent);
      expect(titles).toEqual(["Segunda", "Primeira"]);
    });

    it("desabilita 'mover para cima' na primeira posição e 'mover para baixo' na última", () => {
      const sections = [
        makeSection({ id: "sec-1", title: "Primeira" }),
        makeSection({ id: "sec-2", title: "Segunda" }),
      ];
      render(<Harness initial={makeSettings(sections)} />);

      const upButtons = screen.getAllByRole("button", {
        name: "Mover seção para cima",
      });
      const downButtons = screen.getAllByRole("button", {
        name: "Mover seção para baixo",
      });

      expect(upButtons[0]).toBeDisabled();
      expect(downButtons[downButtons.length - 1]).toBeDisabled();
      expect(downButtons[0]).not.toBeDisabled();
      expect(upButtons[upButtons.length - 1]).not.toBeDisabled();
    });
  });

  describe("alternar visibilidade (regressão)", () => {
    it("continua alternando isActive sem exigir confirmação", () => {
      const sections = [
        makeSection({ id: "sec-1", title: "Vitrine A", isActive: true }),
      ];
      render(<Harness initial={makeSettings(sections)} />);

      expect(screen.queryByText("Inativo")).not.toBeInTheDocument();

      fireEvent.click(
        screen.getByRole("button", { name: "Alternar Visibilidade" })
      );

      // Sem diálogo de confirmação envolvido — o badge muda na hora.
      expect(screen.getByText("Inativo")).toBeInTheDocument();
    });
  });
});
