import { describe, it, expect } from "vitest";
import { fitWithin } from "./compressImage";

describe("fitWithin", () => {
  it("reduz o lado maior para 1200 mantendo a proporção", () => {
    expect(fitWithin(4000, 3000)).toEqual({ width: 1200, height: 900 });
    expect(fitWithin(3000, 4000)).toEqual({ width: 900, height: 1200 });
  });

  it("nunca amplia foto pequena", () => {
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
  });
});
