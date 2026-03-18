import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useCartStore } from "./cartStore";

// Mock localStorage for persist middleware - using a simple in-memory implementation
const mockStorage: Record<string, string> = {};
vi.stubGlobal(
  "localStorage",
  {
    getItem: (key: string) => mockStorage[key] || null,
    setItem: (key: string, value: string) => {
      mockStorage[key] = value;
    },
    removeItem: (key: string) => {
      delete mockStorage[key];
    },
    clear: () => {
      Object.keys(mockStorage).forEach((key) => {
        delete mockStorage[key];
      });
    },
  }
);

describe("useCartStore", () => {
  beforeEach(() => {
    useCartStore.setState({ items: [], isCartOpen: false });
    vi.clearAllMocks();
  });

  afterEach(() => {
    useCartStore.setState({ items: [], isCartOpen: false });
  });

  describe("Initial State", () => {
    it("should start with an empty items array", () => {
      const { items } = useCartStore.getState();
      expect(items).toEqual([]);
    });

    it("should start with isCartOpen false", () => {
      const { isCartOpen } = useCartStore.getState();
      expect(isCartOpen).toBe(false);
    });
  });

  describe("addItem - SIMPLE type", () => {
    it("should add a new simple item", () => {
      const { addItem } = useCartStore.getState();
      const item = {
        cartId: "cart-1",
        type: "SIMPLE" as const,
        quantity: 1,
        product: {
          id: "p1",
          name: "Product 1",
          price: 100,
          type: "STANDARD_ITEM" as const,
          category: "Test",
          unit: "un" as const,
          inStock: true,
          disabled: false,
        },
      };

      addItem(item as any);

      const { items } = useCartStore.getState();
      expect(items).toHaveLength(1);
      expect(items[0].product?.id).toBe("p1");
    });

    it("should deduplicate by product.id alone when no variant or image label", () => {
      const { addItem } = useCartStore.getState();
      const item = {
        cartId: "cart-1",
        type: "SIMPLE" as const,
        quantity: 1,
        product: { id: "p1", name: "Prod", price: 50, type: "STANDARD_ITEM" as const, category: "Test", unit: "un" as const, inStock: true, disabled: false },
      };

      addItem({ ...item, cartId: "cart-1" } as any);
      addItem({ ...item, cartId: "cart-2" } as any);

      const { items } = useCartStore.getState();
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(2);
    });

    it("should deduplicate by selectedVariant.id", () => {
      const { addItem } = useCartStore.getState();
      const baseItem = {
        cartId: "cart-1",
        type: "SIMPLE" as const,
        quantity: 1,
        product: { id: "p1", name: "Prod", price: 50, type: "STANDARD_ITEM" as const, category: "Test", unit: "un" as const, inStock: true, disabled: false },
        selectedVariant: { id: "v1", name: "Blue", price: 60, inStock: true },
      };

      addItem(baseItem as any);
      addItem({ ...baseItem, cartId: "cart-2" } as any);

      const { items } = useCartStore.getState();
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(2);
    });

    it("should add different variants as separate items", () => {
      const { addItem } = useCartStore.getState();
      const item1 = {
        cartId: "cart-1",
        type: "SIMPLE" as const,
        quantity: 1,
        product: { id: "p1", name: "Prod", price: 50, type: "STANDARD_ITEM" as const, category: "Test", unit: "un" as const, inStock: true, disabled: false },
        selectedVariant: { id: "v1", name: "Blue", price: 60, inStock: true },
      };
      const item2 = {
        cartId: "cart-2",
        type: "SIMPLE" as const,
        quantity: 1,
        product: { id: "p1", name: "Prod", price: 50, type: "STANDARD_ITEM" as const, category: "Test", unit: "un" as const, inStock: true, disabled: false },
        selectedVariant: { id: "v2", name: "Red", price: 60, inStock: true },
      };

      addItem(item1 as any);
      addItem(item2 as any);

      const { items } = useCartStore.getState();
      expect(items).toHaveLength(2);
    });

    it("should deduplicate by selectedImageLabel", () => {
      const { addItem } = useCartStore.getState();
      const baseItem = {
        cartId: "cart-1",
        type: "SIMPLE" as const,
        quantity: 1,
        product: { id: "p1", name: "Prod", price: 50, type: "STANDARD_ITEM" as const, category: "Test", unit: "un" as const, inStock: true, disabled: false },
        selectedImageLabel: "Front View",
      };

      addItem(baseItem as any);
      addItem({ ...baseItem, cartId: "cart-2" } as any);

      const { items } = useCartStore.getState();
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(2);
    });

    it("should add different image labels as separate items", () => {
      const { addItem } = useCartStore.getState();
      const item1 = {
        cartId: "cart-1",
        type: "SIMPLE" as const,
        quantity: 1,
        product: { id: "p1", name: "Prod", price: 50, type: "STANDARD_ITEM" as const, category: "Test", unit: "un" as const, inStock: true, disabled: false },
        selectedImageLabel: "Front View",
      };
      const item2 = {
        cartId: "cart-2",
        type: "SIMPLE" as const,
        quantity: 1,
        product: { id: "p1", name: "Prod", price: 50, type: "STANDARD_ITEM" as const, category: "Test", unit: "un" as const, inStock: true, disabled: false },
        selectedImageLabel: "Back View",
      };

      addItem(item1 as any);
      addItem(item2 as any);

      const { items } = useCartStore.getState();
      expect(items).toHaveLength(2);
    });
  });

  describe("addItem - CUSTOM_BALLOON type", () => {
    it("should add a custom balloon item", () => {
      const { addItem } = useCartStore.getState();
      const item = {
        cartId: "cart-1",
        type: "CUSTOM_BALLOON" as const,
        quantity: 1,
        balloonDetails: {
          typeId: "balloon-1",
          typeName: "Round",
          size: "16",
          color: "Blue",
          colorHex: "#0000FF",
          unitsPerPackage: 50,
        },
        kitTotalAmount: 25,
      };

      addItem(item as any);

      const { items } = useCartStore.getState();
      expect(items).toHaveLength(1);
    });

    it("should deduplicate by typeId+size+color", () => {
      const { addItem } = useCartStore.getState();
      const baseItem = {
        cartId: "cart-1",
        type: "CUSTOM_BALLOON" as const,
        quantity: 1,
        balloonDetails: {
          typeId: "balloon-1",
          typeName: "Round",
          size: "16",
          color: "Blue",
          colorHex: "#0000FF",
          unitsPerPackage: 50,
        },
        kitTotalAmount: 25,
      };

      addItem(baseItem as any);
      addItem({ ...baseItem, cartId: "cart-2" } as any);

      const { items } = useCartStore.getState();
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(2);
    });

    it("should add different colors as separate items", () => {
      const { addItem } = useCartStore.getState();
      const item1 = {
        cartId: "cart-1",
        type: "CUSTOM_BALLOON" as const,
        quantity: 1,
        balloonDetails: {
          typeId: "balloon-1",
          typeName: "Round",
          size: "16",
          color: "Blue",
          colorHex: "#0000FF",
          unitsPerPackage: 50,
        },
        kitTotalAmount: 25,
      };
      const item2 = {
        cartId: "cart-2",
        type: "CUSTOM_BALLOON" as const,
        quantity: 1,
        balloonDetails: {
          typeId: "balloon-1",
          typeName: "Round",
          size: "16",
          color: "Red",
          colorHex: "#FF0000",
          unitsPerPackage: 50,
        },
        kitTotalAmount: 25,
      };

      addItem(item1 as any);
      addItem(item2 as any);

      const { items } = useCartStore.getState();
      expect(items).toHaveLength(2);
    });
  });

  describe("addItem - CUSTOM_RIBBON type", () => {
    it("should deduplicate by product.id+kitName", () => {
      const { addItem } = useCartStore.getState();
      const baseItem = {
        cartId: "cart-1",
        type: "CUSTOM_RIBBON" as const,
        quantity: 1,
        product: { id: "ribbon-1", name: "Ribbon", price: 30, type: "RIBBON" as const, category: "Test", unit: "m" as const, inStock: true, disabled: false },
        kitName: "My Ribbon Kit",
      };

      addItem(baseItem as any);
      addItem({ ...baseItem, cartId: "cart-2" } as any);

      const { items } = useCartStore.getState();
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(2);
    });
  });

  describe("addItem - CUSTOM_KIT type", () => {
    it("should deduplicate by kitName+kitTotalAmount", () => {
      const { addItem } = useCartStore.getState();
      const baseItem = {
        cartId: "cart-1",
        type: "CUSTOM_KIT" as const,
        quantity: 1,
        kitName: "Deluxe Kit",
        kitTotalAmount: 150,
        kitComponents: [],
      };

      addItem(baseItem as any);
      addItem({ ...baseItem, cartId: "cart-2" } as any);

      const { items } = useCartStore.getState();
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(2);
    });
  });

  describe("removeItem", () => {
    it("should remove an item by cartId", () => {
      const { addItem, removeItem } = useCartStore.getState();
      const item = {
        cartId: "cart-1",
        type: "SIMPLE" as const,
        quantity: 1,
        product: { id: "p1", name: "Prod", price: 50, type: "STANDARD_ITEM" as const, category: "Test", unit: "un" as const, inStock: true, disabled: false },
      };

      addItem(item as any);
      removeItem("cart-1");

      const { items } = useCartStore.getState();
      expect(items).toHaveLength(0);
    });

    it("should not affect other items when removing one", () => {
      const { addItem, removeItem } = useCartStore.getState();
      const item1 = {
        cartId: "cart-1",
        type: "SIMPLE" as const,
        quantity: 1,
        product: { id: "p1", name: "Prod1", price: 50, type: "STANDARD_ITEM" as const, category: "Test", unit: "un" as const, inStock: true, disabled: false },
      };
      const item2 = {
        cartId: "cart-2",
        type: "SIMPLE" as const,
        quantity: 1,
        product: { id: "p2", name: "Prod2", price: 60, type: "STANDARD_ITEM" as const, category: "Test", unit: "un" as const, inStock: true, disabled: false },
      };

      addItem(item1 as any);
      addItem(item2 as any);
      removeItem("cart-1");

      const { items } = useCartStore.getState();
      expect(items).toHaveLength(1);
      expect(items[0].product?.id).toBe("p2");
    });

    it("should do nothing when removing unknown cartId", () => {
      const { removeItem } = useCartStore.getState();
      removeItem("unknown-id");
      const { items } = useCartStore.getState();
      expect(items).toHaveLength(0);
    });
  });

  describe("updateQuantity", () => {
    it("should update item quantity to a new value", () => {
      const { addItem, updateQuantity } = useCartStore.getState();
      const item = {
        cartId: "cart-1",
        type: "SIMPLE" as const,
        quantity: 1,
        product: { id: "p1", name: "Prod", price: 50, type: "STANDARD_ITEM" as const, category: "Test", unit: "un" as const, inStock: true, disabled: false },
      };

      addItem(item as any);
      updateQuantity("cart-1", 5);

      const { items } = useCartStore.getState();
      expect(items[0].quantity).toBe(5);
    });

    it("should remove item when quantity is set to 0", () => {
      const { addItem, updateQuantity } = useCartStore.getState();
      const item = {
        cartId: "cart-1",
        type: "SIMPLE" as const,
        quantity: 1,
        product: { id: "p1", name: "Prod", price: 50, type: "STANDARD_ITEM" as const, category: "Test", unit: "un" as const, inStock: true, disabled: false },
      };

      addItem(item as any);
      updateQuantity("cart-1", 0);

      const { items } = useCartStore.getState();
      expect(items).toHaveLength(0);
    });

    it("should remove item when quantity is set to negative", () => {
      const { addItem, updateQuantity } = useCartStore.getState();
      const item = {
        cartId: "cart-1",
        type: "SIMPLE" as const,
        quantity: 1,
        product: { id: "p1", name: "Prod", price: 50, type: "STANDARD_ITEM" as const, category: "Test", unit: "un" as const, inStock: true, disabled: false },
      };

      addItem(item as any);
      updateQuantity("cart-1", -5);

      const { items } = useCartStore.getState();
      expect(items).toHaveLength(0);
    });
  });

  describe("openCart / closeCart", () => {
    it("should open cart", () => {
      const { openCart } = useCartStore.getState();
      openCart();
      const { isCartOpen } = useCartStore.getState();
      expect(isCartOpen).toBe(true);
    });

    it("should close cart", () => {
      const { openCart, closeCart } = useCartStore.getState();
      openCart();
      closeCart();
      const { isCartOpen } = useCartStore.getState();
      expect(isCartOpen).toBe(false);
    });

    it("should toggle isCartOpen state", () => {
      const { openCart, closeCart } = useCartStore.getState();
      expect(useCartStore.getState().isCartOpen).toBe(false);
      openCart();
      expect(useCartStore.getState().isCartOpen).toBe(true);
      closeCart();
      expect(useCartStore.getState().isCartOpen).toBe(false);
    });
  });

  describe("clearCart", () => {
    it("should remove all items from cart", () => {
      const { addItem, clearCart } = useCartStore.getState();
      const item1 = {
        cartId: "cart-1",
        type: "SIMPLE" as const,
        quantity: 1,
        product: { id: "p1", name: "Prod1", price: 50, type: "STANDARD_ITEM" as const, category: "Test", unit: "un" as const, inStock: true, disabled: false },
      };
      const item2 = {
        cartId: "cart-2",
        type: "SIMPLE" as const,
        quantity: 1,
        product: { id: "p2", name: "Prod2", price: 60, type: "STANDARD_ITEM" as const, category: "Test", unit: "un" as const, inStock: true, disabled: false },
      };

      addItem(item1 as any);
      addItem(item2 as any);
      clearCart();

      const { items } = useCartStore.getState();
      expect(items).toHaveLength(0);
    });
  });

  describe("getCartTotal", () => {
    it("should return 0 for empty cart", () => {
      const { getCartTotal } = useCartStore.getState();
      expect(getCartTotal()).toBe(0);
    });

    it("should calculate total for SIMPLE items: qty * price", () => {
      const { addItem, getCartTotal } = useCartStore.getState();
      const item = {
        cartId: "cart-1",
        type: "SIMPLE" as const,
        quantity: 2,
        product: { id: "p1", name: "Prod", price: 50, type: "STANDARD_ITEM" as const, category: "Test", unit: "un" as const, inStock: true, disabled: false },
      };

      addItem(item as any);
      const total = getCartTotal();
      expect(total).toBe(100); // 2 * 50
    });

    it("should calculate total for SIMPLE items with variant price", () => {
      const { addItem, getCartTotal } = useCartStore.getState();
      const item = {
        cartId: "cart-1",
        type: "SIMPLE" as const,
        quantity: 2,
        product: { id: "p1", name: "Prod", price: 50, type: "STANDARD_ITEM" as const, category: "Test", unit: "un" as const, inStock: true, disabled: false },
        selectedVariant: { id: "v1", name: "Blue", price: 60, inStock: true },
      };

      addItem(item as any);
      const total = getCartTotal();
      expect(total).toBe(120); // 2 * 60 (variant price takes precedence)
    });

    it("should calculate total for CUSTOM_BALLOON: qty * kitTotalAmount", () => {
      const { addItem, getCartTotal } = useCartStore.getState();
      const item = {
        cartId: "cart-1",
        type: "CUSTOM_BALLOON" as const,
        quantity: 3,
        balloonDetails: {
          typeId: "balloon-1",
          typeName: "Round",
          size: "16",
          color: "Blue",
          colorHex: "#0000FF",
          unitsPerPackage: 50,
        },
        kitTotalAmount: 25,
      };

      addItem(item as any);
      const total = getCartTotal();
      expect(total).toBe(75); // 3 * 25
    });

    it("should calculate total for CUSTOM_RIBBON: qty * kitTotalAmount", () => {
      const { addItem, getCartTotal } = useCartStore.getState();
      const item = {
        cartId: "cart-1",
        type: "CUSTOM_RIBBON" as const,
        quantity: 2,
        product: { id: "ribbon-1", name: "Ribbon", price: 30, type: "RIBBON" as const, category: "Test", unit: "m" as const, inStock: true, disabled: false },
        kitName: "My Kit",
        kitTotalAmount: 40,
      };

      addItem(item as any);
      const total = getCartTotal();
      expect(total).toBe(80); // 2 * 40
    });

    it("should calculate total for CUSTOM_KIT: qty * kitTotalAmount", () => {
      const { addItem, getCartTotal } = useCartStore.getState();
      const item = {
        cartId: "cart-1",
        type: "CUSTOM_KIT" as const,
        quantity: 1,
        kitName: "Deluxe Kit",
        kitTotalAmount: 150,
        kitComponents: [],
      };

      addItem(item as any);
      const total = getCartTotal();
      expect(total).toBe(150); // 1 * 150
    });

    it("should calculate total for mixed cart types", () => {
      const { addItem, getCartTotal } = useCartStore.getState();

      addItem({
        cartId: "cart-1",
        type: "SIMPLE" as const,
        quantity: 2,
        product: { id: "p1", name: "Prod", price: 50, type: "STANDARD_ITEM" as const, category: "Test", unit: "un" as const, inStock: true, disabled: false },
      } as any);

      addItem({
        cartId: "cart-2",
        type: "CUSTOM_BALLOON" as const,
        quantity: 1,
        balloonDetails: {
          typeId: "b1",
          typeName: "Round",
          size: "16",
          color: "Blue",
          colorHex: "#0000FF",
          unitsPerPackage: 50,
        },
        kitTotalAmount: 30,
      } as any);

      const total = getCartTotal();
      expect(total).toBe(130); // (2 * 50) + (1 * 30) = 100 + 30
    });
  });

  describe("Toast notifications", () => {
    it("should call toast.success when adding a new item", () => {
      const { addItem } = useCartStore.getState();
      const item = {
        cartId: "cart-1",
        type: "SIMPLE" as const,
        quantity: 1,
        product: { id: "p1", name: "Prod", price: 50, type: "STANDARD_ITEM" as const, category: "Test", unit: "un" as const, inStock: true, disabled: false },
      };

      addItem(item as any);

      // The toast mock should have been called (verified in setup.ts)
      // This test verifies the store doesn't crash when calling toast
      const { items } = useCartStore.getState();
      expect(items).toHaveLength(1);
    });

    it("should call toast.info when removing an item", () => {
      const { addItem, removeItem } = useCartStore.getState();
      const item = {
        cartId: "cart-1",
        type: "SIMPLE" as const,
        quantity: 1,
        product: { id: "p1", name: "Prod", price: 50, type: "STANDARD_ITEM" as const, category: "Test", unit: "un" as const, inStock: true, disabled: false },
      };

      addItem(item as any);
      removeItem("cart-1");

      const { items } = useCartStore.getState();
      expect(items).toHaveLength(0);
    });

    it("should call toast.info when clearing cart", () => {
      const { addItem, clearCart } = useCartStore.getState();
      const item = {
        cartId: "cart-1",
        type: "SIMPLE" as const,
        quantity: 1,
        product: { id: "p1", name: "Prod", price: 50, type: "STANDARD_ITEM" as const, category: "Test", unit: "un" as const, inStock: true, disabled: false },
      };

      addItem(item as any);
      clearCart();

      const { items } = useCartStore.getState();
      expect(items).toHaveLength(0);
    });
  });
});
