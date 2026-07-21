// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { useState, useEffect } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { BalloonsTab } from "./BalloonsTab";
import type { BalloonConfig } from "@/types/balloon";
import { toast } from "sonner";

function makeConfig(): BalloonConfig {
  return {
    allColors: [],
    types: [
      {
        id: "t1",
        name: "Tipo A",
        sizes: [{ size: "9", price: 10, unitsPerPackage: 50 }],
        colors: ["Azul"],
      },
      {
        id: "t2",
        name: "Tipo B",
        sizes: [{ size: "12", price: 20, unitsPerPackage: 25 }],
        colors: ["Verde"],
      },
      {
        id: "t3",
        name: "Tipo C",
        sizes: [{ size: "16", price: 30, unitsPerPackage: 10 }],
        colors: ["Vermelho"],
      },
    ],
  };
}

// Reproduz o formato real de uso: BalloonsTab é controlado, o "dono" do
// estado é o pai (admin/page.tsx via ConfigTab). Aqui o Harness faz esse
// papel e expõe botões que simulam uma mudança externa concorrente
// (equivalente a um onSnapshot do Firestore reordenando/removendo um tipo)
// enquanto o ConfirmDialog do BalloonsTab está aberto.
function Harness({
  initial,
  onChange,
}: {
  initial: BalloonConfig;
  onChange: (config: BalloonConfig) => void;
}) {
  const [config, setConfig] = useState(initial);

  useEffect(() => {
    onChange(config);
  }, [config, onChange]);

  return (
    <>
      <button
        onClick={() =>
          setConfig((prev) => ({ ...prev, types: [...prev.types].reverse() }))
        }
      >
        simular-reorder-externo
      </button>
      <button
        onClick={() =>
          setConfig((prev) => ({
            ...prev,
            types: prev.types.filter((t) => t.id !== "t1"),
          }))
        }
      >
        simular-remocao-t1
      </button>
      <BalloonsTab balloonConfig={config} setBalloonConfig={setConfig} />
    </>
  );
}

function openSizesSyncDialogFor(typeName: string) {
  fireEvent.click(screen.getByRole("button", { name: /edição/i }));
  fireEvent.click(screen.getByRole("button", { name: new RegExp(typeName, "i") }));
  fireEvent.click(
    screen.getByTitle("Aplicar estes tamanhos a todos os outros modelos")
  );
}

describe("BalloonsTab — condição de corrida no sync-to-all (achado do PR #48)", () => {
  it("resolve a origem por id, não pelo índice congelado no clique, quando a lista reordena com o modal aberto", () => {
    const onChange = vi.fn();
    const initial = makeConfig();
    render(<Harness initial={initial} onChange={onChange} />);

    openSizesSyncDialogFor("Tipo A");

    // Enquanto o ConfirmDialog está aberto, uma mudança externa (onSnapshot
    // concorrente) reordena a lista — Tipo A deixa de estar no índice 0.
    fireEvent.click(screen.getByText("simular-reorder-externo"));

    fireEvent.click(screen.getByRole("button", { name: /Substituir/i }));

    const finalConfig = onChange.mock.calls.at(-1)![0] as BalloonConfig;
    for (const type of finalConfig.types) {
      expect(type.sizes).toEqual(initial.types[0].sizes); // sizes do Tipo A, não do que ocupa o índice 0 agora
    }
  });

  it("vira no-op com toast de erro, sem alterar o estado, se o tipo de origem for removido com o modal aberto", () => {
    const onChange = vi.fn();
    const initial = makeConfig();
    render(<Harness initial={initial} onChange={onChange} />);

    openSizesSyncDialogFor("Tipo A");

    // Tipo A (origem capturada) é removido enquanto o modal segue aberto.
    fireEvent.click(screen.getByText("simular-remocao-t1"));
    const configAntesDoConfirm = onChange.mock.calls.at(-1)![0] as BalloonConfig;

    fireEvent.click(screen.getByRole("button", { name: /Substituir/i }));

    expect(toast.error).toHaveBeenCalled();
    const configDepoisDoConfirm = onChange.mock.calls.at(-1)![0] as BalloonConfig;
    expect(configDepoisDoConfirm).toEqual(configAntesDoConfirm);
  });
});
