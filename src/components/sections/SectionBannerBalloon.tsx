import { BalloonBuilderTrigger } from "@/components/features/BalloonBuilderTrigger";

export const SectionBannerBalloon = () => {
  return (
    <div
      className="h-full flex flex-col *:flex-1"
      style={{ "--dynamic-bg": "var(--banner-balloon)" } as any}
    >
      <BalloonBuilderTrigger />
    </div>
  );
};
