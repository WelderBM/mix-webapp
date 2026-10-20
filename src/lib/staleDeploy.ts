// Aba aberta antes de um deploy tenta carregar chunks JS que a versão nova
// não serve mais. Recarregar resolve, então faz isso sozinho — no máximo
// uma vez por janela de 30s, pra nunca entrar em loop se o erro persistir.
const STALE_DEPLOY_ERROR =
  /ChunkLoadError|Loading (CSS )?chunk|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i;
const RELOAD_KEY = "stale-deploy-reload-at";
const RELOAD_WINDOW_MS = 30_000;

export function shouldAutoReload(error: Error, now = Date.now()): boolean {
  if (!STALE_DEPLOY_ERROR.test(`${error.name} ${error.message}`)) return false;
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0);
    if (now - last < RELOAD_WINDOW_MS) return false;
    sessionStorage.setItem(RELOAD_KEY, String(now));
    return true;
  } catch {
    return false;
  }
}
