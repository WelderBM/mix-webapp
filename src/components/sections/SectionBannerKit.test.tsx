// @vitest-environment happy-dom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { SectionBannerKit } from "./SectionBannerKit";
import { useSettingsStore } from "@/store/settingsStore";

describe("SectionBannerKit (#108 gate)", () => {
  afterEach(() => {
    cleanup();
  });

  it("não renderiza o BuilderTrigger quando features.customKitEnabled é false", () => {
    useSettingsStore.setState((s) => ({
      settings: { ...s.settings, features: { customKitEnabled: false } },
    }));

    const { container } = render(<SectionBannerKit />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText("Monte seu Kit")).not.toBeInTheDocument();
  });

  it("não renderiza o BuilderTrigger quando features está ausente (produção pré-flag)", () => {
    useSettingsStore.setState((s) => {
      const { features, ...rest } = s.settings;
      return { settings: rest };
    });

    const { container } = render(<SectionBannerKit />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renderiza o BuilderTrigger quando features.customKitEnabled é true", () => {
    useSettingsStore.setState((s) => ({
      settings: { ...s.settings, features: { customKitEnabled: true } },
    }));

    render(<SectionBannerKit />);

    expect(screen.getByText("Monte seu Kit")).toBeInTheDocument();
  });
});
