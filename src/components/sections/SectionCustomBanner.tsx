import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";
import { StoreSection } from "@/types";

interface SectionCustomBannerProps {
  section: StoreSection;
  inGrid?: boolean;
}

// Grid da home: max-w-6xl com px-4 (1120px úteis), 2 colunas a partir de md;
// banner "half" ocupa uma coluna. Fora do grid (/natura), largura total (#105).
const bannerSizes = (section: StoreSection, inGrid?: boolean) => {
  if (!inGrid) return "100vw";
  return section.width === "full"
    ? "(min-width: 1152px) 1120px, 100vw"
    : "(min-width: 1152px) 548px, (min-width: 768px) 50vw, 100vw";
};

export const SectionCustomBanner = ({
  section,
  inGrid,
}: SectionCustomBannerProps) => {
  if (!section.bannerUrl) return null;

  const content = (
    <div className="relative w-full aspect-[21/9] md:aspect-[3/1] rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <SafeImage
        src={section.bannerUrl}
        alt={section.title}
        name={section.title}
        fill
        sizes={bannerSizes(section, inGrid)}
        className="object-cover"
      />
      <div className="absolute inset-0 bg-black/10 hover:bg-transparent transition-colors" />
    </div>
  );

  if (section.bannerLink) {
    // Check if it's an external link
    const isExternal = section.bannerLink.startsWith("http");
    return (
      <Link
        href={section.bannerLink}
        target={isExternal ? "_blank" : undefined}
        className="block mt-6 mb-8"
      >
        {content}
      </Link>
    );
  }

  return <div className="mt-6 mb-8">{content}</div>;
};
