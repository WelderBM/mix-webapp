// Rastreio em evidência (relatório 27/10): depois da compra, o ícone
// "Meu pedido" ao lado do carrinho pulsa com um balão "Seu pedido fica
// aqui" até o cliente tocar nele, mesmo que já tenha visto o rastreio.
// Tudo no localStorage do aparelho; modo privado só perde o destaque.

export const LAST_ORDER_KEY = "lastOrderId";
const HINT_KEY = "trackingHint";
const INVITE_KEY = "groupInviteSeen";
export const TRACKING_EVENT = "mix:tracking";

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string | null) {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // modo privado / armazenamento bloqueado: segue sem lembrar
  }
  window.dispatchEvent(new Event(TRACKING_EVENT));
}

export const lastOrderId = () => read(LAST_ORDER_KEY);
export const trackingHintOn = () => read(HINT_KEY) === "1";

// Checkout: guarda o pedido e liga o destaque do ícone.
export function rememberOrder(id: string) {
  write(LAST_ORDER_KEY, id);
  write(HINT_KEY, "1");
}

export const dismissTrackingHint = () => write(HINT_KEY, null);

// Convite do grupo: aparece uma vez por aparelho.
export const groupInviteSeen = () => read(INVITE_KEY) === "1";
export const markGroupInviteSeen = () => write(INVITE_KEY, "1");
