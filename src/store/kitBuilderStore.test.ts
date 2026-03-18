import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useKitBuilderStore } from "./kitBuilderStore";
import { Product } from "@/types";

// Helper to create mock Product objects
const makeProduct = (overrides: Partial<Product> = {}): Product => ({
  id: "prod-1",
  name: "Test Product",
  price: 10,
  type: "FILLER",
  category: "Test",
  unit: "un",
  inStock: true,
  disabled: false,
  itemSize: 1,
  capacity: 10,
  ...overrides,
});

describe("useKitBuilderStore", () => {
  beforeEach(() => {
    useKitBuilderStore.setState({
      isOpen: false,
      currentStep: 1,
      selectedStyle: null,
      composition: {
        baseContainer: null,
        selectedWrapper: null,
        internalItems: [],
        currentSlotCount: 0,
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    useKitBuilderStore.setState({
      isOpen: false,
      currentStep: 1,
      selectedStyle: null,
      composition: {
        baseContainer: null,
        selectedWrapper: null,
        internalItems: [],
        currentSlotCount: 0,
      },
    });
  });

  describe("Initial State", () => {
    it("should have isOpen false", () => {
      const { isOpen } = useKitBuilderStore.getState();
      expect(isOpen).toBe(false);
    });

    it("should have currentStep 1", () => {
      const { currentStep } = useKitBuilderStore.getState();
      expect(currentStep).toBe(1);
    });

    it("should have selectedStyle null", () => {
      const { selectedStyle } = useKitBuilderStore.getState();
      expect(selectedStyle).toBeNull();
    });

    it("should have empty composition", () => {
      const { composition } = useKitBuilderStore.getState();
      expect(composition.baseContainer).toBeNull();
      expect(composition.selectedWrapper).toBeNull();
      expect(composition.internalItems).toEqual([]);
      expect(composition.currentSlotCount).toBe(0);
    });
  });

  describe("openKitBuilder / closeKitBuilder", () => {
    it("should open kit builder", () => {
      const { openKitBuilder } = useKitBuilderStore.getState();
      openKitBuilder();
      expect(useKitBuilderStore.getState().isOpen).toBe(true);
    });

    it("should close kit builder", () => {
      const { openKitBuilder, closeKitBuilder } = useKitBuilderStore.getState();
      openKitBuilder();
      closeKitBuilder();
      expect(useKitBuilderStore.getState().isOpen).toBe(false);
    });

    it("should toggle isOpen state correctly", () => {
      const { openKitBuilder, closeKitBuilder } = useKitBuilderStore.getState();
      expect(useKitBuilderStore.getState().isOpen).toBe(false);
      openKitBuilder();
      expect(useKitBuilderStore.getState().isOpen).toBe(true);
      closeKitBuilder();
      expect(useKitBuilderStore.getState().isOpen).toBe(false);
    });
  });

  describe("setStep", () => {
    it("should set currentStep to given value", () => {
      const { setStep } = useKitBuilderStore.getState();
      setStep(3);
      expect(useKitBuilderStore.getState().currentStep).toBe(3);
    });

    it("should handle step progression", () => {
      const { setStep } = useKitBuilderStore.getState();
      setStep(1);
      expect(useKitBuilderStore.getState().currentStep).toBe(1);
      setStep(2);
      expect(useKitBuilderStore.getState().currentStep).toBe(2);
      setStep(3);
      expect(useKitBuilderStore.getState().currentStep).toBe(3);
    });
  });

  describe("setStyle", () => {
    it("should set selectedStyle", () => {
      const { setStyle } = useKitBuilderStore.getState();
      setStyle("SACO_EXPRESS");
      expect(useKitBuilderStore.getState().selectedStyle).toBe("SACO_EXPRESS");
    });

    it("should reset baseContainer and selectedWrapper when setting style", () => {
      const { setBaseContainer, setStyle, setWrapper } = useKitBuilderStore.getState();
      const base = makeProduct({ id: "base-1", type: "BASE_CONTAINER" });
      const wrapper = makeProduct({ id: "wrapper-1", type: "WRAPPER" });

      setBaseContainer(base);
      setWrapper(wrapper);
      expect(useKitBuilderStore.getState().composition.baseContainer).not.toBeNull();
      expect(useKitBuilderStore.getState().composition.selectedWrapper).not.toBeNull();

      setStyle("CAIXA_FECHADA");

      expect(useKitBuilderStore.getState().composition.baseContainer).toBeNull();
      expect(useKitBuilderStore.getState().composition.selectedWrapper).toBeNull();
    });

    it("should keep internalItems when setting style", () => {
      const { setStyle, addItem } = useKitBuilderStore.getState();
      const product = makeProduct({ id: "prod-1" });

      addItem(product);
      const itemsBefore = useKitBuilderStore.getState().composition.internalItems.length;

      setStyle("CESTA_VITRINE");

      const itemsAfter = useKitBuilderStore.getState().composition.internalItems.length;
      expect(itemsBefore).toBe(itemsAfter);
    });
  });

  describe("resetBuilder", () => {
    it("should reset all state to initial values", () => {
      const { setStep, setStyle, setBaseContainer, addItem, resetBuilder } =
        useKitBuilderStore.getState();
      const product = makeProduct();

      setStep(3);
      setStyle("SACO_EXPRESS");
      setBaseContainer(product);
      addItem(product);

      resetBuilder();

      const state = useKitBuilderStore.getState();
      expect(state.currentStep).toBe(1);
      expect(state.selectedStyle).toBeNull();
      expect(state.composition.baseContainer).toBeNull();
      expect(state.composition.selectedWrapper).toBeNull();
      expect(state.composition.internalItems).toEqual([]);
      expect(state.composition.currentSlotCount).toBe(0);
    });
  });

  describe("addItem", () => {
    it("should add a product to internalItems when in stock", () => {
      const { addItem } = useKitBuilderStore.getState();
      const product = makeProduct({ id: "prod-1", inStock: true });

      const result = addItem(product);

      expect(result.success).toBe(true);
      const items = useKitBuilderStore.getState().composition.internalItems;
      expect(items).toHaveLength(1);
      expect(items[0].product.id).toBe("prod-1");
    });

    it("should fail when product is out of stock", () => {
      const { addItem } = useKitBuilderStore.getState();
      const product = makeProduct({ id: "prod-1", inStock: false });

      const result = addItem(product);

      expect(result.success).toBe(false);
      expect(result.reason).toBe("Fora de estoque.");
      expect(useKitBuilderStore.getState().composition.internalItems).toHaveLength(0);
    });

    it("should increment quantity if product already exists", () => {
      const { addItem } = useKitBuilderStore.getState();
      const product = makeProduct({ id: "prod-1" });

      addItem(product);
      addItem(product);

      const items = useKitBuilderStore.getState().composition.internalItems;
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(2);
    });

    it("should fail when capacity exceeded", () => {
      const { setBaseContainer, addItem } = useKitBuilderStore.getState();
      const baseContainer = makeProduct({
        id: "base-1",
        type: "BASE_CONTAINER",
        capacity: 10,
      });
      const product = makeProduct({ id: "prod-1", itemSize: 12 });

      setBaseContainer(baseContainer);

      const result = addItem(product, 1);

      expect(result.success).toBe(false);
      expect(result.reason).toBe("A embalagem não comporta mais itens.");
      expect(useKitBuilderStore.getState().composition.internalItems).toHaveLength(0);
    });

    it("should increment currentSlotCount by itemSize", () => {
      const { addItem } = useKitBuilderStore.getState();
      const product = makeProduct({ id: "prod-1", itemSize: 3 });

      addItem(product, 1);

      expect(useKitBuilderStore.getState().composition.currentSlotCount).toBe(3);
    });

    it("should increment currentSlotCount correctly with quantity", () => {
      const { addItem } = useKitBuilderStore.getState();
      const product = makeProduct({ id: "prod-1", itemSize: 2 });

      addItem(product, 3);

      expect(useKitBuilderStore.getState().composition.currentSlotCount).toBe(6); // 2 * 3
    });

    it("should accept quantity parameter", () => {
      const { addItem } = useKitBuilderStore.getState();
      const product = makeProduct({ id: "prod-1" });

      addItem(product, 5);

      const items = useKitBuilderStore.getState().composition.internalItems;
      expect(items[0].quantity).toBe(5);
    });
  });

  describe("removeItem", () => {
    it("should remove product from internalItems", () => {
      const { addItem, removeItem } = useKitBuilderStore.getState();
      const product = makeProduct({ id: "prod-1" });

      addItem(product);
      removeItem("prod-1");

      expect(useKitBuilderStore.getState().composition.internalItems).toHaveLength(0);
    });

    it("should decrement currentSlotCount by correct amount", () => {
      const { addItem, removeItem } = useKitBuilderStore.getState();
      const product = makeProduct({ id: "prod-1", itemSize: 3 });

      addItem(product, 2);
      expect(useKitBuilderStore.getState().composition.currentSlotCount).toBe(6);

      removeItem("prod-1");
      expect(useKitBuilderStore.getState().composition.currentSlotCount).toBe(0);
    });

    it("should do nothing if product not found", () => {
      const { removeItem } = useKitBuilderStore.getState();
      removeItem("unknown-id");
      expect(useKitBuilderStore.getState().composition.internalItems).toHaveLength(0);
      expect(useKitBuilderStore.getState().composition.currentSlotCount).toBe(0);
    });

    it("should not affect other items when removing one", () => {
      const { addItem, removeItem } = useKitBuilderStore.getState();
      const product1 = makeProduct({ id: "prod-1" });
      const product2 = makeProduct({ id: "prod-2" });

      addItem(product1);
      addItem(product2);
      removeItem("prod-1");

      const items = useKitBuilderStore.getState().composition.internalItems;
      expect(items).toHaveLength(1);
      expect(items[0].product.id).toBe("prod-2");
    });
  });

  describe("updateItemQuantity", () => {
    it("should update quantity to new value", () => {
      const { addItem, updateItemQuantity } = useKitBuilderStore.getState();
      const product = makeProduct({ id: "prod-1" });

      addItem(product);
      updateItemQuantity("prod-1", 5);

      const items = useKitBuilderStore.getState().composition.internalItems;
      expect(items[0].quantity).toBe(5);
    });

    it("should remove item when quantity is set to 0", () => {
      const { addItem, updateItemQuantity } = useKitBuilderStore.getState();
      const product = makeProduct({ id: "prod-1" });

      addItem(product);
      updateItemQuantity("prod-1", 0);

      expect(useKitBuilderStore.getState().composition.internalItems).toHaveLength(0);
    });

    it("should remove item when quantity is set to negative", () => {
      const { addItem, updateItemQuantity } = useKitBuilderStore.getState();
      const product = makeProduct({ id: "prod-1" });

      addItem(product);
      updateItemQuantity("prod-1", -5);

      expect(useKitBuilderStore.getState().composition.internalItems).toHaveLength(0);
    });

    it("should update currentSlotCount correctly when increasing quantity", () => {
      const { addItem, updateItemQuantity } = useKitBuilderStore.getState();
      const product = makeProduct({ id: "prod-1", itemSize: 2 });

      addItem(product, 1); // currentSlotCount = 2
      updateItemQuantity("prod-1", 3); // increase by 2 units -> +4 slots

      expect(useKitBuilderStore.getState().composition.currentSlotCount).toBe(6); // 2 + 4
    });

    it("should update currentSlotCount correctly when decreasing quantity", () => {
      const { addItem, updateItemQuantity } = useKitBuilderStore.getState();
      const product = makeProduct({ id: "prod-1", itemSize: 2 });

      addItem(product, 3); // currentSlotCount = 6
      updateItemQuantity("prod-1", 1); // decrease by 2 units -> -4 slots

      expect(useKitBuilderStore.getState().composition.currentSlotCount).toBe(2); // 6 - 4
    });

    it("should not update if would exceed capacity", () => {
      const { setBaseContainer, addItem, updateItemQuantity } =
        useKitBuilderStore.getState();
      const baseContainer = makeProduct({
        id: "base-1",
        type: "BASE_CONTAINER",
        capacity: 10,
      });
      const product = makeProduct({ id: "prod-1", itemSize: 3 });

      setBaseContainer(baseContainer);
      addItem(product, 2); // currentSlotCount = 6

      const result = updateItemQuantity("prod-1", 5); // Would need 15 slots total

      // If capacity check fails, quantity should remain unchanged
      const items = useKitBuilderStore.getState().composition.internalItems;
      expect(items[0].quantity).toBe(2); // Should not have changed
    });

    it("should do nothing if product not found", () => {
      const { updateItemQuantity } = useKitBuilderStore.getState();
      updateItemQuantity("unknown-id", 5);
      expect(useKitBuilderStore.getState().composition.internalItems).toHaveLength(0);
    });
  });

  describe("setBaseContainer", () => {
    it("should set baseContainer", () => {
      const { setBaseContainer } = useKitBuilderStore.getState();
      const product = makeProduct({ id: "base-1", type: "BASE_CONTAINER" });

      setBaseContainer(product);

      expect(useKitBuilderStore.getState().composition.baseContainer?.id).toBe("base-1");
    });

    it("should reset selectedWrapper when setting baseContainer", () => {
      const { setBaseContainer, setWrapper } = useKitBuilderStore.getState();
      const base = makeProduct({ id: "base-1", type: "BASE_CONTAINER" });
      const wrapper = makeProduct({ id: "wrapper-1", type: "WRAPPER" });

      setWrapper(wrapper);
      expect(useKitBuilderStore.getState().composition.selectedWrapper).not.toBeNull();

      setBaseContainer(base);

      expect(useKitBuilderStore.getState().composition.selectedWrapper).toBeNull();
    });
  });

  describe("setWrapper", () => {
    it("should set selectedWrapper", () => {
      const { setWrapper } = useKitBuilderStore.getState();
      const product = makeProduct({ id: "wrapper-1", type: "WRAPPER" });

      setWrapper(product);

      expect(useKitBuilderStore.getState().composition.selectedWrapper?.id).toBe(
        "wrapper-1"
      );
    });
  });

  describe("getValidWrappers", () => {
    it("should return SACO_EXPRESS wrappers when no baseContainer", () => {
      const { getValidWrappers } = useKitBuilderStore.getState();
      const wrappers = [
        makeProduct({
          id: "w1",
          kitStyle: "SACO_EXPRESS",
          type: "WRAPPER",
        }),
        makeProduct({
          id: "w2",
          kitStyle: "CAIXA_FECHADA",
          type: "WRAPPER",
        }),
        makeProduct({
          id: "w3",
          kitStyle: "SACO_EXPRESS",
          type: "WRAPPER",
        }),
      ];

      const valid = getValidWrappers(wrappers);

      expect(valid).toHaveLength(2);
      expect(valid.every((w) => w.kitStyle === "SACO_EXPRESS")).toBe(true);
    });

    it("should return Decorados or N/A wrappers when baseContainer has requiredWrapperSize N/A", () => {
      const { setBaseContainer, getValidWrappers } = useKitBuilderStore.getState();
      const base = makeProduct({
        id: "base-1",
        type: "BASE_CONTAINER",
        requiredWrapperSize: "N/A",
      });
      setBaseContainer(base);

      const wrappers = [
        makeProduct({
          id: "w1",
          category: "Decorados",
          type: "WRAPPER",
        }),
        makeProduct({
          id: "w2",
          wrapperSize: "N/A",
          type: "WRAPPER",
        }),
        makeProduct({
          id: "w3",
          wrapperSize: "60x80",
          type: "WRAPPER",
        }),
      ];

      const valid = getValidWrappers(wrappers);

      expect(valid).toHaveLength(2);
      expect(valid.some((w) => w.category === "Decorados")).toBe(true);
      expect(valid.some((w) => w.wrapperSize === "N/A")).toBe(true);
    });

    it("should return matching wrappers and 60x80 when baseContainer has specific size", () => {
      const { setBaseContainer, getValidWrappers } = useKitBuilderStore.getState();
      const base = makeProduct({
        id: "base-1",
        type: "BASE_CONTAINER",
        requiredWrapperSize: "40x50",
      });
      setBaseContainer(base);

      const wrappers = [
        makeProduct({
          id: "w1",
          wrapperSize: "40x50",
          type: "WRAPPER",
        }),
        makeProduct({
          id: "w2",
          wrapperSize: "60x80",
          type: "WRAPPER",
        }),
        makeProduct({
          id: "w3",
          wrapperSize: "30x40",
          type: "WRAPPER",
        }),
      ];

      const valid = getValidWrappers(wrappers);

      expect(valid).toHaveLength(2);
      expect(valid.some((w) => w.wrapperSize === "40x50")).toBe(true);
      expect(valid.some((w) => w.wrapperSize === "60x80")).toBe(true);
    });

    it("should return empty array if no matching wrappers", () => {
      const { setBaseContainer, getValidWrappers } = useKitBuilderStore.getState();
      const base = makeProduct({
        id: "base-1",
        type: "BASE_CONTAINER",
        requiredWrapperSize: "100x100",
      });
      setBaseContainer(base);

      const wrappers = [
        makeProduct({
          id: "w1",
          wrapperSize: "40x50",
          type: "WRAPPER",
        }),
        makeProduct({
          id: "w2",
          wrapperSize: "30x40",
          type: "WRAPPER",
        }),
      ];

      const valid = getValidWrappers(wrappers);

      expect(valid).toHaveLength(0);
    });
  });
});
