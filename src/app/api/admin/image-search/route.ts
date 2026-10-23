import { NextRequest, NextResponse } from "next/server";
import { bearerToken, isAdminToken } from "@/lib/imageSearch/requireAdmin";
import { ProviderError, searchSerperImages } from "@/lib/imageSearch/provider";

// Busca de foto de produto para o admin (#267).
//  GET  → { enabled }: o botão "Buscar foto" só aparece com a chave.
//  POST { q } → { results }: miniaturas para a atendente escolher.
export const runtime = "nodejs";

const projectId = () => process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

async function denied(req: NextRequest) {
  const ok = await isAdminToken(bearerToken(req.headers.get("authorization")), projectId());
  return ok ? null : NextResponse.json({ error: "Acesso só para a equipe." }, { status: 403 });
}

export async function GET(req: NextRequest) {
  const deny = await denied(req);
  if (deny) return deny;
  return NextResponse.json({ enabled: !!process.env.SERPER_API_KEY });
}

export async function POST(req: NextRequest) {
  const deny = await denied(req);
  if (deny) return deny;
  const key = process.env.SERPER_API_KEY;
  if (!key) return NextResponse.json({ error: "Busca de foto desligada." }, { status: 503 });
  const { q } = (await req.json().catch(() => ({}))) as { q?: unknown };
  const query = typeof q === "string" ? q.trim().slice(0, 120) : "";
  if (query.length < 2) return NextResponse.json({ error: "Digite o que buscar." }, { status: 400 });
  try {
    return NextResponse.json({ results: await searchSerperImages(query, key) });
  } catch (e) {
    const msg = e instanceof ProviderError ? e.message : "Não foi possível buscar agora.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
