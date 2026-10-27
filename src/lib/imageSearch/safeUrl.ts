import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

// Download de imagem pelo servidor (#267): a URL vem do navegador, então
// sem estas travas a rota viraria um proxy para a rede interna da Vercel
// (SSRF). Só https, só endereço público, e cada redirecionamento é
// validado de novo pela rota.

function ipv4Blocked(ip: string): boolean {
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) || // CGNAT
    (a === 169 && b === 254) || // link-local / metadata da nuvem
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224 // multicast e reservado
  );
}

export function isBlockedIp(ip: string): boolean {
  const v = isIP(ip);
  if (v === 4) return ipv4Blocked(ip);
  if (v !== 6) return true;
  const x = ip.toLowerCase();
  // IPv4 embutido no IPv6 (::ffff:10.0.0.1).
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(x);
  if (mapped) return ipv4Blocked(mapped[1]);
  return (
    x === "::" ||
    x === "::1" ||
    x.startsWith("fc") ||
    x.startsWith("fd") || // privado (ULA)
    x.startsWith("fe8") ||
    x.startsWith("fe9") ||
    x.startsWith("fea") ||
    x.startsWith("feb") || // link-local
    x.startsWith("ff") // multicast
  );
}

export class UnsafeUrlError extends Error {}

// Lança se a URL não for https pública. `resolve` é injetável nos testes.
export async function assertPublicHttpsUrl(
  raw: string,
  resolve: (host: string) => Promise<string[]> = async (h) =>
    (await lookup(h, { all: true })).map((r) => r.address),
): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new UnsafeUrlError("Endereço inválido.");
  }
  if (url.protocol !== "https:") throw new UnsafeUrlError("Só https.");
  if (url.username || url.password) throw new UnsafeUrlError("Endereço com usuário/senha.");
  if (url.port && url.port !== "443") throw new UnsafeUrlError("Porta não permitida.");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const ips = isIP(host) ? [host] : await resolve(host).catch(() => []);
  if (ips.length === 0) throw new UnsafeUrlError("Endereço não encontrado.");
  if (ips.some(isBlockedIp)) throw new UnsafeUrlError("Endereço não permitido.");
  return url;
}
