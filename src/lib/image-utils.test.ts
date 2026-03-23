import { describe, it, expect } from "vitest";
import { getDynamicPlaceholder, getProductImage } from "@/lib/image-utils";

describe("ImageUtils: getDynamicPlaceholder", () => {
  it("should use default text 'Sem Imagem' when no text provided", () => {
    const result = getDynamicPlaceholder();
    expect(result).toContain("text=Sem%20Imagem");
  });

  it("should use default size '400x400' when no size provided", () => {
    const result = getDynamicPlaceholder();
    expect(result).toContain("/400x400/");
  });

  it("should use custom text when provided", () => {
    const result = getDynamicPlaceholder("Custom Text");
    expect(result).toContain("text=Custom%20Text");
  });

  it("should use custom size when provided", () => {
    const result = getDynamicPlaceholder("Test", "600x600");
    expect(result).toContain("/600x600/");
  });

  it("should URL encode special characters in text", () => {
    const result = getDynamicPlaceholder("Fruit & Juice");
    expect(result).toContain("Fruit%20%26%20Juice");
  });

  it("should URL encode comma in text", () => {
    const result = getDynamicPlaceholder("Apple, Orange");
    expect(result).toContain("Apple%2C%20Orange");
  });

  it("should contain base colors in URL", () => {
    const result = getDynamicPlaceholder();
    expect(result).toContain("f1f5f9"); // light gray background
    expect(result).toContain("334155"); // dark gray text
  });

  it("should include .png extension", () => {
    const result = getDynamicPlaceholder();
    expect(result).toContain(".png");
  });

  it("should return HTTPS URL", () => {
    const result = getDynamicPlaceholder();
    expect(result).toMatch(/^https:\/\//);
  });
});

describe("ImageUtils: getProductImage", () => {
  it("should return imageUrl when it is valid", () => {
    const imageUrl = "https://example.com/product.jpg";
    const result = getProductImage(imageUrl);
    expect(result).toBe(imageUrl);
  });

  it("should fall back to placeholder when imageUrl is null", () => {
    const result = getProductImage(null, "Test Product");
    expect(result).toContain("text=Test%20Product");
  });

  it("should fall back to placeholder when imageUrl is undefined", () => {
    const result = getProductImage(undefined, "Test Product");
    expect(result).toContain("text=Test%20Product");
  });

  it("should fall back to placeholder when imageUrl is empty string", () => {
    const result = getProductImage("", "Test Product");
    expect(result).toContain("text=Test%20Product");
  });

  it("should fall back to placeholder when imageUrl is whitespace only", () => {
    const result = getProductImage("   ", "Test Product");
    expect(result).toContain("text=Test%20Product");
  });

  it("should use default name 'Sem imagem' when no name provided", () => {
    const result = getProductImage(null);
    expect(result).toContain("text=Sem%20imagem");
  });

  it("should use custom name in placeholder", () => {
    const result = getProductImage(null, "Custom Product Name");
    expect(result).toContain("text=Custom%20Product%20Name");
  });

  it("should not trim valid URLs", () => {
    const imageUrl = "https://example.com/image.jpg";
    const result = getProductImage(imageUrl, "Product");
    expect(result).toBe(imageUrl);
  });

  it("should handle Firebase storage URLs", () => {
    const firebaseUrl =
      "https://firebasestorage.googleapis.com/v0/b/bucket/o/file.jpg";
    const result = getProductImage(firebaseUrl);
    expect(result).toBe(firebaseUrl);
  });
});
