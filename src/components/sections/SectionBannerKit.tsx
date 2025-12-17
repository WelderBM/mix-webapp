import { BuilderTrigger } from "@/components/features/BuilderTrigger";

export const SectionBannerKit = () => {
  return (
    <div
      className="h-full flex flex-col [&>*]:flex-1"
      style={{ "--dynamic-bg": "var(--banner-kit)" } as any}
    >
      <BuilderTrigger />
    </div>
  );
};
