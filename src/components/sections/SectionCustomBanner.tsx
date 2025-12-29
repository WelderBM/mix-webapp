import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";
import { StoreSection } from "@/types";

interface SectionCustomBannerProps {
  section: StoreSection;
}

export const SectionCustomBanner = ({ section }: SectionCustomBannerProps) => {
  if (!section.bannerUrl) return null;

  const content = (
    <div className="relative w-full aspect-[21/9] md:aspect-[3/1] rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <SafeImage
        src={section.bannerUrl}
        alt={section.title}
        name={section.title}
        fill
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
