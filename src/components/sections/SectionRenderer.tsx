import dynamic from "next/dynamic";
import { StoreSection, Product } from "@/types";
import { SectionErrorBoundary } from "./SectionErrorBoundary";

// --- COMPONENTES CARREGADOS SOB DEMANDA (LAZY) ---
// O navegador só baixa esse código se o 'type' da seção pedir.
const SectionProductShelf = dynamic(
  () => import("./SectionProductShelf").then((mod) => mod.SectionProductShelf),
  {
    loading: () => <SectionSkeleton />,
  }
);

const SectionBannerKit = dynamic(
  () => import("./SectionBannerKit").then((mod) => mod.SectionBannerKit),
  {
    loading: () => <SectionSkeleton />,
  }
);

const SectionBannerRibbon = dynamic(
  () => import("./SectionBannerRibbon").then((mod) => mod.SectionBannerRibbon),
  {
    loading: () => <SectionSkeleton />,
  }
);

const SectionNaturaBanner = dynamic(
  () => import("./SectionNaturaBanner").then((mod) => mod.SectionNaturaBanner),
  {
    loading: () => <SectionSkeleton />,
  }
);

// Componente simples de Loading para evitar "pulos" na tela
const SectionSkeleton = () => (
  <div className="w-full h-48 bg-slate-100 animate-pulse rounded-lg my-4" />
);

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
  const renderContent = () => {
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

  return <SectionErrorBoundary>{renderContent()}</SectionErrorBoundary>;
};
