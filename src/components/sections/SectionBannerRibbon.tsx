import { RibbonBuilderTrigger } from "@/components/features/RibbonBuilderTrigger";

export const SectionBannerRibbon = () => {
  return (
    <div
      className="h-full flex flex-col [&>*]:flex-1"
      style={{ "--dynamic-bg": "var(--banner-ribbon)" } as any}
    >
      <RibbonBuilderTrigger />
    </div>
  );
};
