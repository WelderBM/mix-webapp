import { useMemo } from "react";
import { StoreSettings } from "@/lib/types";
import { hexToRgb, getContrastColor, adjustColor } from "@/lib/utils";

export const useThemeStyles = (settings: StoreSettings) => {
  return useMemo(() => {
    const primary = settings.theme?.primaryColor || "#7c3aed";
    const secondary =
      settings.theme?.secondaryColor || adjustColor(primary, -30);

    const bannerKitColor = primary;
    const bannerRibbonColor = adjustColor(primary, 40);
    const bannerNaturaColor = adjustColor(primary, -40);

    return {
      "--primary": primary,
      "--primary-rgb": hexToRgb(primary),
      "--primary-contrast": getContrastColor(primary),
      "--secondary": secondary,
      "--secondary-rgb": hexToRgb(secondary),
      "--secondary-contrast": "#ffffff",

      "--banner-kit": bannerKitColor,
      "--banner-ribbon": bannerRibbonColor,
      "--banner-natura": bannerNaturaColor,
    } as React.CSSProperties;
  }, [settings]);
};
