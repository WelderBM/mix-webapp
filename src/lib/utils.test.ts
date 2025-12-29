import { describe, it, expect } from "vitest";
import { formatCurrency } from "@/lib/utils";

describe("Utils: formatCurrency", () => {
  it("should format number to BRL currency", () => {
    const result = formatCurrency(10.5);
    // Note: The specific output depends on the system locale, but usually contains "R$"
    expect(result).toContain("R$");
    expect(result).toContain("10,50");
  });

  it("should handle zero properly", () => {
    expect(formatCurrency(0)).toContain("0,00");
  });

  it("should handle large numbers", () => {
    const result = formatCurrency(1000);
    expect(result).toContain("1.000,00");
  });
});
