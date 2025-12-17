import { useEffect, useRef } from "react";
import { useSettingsStore } from "@/store/settingsStore";
import { useProductStore } from "@/store/productStore";
import { Product, StoreSettings } from "@/types"; // Note o novo import

export const useStoreHydration = (
  initialProducts: Product[],
  initialSettings: StoreSettings
) => {
  // Ref para garantir que a hidratação ocorra apenas uma vez por montagem real
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current) return;

    // 1. Injeta Configurações
    useSettingsStore.setState({
      settings: initialSettings,
      isLoading: false,
    });

    // 2. Injeta Produtos DIRETAMENTE sem refetch
    // Isso economiza leituras no Firebase e evita loading spinners desnecessários
    if (initialProducts.length > 0) {
      useProductStore.setState({
        allProducts: initialProducts,
        // Opcional: Se você tiver lógica de filtro, pode rodar aqui
        isLoading: false,
      });
    } else {
      // Fallback: Só busca se por algum motivo veio vazio do servidor
      useProductStore.getState().fetchProducts();
    }

    hydratedRef.current = true;
  }, [initialProducts, initialSettings]);
};
