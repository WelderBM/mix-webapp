// Foto de celular sai com 3–5 MB; subir isso pelo 4G da loja e servir na
// vitrine é lento. Reduz no próprio aparelho antes do upload (#200).

export const MAX_SIDE = 1200;
export const QUALITY = 0.8;

export function fitWithin(
  width: number,
  height: number,
  max = MAX_SIDE,
): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height));
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

export async function compressImage(file: File): Promise<Blob> {
  // imageOrientation: "from-image" respeita a rotação EXIF da câmera.
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  const { width, height } = fitWithin(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const toBlob = (type: string) =>
    new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, type, QUALITY),
    );
  // Safari antigo não gera WebP e devolve PNG (enorme) — cai pra JPEG.
  const webp = await toBlob("image/webp");
  if (webp && webp.type === "image/webp") return webp;
  const jpeg = await toBlob("image/jpeg");
  if (!jpeg) throw new Error("Não foi possível processar a foto.");
  return jpeg;
}
