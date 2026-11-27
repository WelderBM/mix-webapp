import { useEffect, useRef } from "react";
import { useSettingsStore } from "@/store/settingsStore";
import { StoreSettings } from "@/types";

// Leva para a store as configurações que a home leu no servidor. O catálogo
// NÃO é hidratado aqui (#399): a home recebe só os produtos de cada vitrine,
// e quem precisa do catálogo inteiro (carrinho, montador, /fitas) o pede.
export const useStoreHydration = (initialSettings: StoreSettings) => {
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current) return;
    // Sem `id`, a leitura no servidor falhou (getInitialData devolve {}):
    // busca de novo no navegador em vez de deixar a home sem vitrine até a
    // próxima revalidação.
    if (initialSettings?.id) {
      useSettingsStore.setState({ settings: initialSettings, isLoading: false });
    } else {
      useSettingsStore.getState().fetchSettings();
    }
    hydratedRef.current = true;
  }, [initialSettings]);
};
