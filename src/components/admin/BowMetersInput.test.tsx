// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { BowMetersInput, parseMeters } from "./BowMetersInput";

function Harness({ onValue }: { onValue: (m: number | undefined) => void }) {
  const [m, setM] = useState<number | undefined>(undefined);
  return (
    <BowMetersInput
      meters={m}
      label="Metros"
      onChange={(v) => {
        setM(v);
        onValue(v);
      }}
    />
  );
}

describe("BowMetersInput (revisão do #437)", () => {
  it("dá para digitar 0,5 na ordem natural", () => {
    const onValue = vi.fn();
    render(<Harness onValue={onValue} />);
    const input = screen.getByLabelText("Metros") as HTMLInputElement;
    for (const t of ["0", "0,", "0,5"]) fireEvent.change(input, { target: { value: t } });
    expect(input.value).toBe("0,5");
    expect(onValue).toHaveBeenLastCalledWith(0.5);
  });

  it("vazio ou zero vira sem metragem", () => {
    expect(parseMeters("")).toBeUndefined();
    expect(parseMeters("0")).toBeUndefined();
    expect(parseMeters("1.25")).toBe(1.25);
  });
});
