import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useProductStore } from "./productStore";
import { Product } from "@/types";

// Mock firebase/firestore
vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  getDocs: vi.fn(),
}));

// Mock @/store/kitStore
vi.mock("@/store/kitStore", () => ({
  useKitStore: {
    getState: vi.fn(() => ({ recipes: [] })),
  },
}));

// Helper to create mock Product objects
const makeProduct = (overrides: Partial<Product> = {}): Product => ({
  id: "prod-1",
  name: "Test Product",
  price: 100,
  type: "STANDARD_ITEM",
  category: "Test Category",
  unit: "un",
  inStock: true,
  disabled: false,
  ...overrides,
});

describe("useProductStore", () => {
  beforeEach(() => {
    useProductStore.setState({
      allProducts: [],
      ribbonProducts: [],
      assembledKits: [],
      displayProducts: [],
      isLoading: false,
      error: null,
      filterCategory: "ALL",
      sortOption: "name_asc",
      visibleCount: 12,
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    useProductStore.setState({
      allProducts: [],
      ribbonProducts: [],
      assembledKits: [],
      displayProducts: [],
      isLoading: false,
      error: null,
      filterCategory: "ALL",
      sortOption: "name_asc",
      visibleCount: 12,
    });
  });

  describe("Initial State", () => {
    it("should have empty allProducts array", () => {
      const { allProducts } = useProductStore.getState();
      expect(allProducts).toEqual([]);
    });

    it("should have empty displayProducts array", () => {
      const { displayProducts } = useProductStore.getState();
      expect(displayProducts).toEqual([]);
    });

    it("should have isLoading false", () => {
      const { isLoading } = useProductStore.getState();
      expect(isLoading).toBe(false);
    });

    it("should have filterCategory ALL", () => {
      const { filterCategory } = useProductStore.getState();
      expect(filterCategory).toBe("ALL");
    });

    it("should have sortOption name_asc", () => {
      const { sortOption } = useProductStore.getState();
      expect(sortOption).toBe("name_asc");
    });

    it("should have visibleCount 12", () => {
      const { visibleCount } = useProductStore.getState();
      expect(visibleCount).toBe(12);
    });
  });

  describe("getProductById", () => {
    it("should find product by id", () => {
      const product = makeProduct({ id: "prod-1", name: "Product 1" });
      useProductStore.setState({ allProducts: [product] });

      const { getProductById } = useProductStore.getState();
      const found = getProductById("prod-1");

      expect(found).toBeDefined();
      expect(found?.id).toBe("prod-1");
      expect(found?.name).toBe("Product 1");
    });

    it("should return undefined if product not found", () => {
      const product = makeProduct({ id: "prod-1" });
      useProductStore.setState({ allProducts: [product] });

      const { getProductById } = useProductStore.getState();
      const found = getProductById("unknown-id");

      expect(found).toBeUndefined();
    });

    it("should find correct product when multiple exist", () => {
      const products = [
        makeProduct({ id: "prod-1", name: "Product 1" }),
        makeProduct({ id: "prod-2", name: "Product 2" }),
        makeProduct({ id: "prod-3", name: "Product 3" }),
      ];
      useProductStore.setState({ allProducts: products });

      const { getProductById } = useProductStore.getState();
      const found = getProductById("prod-2");

      expect(found?.id).toBe("prod-2");
      expect(found?.name).toBe("Product 2");
    });
  });

  describe("setCategory", () => {
    it("should update filterCategory", () => {
      const products = [
        makeProduct({ id: "prod-1", category: "Electronics" }),
        makeProduct({ id: "prod-2", category: "Books" }),
      ];
      useProductStore.setState({ allProducts: products });

      const { setCategory } = useProductStore.getState();
      setCategory("Electronics");

      expect(useProductStore.getState().filterCategory).toBe("Electronics");
    });

    it("should reset visibleCount to 12 when setting category", () => {
      const { setCategory } = useProductStore.getState();
      useProductStore.setState({ visibleCount: 50 });

      setCategory("Test");

      expect(useProductStore.getState().visibleCount).toBe(12);
    });

    it("should trigger applyFilters when setting category", () => {
      const products = [
        makeProduct({ id: "prod-1", name: "Apple", category: "Fruits" }),
        makeProduct({ id: "prod-2", name: "Banana", category: "Fruits" }),
        makeProduct({ id: "prod-3", name: "Book", category: "Books" }),
      ];
      useProductStore.setState({ allProducts: products });

      const { setCategory } = useProductStore.getState();
      setCategory("Fruits");

      const { displayProducts } = useProductStore.getState();
      expect(displayProducts.length).toBe(2);
      expect(displayProducts.every((p) => p.category === "Fruits")).toBe(true);
    });
  });

  describe("setSort", () => {
    it("should update sortOption", () => {
      const { setSort } = useProductStore.getState();
      setSort("price_asc");

      expect(useProductStore.getState().sortOption).toBe("price_asc");
    });

    it("should apply sorting by name_asc", () => {
      const products = [
        makeProduct({ id: "prod-1", name: "Zebra", price: 100 }),
        makeProduct({ id: "prod-2", name: "Apple", price: 50 }),
        makeProduct({ id: "prod-3", name: "Mango", price: 75 }),
      ];
      useProductStore.setState({ allProducts: products });

      const { setSort } = useProductStore.getState();
      setSort("name_asc");

      const { displayProducts } = useProductStore.getState();
      expect(displayProducts[0].name).toBe("Apple");
      expect(displayProducts[1].name).toBe("Mango");
      expect(displayProducts[2].name).toBe("Zebra");
    });

    it("should apply sorting by price_asc", () => {
      const products = [
        makeProduct({ id: "prod-1", name: "Product A", price: 100 }),
        makeProduct({ id: "prod-2", name: "Product B", price: 50 }),
        makeProduct({ id: "prod-3", name: "Product C", price: 75 }),
      ];
      useProductStore.setState({ allProducts: products });

      const { setSort } = useProductStore.getState();
      setSort("price_asc");

      const { displayProducts } = useProductStore.getState();
      expect(displayProducts[0].price).toBe(50);
      expect(displayProducts[1].price).toBe(75);
      expect(displayProducts[2].price).toBe(100);
    });

    it("should apply sorting by price_desc", () => {
      const products = [
        makeProduct({ id: "prod-1", name: "Product A", price: 100 }),
        makeProduct({ id: "prod-2", name: "Product B", price: 50 }),
        makeProduct({ id: "prod-3", name: "Product C", price: 75 }),
      ];
      useProductStore.setState({ allProducts: products });

      const { setSort } = useProductStore.getState();
      setSort("price_desc");

      const { displayProducts } = useProductStore.getState();
      expect(displayProducts[0].price).toBe(100);
      expect(displayProducts[1].price).toBe(75);
      expect(displayProducts[2].price).toBe(50);
    });
  });

  describe("loadMore", () => {
    it("should increment visibleCount by 12", () => {
      const products = Array.from({ length: 50 }, (_, i) =>
        makeProduct({ id: `prod-${i}` })
      );
      useProductStore.setState({
        allProducts: products,
        filterCategory: "ALL",
      });

      const { loadMore } = useProductStore.getState();
      expect(useProductStore.getState().visibleCount).toBe(12);

      loadMore();

      expect(useProductStore.getState().visibleCount).toBe(24);
    });

    it("should not increment beyond total products", () => {
      const products = Array.from({ length: 20 }, (_, i) =>
        makeProduct({ id: `prod-${i}` })
      );
      useProductStore.setState({
        allProducts: products,
        visibleCount: 12,
      });

      const { loadMore } = useProductStore.getState();
      loadMore();

      // visibleCount becomes 24, but we only have 20 products
      // applyFilters should limit displayProducts to 20
      const { displayProducts } = useProductStore.getState();
      expect(displayProducts).toHaveLength(20);
    });

    it("should trigger applyFilters", () => {
      const products = Array.from({ length: 30 }, (_, i) =>
        makeProduct({ id: `prod-${i}`, name: `Product ${i}` })
      );
      useProductStore.setState({ allProducts: products, visibleCount: 12 });

      const { loadMore } = useProductStore.getState();
      const displayBefore = useProductStore.getState().displayProducts.length;

      loadMore();

      const displayAfter = useProductStore.getState().displayProducts.length;
      expect(displayAfter).toBeGreaterThan(displayBefore);
    });
  });

  describe("applyFilters", () => {
    it("should filter by category", () => {
      const products = [
        makeProduct({ id: "prod-1", category: "Electronics" }),
        makeProduct({ id: "prod-2", category: "Books" }),
        makeProduct({ id: "prod-3", category: "Electronics" }),
      ];
      useProductStore.setState({
        allProducts: products,
        filterCategory: "Electronics",
      });

      const { applyFilters } = useProductStore.getState();
      applyFilters();

      const { displayProducts } = useProductStore.getState();
      expect(displayProducts).toHaveLength(2);
      expect(displayProducts.every((p) => p.category === "Electronics")).toBe(true);
    });

    it("should show all products when filterCategory is ALL", () => {
      const products = [
        makeProduct({ id: "prod-1", category: "Electronics" }),
        makeProduct({ id: "prod-2", category: "Books" }),
        makeProduct({ id: "prod-3", category: "Electronics" }),
      ];
      useProductStore.setState({
        allProducts: products,
        filterCategory: "ALL",
      });

      const { applyFilters } = useProductStore.getState();
      applyFilters();

      const { displayProducts } = useProductStore.getState();
      expect(displayProducts).toHaveLength(3);
    });

    it("should sort by name_asc", () => {
      const products = [
        makeProduct({ id: "prod-1", name: "Zebra" }),
        makeProduct({ id: "prod-2", name: "Apple" }),
        makeProduct({ id: "prod-3", name: "Mango" }),
      ];
      useProductStore.setState({
        allProducts: products,
        sortOption: "name_asc",
      });

      const { applyFilters } = useProductStore.getState();
      applyFilters();

      const { displayProducts } = useProductStore.getState();
      expect(displayProducts[0].name).toBe("Apple");
      expect(displayProducts[1].name).toBe("Mango");
      expect(displayProducts[2].name).toBe("Zebra");
    });

    it("should sort by price_asc", () => {
      const products = [
        makeProduct({ id: "prod-1", price: 100 }),
        makeProduct({ id: "prod-2", price: 50 }),
        makeProduct({ id: "prod-3", price: 75 }),
      ];
      useProductStore.setState({
        allProducts: products,
        filterCategory: "ALL",
        sortOption: "price_asc",
      });

      const { applyFilters } = useProductStore.getState();
      applyFilters();

      const { displayProducts } = useProductStore.getState();
      expect(displayProducts[0].price).toBe(50);
      expect(displayProducts[1].price).toBe(75);
      expect(displayProducts[2].price).toBe(100);
    });

    it("should sort by price_desc", () => {
      const products = [
        makeProduct({ id: "prod-1", price: 100 }),
        makeProduct({ id: "prod-2", price: 50 }),
        makeProduct({ id: "prod-3", price: 75 }),
      ];
      useProductStore.setState({
        allProducts: products,
        filterCategory: "ALL",
        sortOption: "price_desc",
      });

      const { applyFilters } = useProductStore.getState();
      applyFilters();

      const { displayProducts } = useProductStore.getState();
      expect(displayProducts[0].price).toBe(100);
      expect(displayProducts[1].price).toBe(75);
      expect(displayProducts[2].price).toBe(50);
    });

    it("should paginate based on visibleCount", () => {
      const products = Array.from({ length: 30 }, (_, i) =>
        makeProduct({ id: `prod-${i}` })
      );
      useProductStore.setState({
        allProducts: products,
        filterCategory: "ALL",
        visibleCount: 15,
      });

      const { applyFilters } = useProductStore.getState();
      applyFilters();

      const { displayProducts } = useProductStore.getState();
      expect(displayProducts).toHaveLength(15);
    });

    it("should combine category filter and sort", () => {
      const products = [
        makeProduct({ id: "prod-1", category: "Tech", name: "Zebra", price: 100 }),
        makeProduct({ id: "prod-2", category: "Books", name: "Apple", price: 50 }),
        makeProduct({ id: "prod-3", category: "Tech", name: "Computer", price: 75 }),
      ];
      useProductStore.setState({
        allProducts: products,
        filterCategory: "Tech",
        sortOption: "price_asc",
      });

      const { applyFilters } = useProductStore.getState();
      applyFilters();

      const { displayProducts } = useProductStore.getState();
      expect(displayProducts).toHaveLength(2);
      expect(displayProducts[0].price).toBe(75);
      expect(displayProducts[1].price).toBe(100);
    });
  });

  describe("Integration tests", () => {
    it("should handle complete user flow: category -> sort -> load more", () => {
      const products = Array.from({ length: 50 }, (_, i) => {
        const category = i % 2 === 0 ? "Electronics" : "Books";
        return makeProduct({
          id: `prod-${i}`,
          name: `Product ${String.fromCharCode(65 + (i % 26))}`,
          price: Math.random() * 1000,
          category,
        });
      });

      useProductStore.setState({ allProducts: products });

      // Step 1: Set category
      const { setCategory, setSort, loadMore } = useProductStore.getState();
      setCategory("Electronics");
      let display = useProductStore.getState().displayProducts;
      expect(display.every((p) => p.category === "Electronics")).toBe(true);
      expect(display.length).toBe(12);

      // Step 2: Set sort
      setSort("price_asc");
      display = useProductStore.getState().displayProducts;
      for (let i = 1; i < display.length; i++) {
        expect(display[i].price).toBeGreaterThanOrEqual(display[i - 1].price);
      }

      // Step 3: Load more
      loadMore();
      display = useProductStore.getState().displayProducts;
      expect(display.length).toBe(24);
      expect(display.every((p) => p.category === "Electronics")).toBe(true);
    });

    it("should maintain sort order after category change", () => {
      const products = [
        makeProduct({ id: "prod-1", category: "Tech", name: "Zebra", price: 100 }),
        makeProduct({ id: "prod-2", category: "Tech", name: "Apple", price: 50 }),
        makeProduct({ id: "prod-3", category: "Books", name: "Book", price: 75 }),
      ];
      useProductStore.setState({
        allProducts: products,
        sortOption: "name_asc",
      });

      const { setCategory } = useProductStore.getState();
      setCategory("Tech");

      const { displayProducts, sortOption } = useProductStore.getState();
      expect(displayProducts[0].name).toBe("Apple");
      expect(displayProducts[1].name).toBe("Zebra");
      expect(sortOption).toBe("name_asc");
    });
  });
});
