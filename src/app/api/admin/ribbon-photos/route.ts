import { NextRequest, NextResponse } from "next/server";
import { bearerToken, isAdminToken } from "@/lib/imageSearch/requireAdmin";
import { searchSerperImages } from "@/lib/imageSearch/provider";
import { albanoCatalog } from "@/lib/ribbonPhotos/albano";
import { findRibbonPhotos, type RibbonPhotoItem } from "@/lib/ribbonPhotos/find";

// Fotos reais das fitas no cadastro pelo Noturno (relatório 27/10).
// POST { items: [{ id, name, ean, brand }] } (até 40) →
//   { photos: { [id]: { urls, source } } }
// O navegador baixa cada foto por /api/admin/image-fetch e envia ao Storage.
export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_ITEMS = 40;

export async function POST(req: NextRequest) {
  const ok = await isAdminToken(
    bearerToken(req.headers.get("authorization")),
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  );
  if (!ok) return NextResponse.json({ error: "Acesso só para a equipe." }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as { items?: unknown };
  const raw = Array.isArray(body.items) ? body.items.slice(0, MAX_ITEMS) : [];
  const items: RibbonPhotoItem[] = raw
    .filter((i): i is Record<string, unknown> => !!i && typeof i === "object")
    .filter((i) => typeof i.id === "string" && typeof i.name === "string")
    .map((i) => ({
      id: String(i.id).slice(0, 100),
      name: String(i.name).slice(0, 200),
      ean: typeof i.ean === "string" ? i.ean.slice(0, 20) : null,
      brand: typeof i.brand === "string" ? i.brand.slice(0, 40) : null,
    }));
  if (items.length === 0) return NextResponse.json({ error: "Nenhuma fita." }, { status: 400 });

  const key = process.env.SERPER_API_KEY;
  const search = key ? (q: string) => searchSerperImages(q, key) : null;
  const photos = await findRibbonPhotos(items, await albanoCatalog(), search);
  return NextResponse.json({ photos });
}
