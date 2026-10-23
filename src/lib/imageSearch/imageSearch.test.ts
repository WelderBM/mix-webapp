import { beforeEach, describe, expect, it, vi } from "vitest";
import { assertPublicHttpsUrl, isBlockedIp } from "./safeUrl";
import { mapSerperImages, searchSerperImages } from "./provider";
import { bearerToken, isAdminToken, resetAdminCache } from "./requireAdmin";
import { downloadImage, MAX_BYTES } from "./download";

const publicDns = async () => ["142.250.0.1"];

describe("endereço seguro (anti-SSRF)", () => {
  it("bloqueia rede interna, loopback, metadata da nuvem e IPv6 privado", () => {
    for (const ip of ["127.0.0.1", "10.1.2.3", "172.20.0.1", "192.168.0.10", "169.254.169.254", "100.64.0.1", "0.0.0.0", "::1", "fd00::1", "fe80::1", "::ffff:10.0.0.1"]) {
      expect(isBlockedIp(ip), ip).toBe(true);
    }
    expect(isBlockedIp("142.250.0.1")).toBe(false);
    expect(isBlockedIp("2607:f8b0::1")).toBe(false);
  });

  it("só https público; nome que resolve para IP interno é recusado", async () => {
    await expect(assertPublicHttpsUrl("http://exemplo.com/a.jpg", publicDns)).rejects.toThrow("https");
    await expect(assertPublicHttpsUrl("https://user:x@exemplo.com/a.jpg", publicDns)).rejects.toThrow();
    await expect(assertPublicHttpsUrl("https://exemplo.com:8443/a.jpg", publicDns)).rejects.toThrow("Porta");
    await expect(assertPublicHttpsUrl("https://169.254.169.254/latest")).rejects.toThrow("permitido");
    await expect(assertPublicHttpsUrl("https://interno.exemplo/a.jpg", async () => ["10.0.0.5"])).rejects.toThrow("permitido");
    await expect(assertPublicHttpsUrl("https://exemplo.com/a.jpg", publicDns)).resolves.toBeInstanceOf(URL);
  });
});

describe("provedor Serper", () => {
  it("só devolve resultados https e no formato comum", () => {
    const out = mapSerperImages([
      { title: "Fita", imageUrl: "https://a.com/f.jpg", thumbnailUrl: "https://t.com/f", imageWidth: 800, imageHeight: 600, domain: "a.com" },
      { title: "inseguro", imageUrl: "http://b.com/f.jpg", thumbnailUrl: "https://t.com/g" },
    ]);
    expect(out).toEqual([{ title: "Fita", imageUrl: "https://a.com/f.jpg", thumbnailUrl: "https://t.com/f", width: 800, height: 600, domain: "a.com" }]);
  });

  it("manda a chave no cabeçalho e avisa quando a cota acaba", async () => {
    const ok = vi.fn(async () => Response.json({ images: [] }));
    await searchSerperImages("fita amarela", "KEY", ok);
    const [url, init] = ok.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://google.serper.dev/images");
    expect((init.headers as Record<string, string>)["X-API-KEY"]).toBe("KEY");
    expect(JSON.parse(init.body as string)).toMatchObject({ q: "fita amarela", gl: "br" });
    await expect(searchSerperImages("x", "K", async () => new Response("", { status: 429 }))).rejects.toThrow("cota");
  });
});

describe("só admin usa as rotas", () => {
  beforeEach(() => resetAdminCache());

  it("lê o token do cabeçalho Bearer", () => {
    expect(bearerToken("Bearer abc.def")).toBe("abc.def");
    expect(bearerToken("Basic abc")).toBeNull();
    expect(bearerToken(null)).toBeNull();
  });

  it("200/404 do documento só-admin = admin; 403 = não; sem token nem chama", async () => {
    const f = (status: number) => vi.fn(async () => new Response("{}", { status }));
    expect(await isAdminToken("t1", "proj", f(200))).toBe(true);
    expect(await isAdminToken("t2", "proj", f(404))).toBe(true);
    expect(await isAdminToken("t3", "proj", f(403))).toBe(false);
    const never = f(200);
    expect(await isAdminToken(null, "proj", never)).toBe(false);
    expect(never).not.toHaveBeenCalled();
  });

  it("guarda a resposta positiva por 5 min (economiza leitura)", async () => {
    const f = vi.fn(async () => new Response("{}", { status: 200 }));
    await isAdminToken("t", "proj", f, 0);
    await isAdminToken("t", "proj", f, 60_000);
    expect(f).toHaveBeenCalledTimes(1);
    await isAdminToken("t", "proj", f, 6 * 60_000);
    expect(f).toHaveBeenCalledTimes(2);
  });
});

describe("download da foto escolhida", () => {
  const img = (bytes: number, type = "image/jpeg") =>
    new Response(new Uint8Array(bytes), { status: 200, headers: { "content-type": type } });

  it("baixa imagem pública", async () => {
    const out = await downloadImage("https://a.com/f.jpg", async () => img(10), publicDns);
    expect(out.contentType).toBe("image/jpeg");
    expect(out.bytes.byteLength).toBe(10);
  });

  it("recusa o que não é imagem e o que passa de 5 MB", async () => {
    await expect(downloadImage("https://a.com/f", async () => img(10, "text/html"), publicDns)).rejects.toThrow("não é uma imagem");
    await expect(downloadImage("https://a.com/f.jpg", async () => img(MAX_BYTES + 1), publicDns)).rejects.toThrow("grande");
  });

  it("redirecionamento para rede interna é barrado", async () => {
    const fetchImpl = vi.fn(async (url: string) =>
      url.startsWith("https://a.com")
        ? new Response(null, { status: 302, headers: { location: "https://interno.lan/x.jpg" } })
        : img(10),
    );
    const dns = async (h: string) => (h === "interno.lan" ? ["192.168.0.2"] : ["142.250.0.1"]);
    await expect(downloadImage("https://a.com/f.jpg", fetchImpl, dns)).rejects.toThrow("permitido");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
