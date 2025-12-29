import { describe, it, expect, beforeEach, vi } from "vitest";
import { useCartStore } from "./cartStore";

// Mock toast to avoid errors during tests
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe("useCartStore", () => {
  // Reset store before each test
  beforeEach(() => {
    useCartStore.setState({ items: [], isCartOpen: false });
  });

  it("should start with an empty cart", () => {
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(0);
  });

  it("should add a simple item to the cart", () => {
    const { addItem } = useCartStore.getState();
    const item = {
      cartId: "1",
      type: "SIMPLE",
      quantity: 1,
      product: {
        id: "p1",
        name: "Product 1",
        price: 100,
        type: "SIMPLE",
      },
    };

    addItem(item as any);

    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject(item);
  });

  it("should increment quantity if adding existing simple item", () => {
    const { addItem } = useCartStore.getState();
    const item = {
      cartId: "1", // cartId might change in implementation but logic usually checks product id
      type: "SIMPLE",
      quantity: 1,
      product: { id: "p1", name: "Product 1", price: 100, type: "SIMPLE" },
    };

    addItem({ ...item, cartId: "1" } as any);
    addItem({ ...item, cartId: "2" } as any); // Different cartId but same product

    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(2);
  });

  it("should remove an item", () => {
    const { addItem, removeItem } = useCartStore.getState();
    const item = {
      cartId: "1",
      type: "SIMPLE",
      quantity: 1,
      product: { id: "p1", name: "P1", price: 10, type: "SIMPLE" },
    };

    addItem(item as any);
    removeItem("1");

    const { items } = useCartStore.getState();
    expect(items).toHaveLength(0);
  });

  it("should update quantity", () => {
    const { addItem, updateQuantity } = useCartStore.getState();
    const item = {
      cartId: "1",
      type: "SIMPLE",
      quantity: 1,
      product: { id: "p1", name: "P1", price: 10, type: "SIMPLE" },
    };

    addItem(item as any);
    updateQuantity("1", 5);

    const { items } = useCartStore.getState();
    expect(items[0].quantity).toBe(5);
  });

  it("should remove item if quantity updated to 0", () => {
    const { addItem, updateQuantity } = useCartStore.getState();
    const item = {
      cartId: "1",
      type: "SIMPLE",
      quantity: 1,
      product: { id: "p1", name: "P1", price: 10, type: "SIMPLE" },
    };

    addItem(item as any);
    updateQuantity("1", 0);

    const { items } = useCartStore.getState();
    expect(items).toHaveLength(0);
  });

  it("should clear cart", () => {
    const { addItem, clearCart } = useCartStore.getState();
    addItem({
      cartId: "1",
      type: "SIMPLE",
      quantity: 1,
      product: { id: "p1", price: 10 },
    } as any);
    clearCart();
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(0);
  });

  it("should calculate total price correctly for simple items", () => {
    const { addItem, getCartTotal } = useCartStore.getState();
    addItem({
      cartId: "1",
      type: "SIMPLE",
      quantity: 2,
      product: { id: "p1", price: 50, type: "SIMPLE" },
    } as any);

    const total = getCartTotal();
    expect(total).toBe(100);
  });

  it("should calculate total price correctly for custom balloon items", () => {
    const { addItem, getCartTotal } = useCartStore.getState();
    addItem({
      cartId: "2",
      type: "CUSTOM_BALLOON",
      quantity: 3,
      kitTotalAmount: 20, // Unit price for custom items logic in store
      product: { id: "b1", name: "Balloon", price: 0 }, // Price usually in kitTotalAmount for custom
    } as any);

    const total = getCartTotal();
    expect(total).toBe(60); // 3 * 20
  });
});
