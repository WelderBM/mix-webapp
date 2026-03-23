import { describe, it, expect } from "vitest";
import {
  cn,
  formatCurrency,
  hexToRgb,
  getContrastColor,
  adjustColor,
} from "@/lib/utils";

describe("Utils: cn", () => {
  it("should merge class strings", () => {
    const result = cn("px-2", "py-1");
    expect(result).toBe("px-2 py-1");
  });

  it("should handle conditional classes with objects", () => {
    const result = cn("px-2", { "py-1": true, "py-2": false });
    expect(result).toContain("px-2");
    expect(result).toContain("py-1");
    expect(result).not.toContain("py-2");
  });

  it("should handle undefined and null values", () => {
    const result = cn("px-2", undefined, null, "py-1");
    expect(result).toContain("px-2");
    expect(result).toContain("py-1");
  });

  it("should handle false values", () => {
    const result = cn("px-2", false, "py-1");
    expect(result).toContain("px-2");
    expect(result).toContain("py-1");
  });

  it("should merge tailwind classes correctly", () => {
    // Test that twMerge resolves conflicts (e.g., px-2 and px-4)
    const result = cn("px-2", "px-4");
    expect(result).toContain("px-4");
    expect(result).not.toContain("px-2");
  });
});

describe("Utils: formatCurrency", () => {
  it("should format number to BRL currency", () => {
    const result = formatCurrency(10.5);
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

  it("should handle negative numbers", () => {
    const result = formatCurrency(-50.25);
    expect(result).toContain("R$");
    expect(result).toContain("50,25");
  });
});

describe("Utils: hexToRgb", () => {
  it("should convert valid hex color to RGB string", () => {
    const result = hexToRgb("#ff0000");
    expect(result).toBe("255 0 0");
  });

  it("should convert hex without # symbol", () => {
    const result = hexToRgb("00ff00");
    expect(result).toBe("0 255 0");
  });

  it("should handle uppercase hex values", () => {
    const result = hexToRgb("#0000FF");
    expect(result).toBe("0 0 255");
  });

  it("should return '0 0 0' for invalid hex", () => {
    const result = hexToRgb("invalid");
    expect(result).toBe("0 0 0");
  });

  it("should return '0 0 0' for hex with wrong length", () => {
    const result = hexToRgb("#fff");
    expect(result).toBe("0 0 0");
  });
});

describe("Utils: getContrastColor", () => {
  it("should return white for dark colors", () => {
    const result = getContrastColor("#000000");
    expect(result).toBe("#ffffff");
  });

  it("should return black for light colors", () => {
    const result = getContrastColor("#ffffff");
    expect(result).toBe("#000000");
  });

  it("should return white for dark red", () => {
    const result = getContrastColor("#8b0000");
    expect(result).toBe("#ffffff");
  });

  it("should return black for light yellow", () => {
    const result = getContrastColor("#ffff00");
    expect(result).toBe("#000000");
  });
});

describe("Utils: adjustColor", () => {
  it("should lighten color with positive amount", () => {
    const result = adjustColor("#000000", 50);
    expect(result).toBe("#323232");
  });

  it("should darken color with negative amount", () => {
    const result = adjustColor("#ffffff", -50);
    expect(result).toBe("#cdcdcd");
  });

  it("should clamp values at 255 (max)", () => {
    const result = adjustColor("#ffffff", 100);
    expect(result).toBe("#ffffff");
  });

  it("should clamp values at 0 (min)", () => {
    const result = adjustColor("#000000", -100);
    expect(result).toBe("#000000");
  });

  it("should handle #000000 correctly", () => {
    const result = adjustColor("#000000", 0);
    expect(result).toBe("#000000");
  });

  it("should handle #ffffff correctly", () => {
    const result = adjustColor("#ffffff", 0);
    expect(result).toBe("#ffffff");
  });

  it("should work without # prefix", () => {
    const result = adjustColor("000000", 50);
    expect(result).toBe("#323232");
  });

  it("should handle mixed color adjustments", () => {
    // #7c3aed (purple) + 20
    const result = adjustColor("#7c3aed", 20);
    expect(result).toBe("#904eff");
  });
});
