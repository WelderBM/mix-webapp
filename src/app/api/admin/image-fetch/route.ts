import { NextRequest, NextResponse } from "next/server";
import { bearerToken, isAdminToken } from "@/lib/imageSearch/requireAdmin";
import { downloadImage, DownloadError, UnsafeUrlError } from "@/lib/imageSearch/download";

// Baixa a foto escolhida na busca (#267) e devolve os bytes ao navegador,
// que comprime e envia ao Storage como uma foto tirada na loja.
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const ok = await isAdminToken(
    bearerToken(req.headers.get("authorization")),
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  );
  if (!ok) return NextResponse.json({ error: "Acesso só para a equipe." }, { status: 403 });
  const { url } = (await req.json().catch(() => ({}))) as { url?: unknown };
  if (typeof url !== "string" || url.length > 2048) {
    return NextResponse.json({ error: "Endereço inválido." }, { status: 400 });
  }
  try {
    const { bytes, contentType } = await downloadImage(url);
    return new NextResponse(Buffer.from(bytes), {
      headers: { "Content-Type": contentType, "Cache-Control": "no-store" },
    });
  } catch (e) {
    const known = e instanceof DownloadError || e instanceof UnsafeUrlError;
    return NextResponse.json(
      { error: known ? e.message : "Não foi possível baixar essa foto." },
      { status: known ? 422 : 502 },
    );
  }
}
