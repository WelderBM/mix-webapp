import { NaturaBanner } from "@/components/features/NaturaBanner";

interface SectionNaturaBannerProps {
  onScrollRequest?: () => void;
}

export const SectionNaturaBanner = ({
  onScrollRequest,
}: SectionNaturaBannerProps) => {
  return (
    <div
      className="h-full flex flex-col [&>*]:flex-1"
      style={{ "--dynamic-bg": "var(--banner-natura)" } as any}
    >
      <NaturaBanner onClick={onScrollRequest} />
    </div>
  );
};
