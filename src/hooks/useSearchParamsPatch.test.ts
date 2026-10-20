// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useSearchParamsPatch } from "./useSearchParamsPatch";

const replaceMock = vi.fn();
const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, push: pushMock }),
  usePathname: () => "/admin",
}));

describe("useSearchParamsPatch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState(null, "", "/admin");
  });

  it("por padrão usa router.replace com scroll:false (filtro, não navegação)", () => {
    const { result } = renderHook(() => useSearchParamsPatch());
    result.current({ status: "pending" });

    expect(replaceMock).toHaveBeenCalledWith("/admin?status=pending", {
      scroll: false,
    });
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("com { push: true } usa router.push, preservando os demais params já na URL", () => {
    window.history.pushState(null, "", "/admin?pedido=abc123&status=pending");

    const { result } = renderHook(() => useSearchParamsPatch());
    result.current({ produto: "p1" }, { push: true });

    expect(pushMock).toHaveBeenCalledTimes(1);
    const [url, opts] = pushMock.mock.calls[0];
    expect(opts).toEqual({ scroll: false });
    // Ordem de query params não importa pro roteador, mas checar como string
    // simples aqui é suficiente e evita depender de URLSearchParams no teste.
    expect(url).toContain("pedido=abc123");
    expect(url).toContain("status=pending");
    expect(url).toContain("produto=p1");
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("valor undefined remove a chave em vez de escrever 'undefined' na URL", () => {
    window.history.pushState(null, "", "/admin?produto=p1&pedido=abc123");

    const { result } = renderHook(() => useSearchParamsPatch());
    result.current({ produto: undefined });

    expect(replaceMock).toHaveBeenCalledWith("/admin?pedido=abc123", {
      scroll: false,
    });
  });

  it("removendo a última chave, navega pra rota sem query string (sem '?' pendurado)", () => {
    window.history.pushState(null, "", "/admin?status=pending");

    const { result } = renderHook(() => useSearchParamsPatch());
    result.current({ status: undefined });

    expect(replaceMock).toHaveBeenCalledWith("/admin", { scroll: false });
  });
});
