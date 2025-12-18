"use client";

import { useState, useEffect } from "react";
import Image, { ImageProps } from "next/image";
import { getDynamicPlaceholder, getProductImage } from "@/lib/image-utils";
import { ProductType } from "@/types";

interface SafeImageProps extends Omit<ImageProps, "src"> {
  src?: string | null;
  name?: string;
}

export function SafeImage({
  src,
  alt,
  className,
  name,
  ...props
}: SafeImageProps) {
  const initialSrc = getProductImage(src, name);
  const [imgSrc, setImgSrc] = useState(initialSrc);

  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImgSrc(getProductImage(src, name));
    setHasError(false);
  }, [src, name]);
  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt || "Imagem do produto"}
      className={className}
      onError={() => {
        if (!hasError) {
          setHasError(true);
          const fallback = getDynamicPlaceholder(
            (name || "Sem imagem") as string
          );

          if (imgSrc !== fallback) {
            setImgSrc(fallback);
          }
        }
      }}
    />
  );
}
