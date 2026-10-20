"use client";

import { BuilderTrigger } from "@/components/features/BuilderTrigger";
import { useSettingsStore } from "@/store/settingsStore";

export const SectionBannerKit = () => {
  const customKitEnabled = useSettingsStore(
    (s) => s.settings.features?.customKitEnabled ?? false
  );

  if (!customKitEnabled) return null;

  return (
    <div
      className="h-full flex flex-col *:flex-1"
      style={{ "--dynamic-bg": "var(--banner-kit)" } as any}
    >
      <BuilderTrigger />
    </div>
  );
};
