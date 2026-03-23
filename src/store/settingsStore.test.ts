import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useSettingsStore } from "@/store/settingsStore";

// Mock firebase/firestore before importing the store
vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
}));

import { getDoc } from "firebase/firestore";

describe("SettingsStore", () => {
  beforeEach(() => {
    // Reset store state before each test
    useSettingsStore.setState({
      settings: {
        id: "general",
        storeName: "Mix WebApp",
        whatsappNumber: "5595984244194",
        theme: {
          primaryColor: "#7c3aed",
          secondaryColor: "#16a34a",
          accentColor: "#f97316",
          backgroundColor: "#f8fafc",
          activeTheme: "default",
        },
        filters: {
          activeCategories: [],
          categoryOrder: [],
        },
        homeSections: [],
      },
      isLoading: true,
    });

    // Clear mock calls
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Initial state", () => {
    it("should have DEFAULT_SETTINGS as initial settings", () => {
      const store = useSettingsStore.getState();
      expect(store.settings.storeName).toBe("Mix WebApp");
      expect(store.settings.whatsappNumber).toBe("5595984244194");
      expect(store.settings.id).toBe("general");
    });

    it("should have isLoading set to true initially", () => {
      const store = useSettingsStore.getState();
      expect(store.isLoading).toBe(true);
    });

    it("should have correct theme colors", () => {
      const store = useSettingsStore.getState();
      expect(store.settings.theme.primaryColor).toBe("#7c3aed");
      expect(store.settings.theme.secondaryColor).toBe("#16a34a");
      expect(store.settings.theme.accentColor).toBe("#f97316");
      expect(store.settings.theme.backgroundColor).toBe("#f8fafc");
    });

    it("should have correct default theme", () => {
      const store = useSettingsStore.getState();
      expect(store.settings.theme.activeTheme).toBe("default");
    });

    it("should have empty active categories", () => {
      const store = useSettingsStore.getState();
      expect(store.settings.filters.activeCategories).toEqual([]);
    });

    it("should have empty category order", () => {
      const store = useSettingsStore.getState();
      expect(store.settings.filters.categoryOrder).toEqual([]);
    });

    it("should have empty home sections", () => {
      const store = useSettingsStore.getState();
      expect(store.settings.homeSections).toEqual([]);
    });
  });

  describe("fetchSettings", () => {
    it("should merge doc data with DEFAULT_SETTINGS and set isLoading to false when doc exists", async () => {
      const mockData = {
        storeName: "Custom Store",
        theme: {
          primaryColor: "#ff0000",
          activeTheme: "christmas",
        },
      };

      const mockDocSnap = {
        exists: () => true,
        data: () => mockData,
      };

      (getDoc as any).mockResolvedValue(mockDocSnap);

      const store = useSettingsStore.getState();
      await store.fetchSettings();

      const updatedStore = useSettingsStore.getState();
      expect(updatedStore.settings.storeName).toBe("Custom Store");
      expect(updatedStore.settings.whatsappNumber).toBe("5595984244194"); // from DEFAULT_SETTINGS
      expect(updatedStore.settings.theme.primaryColor).toBe("#ff0000");
      expect(updatedStore.settings.theme.activeTheme).toBe("christmas");
      expect(updatedStore.isLoading).toBe(false);
    });

    it("should keep DEFAULT_SETTINGS and set isLoading to false when doc does not exist", async () => {
      const mockDocSnap = {
        exists: () => false,
        data: () => undefined,
      };

      (getDoc as any).mockResolvedValue(mockDocSnap);

      const store = useSettingsStore.getState();
      await store.fetchSettings();

      const updatedStore = useSettingsStore.getState();
      expect(updatedStore.settings.storeName).toBe("Mix WebApp");
      expect(updatedStore.settings.whatsappNumber).toBe("5595984244194");
      expect(updatedStore.isLoading).toBe(false);
    });

    it("should set isLoading to false and log error on fetch error", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const error = new Error("Firestore connection error");

      (getDoc as any).mockRejectedValue(error);

      const store = useSettingsStore.getState();
      await store.fetchSettings();

      const updatedStore = useSettingsStore.getState();
      expect(updatedStore.isLoading).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Erro ao buscar configurações:",
        error
      );

      consoleErrorSpy.mockRestore();
    });

    it("should preserve DEFAULT_SETTINGS when partial data is merged", async () => {
      const mockData = {
        storeName: "Updated Name",
        // Other fields missing
      };

      const mockDocSnap = {
        exists: () => true,
        data: () => mockData,
      };

      (getDoc as any).mockResolvedValue(mockDocSnap);

      const store = useSettingsStore.getState();
      await store.fetchSettings();

      const updatedStore = useSettingsStore.getState();
      expect(updatedStore.settings.storeName).toBe("Updated Name");
      expect(updatedStore.settings.whatsappNumber).toBe("5595984244194");
      expect(updatedStore.settings.theme.primaryColor).toBe("#7c3aed");
      expect(updatedStore.settings.filters.activeCategories).toEqual([]);
    });

    it("should update home sections when provided in doc", async () => {
      const mockSections = [
        {
          id: "section1",
          title: "Featured Products",
          type: "product_shelf" as const,
          width: "full" as const,
          productIds: ["prod1", "prod2"],
          isActive: true,
        },
      ];

      const mockData = {
        homeSections: mockSections,
      };

      const mockDocSnap = {
        exists: () => true,
        data: () => mockData,
      };

      (getDoc as any).mockResolvedValue(mockDocSnap);

      const store = useSettingsStore.getState();
      await store.fetchSettings();

      const updatedStore = useSettingsStore.getState();
      expect(updatedStore.settings.homeSections).toEqual(mockSections);
      expect(updatedStore.settings.homeSections[0].title).toBe(
        "Featured Products"
      );
    });
  });
});
