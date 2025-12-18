"use client";

import { useState, useEffect } from "react";
import Image, { ImageProps } from "next/image";
import { getProductImage, UNIVERSAL_FALLBACK_SVG } from "@/lib/image-utils";
import { ProductType } from "@/types";

interface SafeImageProps extends Omit<ImageProps, "src"> {
  src?: string | null;
  productType?: ProductType | string;
}

export function SafeImage({
  src,
  productType = "DEFAULT",
  alt,
  className,
  ...props
}: SafeImageProps) {
  const initialSrc = getProductImage(src, productType as ProductType);
  const [imgSrc, setImgSrc] = useState(initialSrc);

  useEffect(() => {
    setImgSrc(getProductImage(src, productType as ProductType));
  }, [src, productType]);

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt || "Imagem do produto"}
      className={className}
      onError={() => {
        if (imgSrc !== UNIVERSAL_FALLBACK_SVG) {
          setImgSrc(UNIVERSAL_FALLBACK_SVG);
        }
      }}
    />
  );
}
