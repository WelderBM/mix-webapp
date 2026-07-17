"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { StoreSettings } from "@/types";

interface ThemeSettings {
  primaryColor: string;
  secondaryColor?: string;
}

const ThemeContext = createContext<ThemeSettings | null>(null);

// settings/general já é escutado aqui pra aplicar o tema em toda a loja —
// exposto também via contexto (useGlobalSettings) pra quem mais precisar do
// documento inteiro (ex: admin/page.tsx) reaproveitar essa mesma leitura em
// vez de abrir um segundo onSnapshot redundante no mesmo doc.
const SettingsContext = createContext<StoreSettings | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeSettings>({
    primaryColor: "#1d11889e",
    secondaryColor: "#459cff",
  });
  const [settings, setSettings] = useState<StoreSettings | null>(null);

  useEffect(() => {
    // Escuta mudanças no Admin em tempo real
    const unsub = onSnapshot(doc(db, "settings", "general"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as StoreSettings;
        setSettings(data);
        if (data.theme) {
          setTheme(data.theme);
          updateCssVariables(data.theme);
        }
      }
    });
    return () => unsub();
  }, []);

  const updateCssVariables = (theme: ThemeSettings) => {
    const root = document.documentElement;
    // Injeta a cor escolhida como variável CSS
    root.style.setProperty("--brand-primary", theme.primaryColor);
    if (theme.secondaryColor) {
      root.style.setProperty("--brand-secondary", theme.secondaryColor);
    }
  };

  return (
    <ThemeContext.Provider value={theme}>
      <SettingsContext.Provider value={settings}>
        {children}
      </SettingsContext.Provider>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
export const useGlobalSettings = () => useContext(SettingsContext);
