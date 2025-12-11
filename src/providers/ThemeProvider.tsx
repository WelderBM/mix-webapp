"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface ThemeSettings {
  primaryColor: string; // Ex: #ff0000 (Vermelho)
  secondaryColor: string; // Ex: #00ff00 (Verde)
}

const ThemeContext = createContext<ThemeSettings | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeSettings>({
    primaryColor: "#7c3aed", // Roxo (Padrão)
    secondaryColor: "#db2777", // Rosa (Padrão)
  });

  useEffect(() => {
    // Escuta mudanças no Admin em tempo real
    const unsub = onSnapshot(doc(db, "settings", "general"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
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
    root.style.setProperty("--brand-secondary", theme.secondaryColor);
  };

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
