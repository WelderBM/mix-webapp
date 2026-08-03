// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Tabs } from "@/components/ui/tabs";
import { AdminNav } from "./AdminNav";

// A navegação de nível 2 (TabsTrigger) depende do contexto de um <Tabs>
// Radix ancestral — sem ele o clique não teria pra onde propagar o estado
// de aba. Helper renderiza AdminNav sempre dentro desse contexto, como o
// AdminPageContent real faz (issue #76).
function renderNav({
  viewMode = "orders" as "orders" | "inventory",
  inventoryTab = "products",
  onViewModeChange = vi.fn(),
  onInventoryTabChange = vi.fn(),
} = {}) {
  render(
    <Tabs value={inventoryTab} onValueChange={onInventoryTabChange}>
      <AdminNav viewMode={viewMode} onViewModeChange={onViewModeChange} />
    </Tabs>
  );
  return { onViewModeChange, onInventoryTabChange };
}

describe("AdminNav — issue #76 (navegação unificada, sem duas fileiras de pílulas)", () => {
  it("sempre renderiza os dois itens de nível 1 (Pedidos / Gerenciar Estoque)", () => {
    renderNav({ viewMode: "orders" });
    expect(screen.getByRole("button", { name: /pedidos/i })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /gerenciar estoque/i })
    ).toBeTruthy();
  });

  it("não renderiza os itens de nível 2 quando viewMode é 'orders'", () => {
    renderNav({ viewMode: "orders" });
    expect(screen.queryByText("Produtos")).toBeNull();
    expect(screen.queryByText("Vitrine")).toBeNull();
    expect(screen.queryByText("Balões")).toBeNull();
    expect(screen.queryByText("Fitas")).toBeNull();
    expect(screen.queryByText("Configurações")).toBeNull();
  });

  it("renderiza os cinco itens de nível 2 quando viewMode é 'inventory'", () => {
    renderNav({ viewMode: "inventory" });
    expect(screen.getByText("Produtos")).toBeTruthy();
    expect(screen.getByText("Vitrine")).toBeTruthy();
    expect(screen.getByText("Balões")).toBeTruthy();
    expect(screen.getByText("Fitas")).toBeTruthy();
    expect(screen.getByText("Configurações")).toBeTruthy();
  });

  it("clicar em 'Pedidos' chama onViewModeChange('orders')", () => {
    const { onViewModeChange } = renderNav({ viewMode: "inventory" });
    fireEvent.click(screen.getByRole("button", { name: /pedidos/i }));
    expect(onViewModeChange).toHaveBeenCalledWith("orders");
  });

  it("clicar em 'Gerenciar Estoque' chama onViewModeChange('inventory')", () => {
    const { onViewModeChange } = renderNav({ viewMode: "orders" });
    fireEvent.click(
      screen.getByRole("button", { name: /gerenciar estoque/i })
    );
    expect(onViewModeChange).toHaveBeenCalledWith("inventory");
  });

  it("clicar num item de nível 2 dispara onValueChange do Tabs ancestral com o value certo", () => {
    const onInventoryTabChange = vi.fn();
    renderNav({ viewMode: "inventory", inventoryTab: "products", onInventoryTabChange });
    // Radix TabsTrigger seleciona no mousedown (não no click) — ver
    // node_modules/@radix-ui/react-tabs, TabsTrigger's onMouseDown.
    fireEvent.mouseDown(screen.getByRole("tab", { name: /fitas/i }), {
      button: 0,
    });
    expect(onInventoryTabChange).toHaveBeenCalledWith("ribbons");
  });

  it("marca o item de nível 1 ativo via aria-current='page'", () => {
    renderNav({ viewMode: "inventory" });
    expect(
      screen.getByRole("button", { name: /gerenciar estoque/i }).getAttribute(
        "aria-current"
      )
    ).toBe("page");
    expect(
      screen.getByRole("button", { name: /pedidos/i }).getAttribute(
        "aria-current"
      )
    ).toBeNull();
  });

  it("marca o item de nível 2 ativo via data-state='active' (Radix)", () => {
    renderNav({ viewMode: "inventory", inventoryTab: "balloons" });
    expect(screen.getByText("Balões").closest("button")?.getAttribute("data-state")).toBe(
      "active"
    );
    expect(screen.getByText("Fitas").closest("button")?.getAttribute("data-state")).toBe(
      "inactive"
    );
  });
});
