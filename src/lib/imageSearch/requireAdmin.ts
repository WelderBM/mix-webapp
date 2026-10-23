// Rotas de busca de foto (#267) só para admin. Sem credencial de servidor:
// o servidor lê, com o token do PRÓPRIO usuário, um documento que só admin
// pode ler (`intake_meta/summary`, regra `isAdmin()`). O Firestore valida
// o token e aplica exatamente a mesma regra do resto do admin (lista de
// equipe ou domínio da loja). 200 ou 404 = admin; 401/403 = não.

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

const cache = new Map<string, number>(); // token → validade (ms)
const TTL = 5 * 60_000;

export function bearerToken(header: string | null): string | null {
  const m = /^Bearer\s+(\S+)$/i.exec(header ?? "");
  return m ? m[1] : null;
}

export async function isAdminToken(
  token: string | null,
  projectId: string | undefined,
  fetchImpl: FetchLike = fetch,
  now = Date.now(),
): Promise<boolean> {
  if (!token || !projectId) return false;
  const until = cache.get(token);
  if (until && until > now) return true;
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/intake_meta/summary?mask.fieldPaths=x`;
  try {
    const res = await fetchImpl(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5_000),
    });
    const ok = res.status === 200 || res.status === 404;
    if (ok) {
      if (cache.size > 200) cache.clear();
      cache.set(token, now + TTL);
    }
    return ok;
  } catch {
    return false;
  }
}

export function resetAdminCache() {
  cache.clear();
}
