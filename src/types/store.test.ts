import { describe, it, expect } from "vitest";
import { getModelSizeIds, BowModel } from "./store";

function makeModel(overrides: Partial<BowModel> = {}): BowModel {
  return {
    id: "bola",
    name: "Bola",
    subtitle: "Clássico",
    imageUrl: "",
    ...overrides,
  };
}

describe("getModelSizeIds (#144)", () => {
  it("returns sizeIds when present, ignoring the legacy sizeId", () => {
    const model = makeModel({ sizeIds: ["P", "M"], sizeId: "G" });
    expect(getModelSizeIds(model)).toEqual(["P", "M"]);
  });

  it("falls back to a single-item list from the legacy sizeId when sizeIds is absent", () => {
    const model = makeModel({ sizeId: "P" });
    expect(getModelSizeIds(model)).toEqual(["P"]);
  });

  it("returns an empty array when neither sizeIds nor sizeId is set", () => {
    const model = makeModel();
    expect(getModelSizeIds(model)).toEqual([]);
  });

  it("returns an empty array when sizeIds is explicitly empty, even with a legacy sizeId present", () => {
    const model = makeModel({ sizeIds: [], sizeId: "P" });
    expect(getModelSizeIds(model)).toEqual([]);
  });
});
