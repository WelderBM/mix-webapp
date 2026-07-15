import { NextRequest, NextResponse } from "next/server";

// Checagem server-side da senha de Ferramentas de Sistema / Importação em
// Lote. O valor esperado (SYSTEM_TOOLS_PASSWORD) NÃO tem prefixo
// NEXT_PUBLIC_, então nunca é enviado ao bundle do navegador — diferente da
// NEXT_PUBLIC_ADMIN_PASSWORD existente (não usada em lugar nenhum), que
// ficaria visível a qualquer um inspecionando o JS.
export async function POST(req: NextRequest) {
  const expected = process.env.SYSTEM_TOOLS_PASSWORD;

  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "SYSTEM_TOOLS_PASSWORD não configurada no ambiente." },
      { status: 500 }
    );
  }

  const { password } = await req.json().catch(() => ({ password: "" }));

  if (typeof password === "string" && password === expected) {
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false }, { status: 401 });
}
