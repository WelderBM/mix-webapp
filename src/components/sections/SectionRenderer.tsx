import { StoreSection, Product } from "@/lib/types";
import { SectionProductShelf } from "./SectionProductShelf";
import { SectionBannerKit } from "./SectionBannerKit";
import { SectionBannerRibbon } from "./SectionBannerRibbon";
import { SectionNaturaBanner } from "./SectionNaturaBanner";

interface SectionRendererProps {
  section: StoreSection;
  products: Product[];
  onScrollRequest?: () => void;
}

export const SectionRenderer = ({
  section,
  products,
  onScrollRequest,
}: SectionRendererProps) => {
  switch (section.type) {
    case "product_shelf":
      return <SectionProductShelf section={section} allProducts={products} />;

    case "banner_kit":
      return <SectionBannerKit />;

    case "banner_ribbon":
      return <SectionBannerRibbon />;

    case "banner_natura":
      return <SectionNaturaBanner onScrollRequest={onScrollRequest} />;

    default:
      return null;
  }
};
