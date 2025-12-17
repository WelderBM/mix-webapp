import { useEffect } from "react";
import { useSettingsStore } from "@/store/settingsStore";
import { useProductStore } from "@/store/productStore";
import { Product, StoreSettings } from "@/lib/types";

export const useStoreHydration = (
  initialProducts: Product[],
  initialSettings: StoreSettings
) => {
  useEffect(() => {
    useSettingsStore.setState({ settings: initialSettings, isLoading: false });

    useProductStore.getState().fetchProducts();
  }, [initialSettings]);
};
