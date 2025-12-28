import { create } from "zustand";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { StoreSettings } from "@/types";

interface SettingsStore {
  settings: StoreSettings;
  isLoading: boolean;
  fetchSettings: () => Promise<void>;
}

const DEFAULT_SETTINGS: StoreSettings = {
  id: "general",
  storeName: "Mix WebApp",
  whatsappNumber: "5595984244194",
  theme: {
    primaryColor: "#7c3aed", // Roxo (Padrão atual)
    secondaryColor: "#16a34a", // Verde (Padrão botões)
    accentColor: "#f97316", // Laranja (Destaques)
    backgroundColor: "#f8fafc",
    activeTheme: "default",
  },
  filters: {
    activeCategories: [],
    categoryOrder: [], // Aqui salvaremos a ordem dos Grupos
  },
  homeSections: [],
};

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: DEFAULT_SETTINGS,
  isLoading: true,

  fetchSettings: async () => {
    try {
      const docRef = doc(db, "settings", "general");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        set({
          settings: { ...DEFAULT_SETTINGS, ...docSnap.data() } as StoreSettings,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error("Erro ao buscar configurações:", error);
      set({ isLoading: false });
    }
  },
}));
