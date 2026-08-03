// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import GlobalError from "./global-error";

const { captureException } = vi.hoisted(() => ({
  captureException: vi.fn(),
}));

vi.mock("@sentry/nextjs", () => ({
  captureException,
}));

describe("GlobalError", () => {
  beforeEach(() => {
    captureException.mockClear();
  });

  it("renderiza o fallback sem quebrar, mesmo sem Sentry configurado (DSN ausente)", () => {
    const error = Object.assign(new Error("falha simulada"), {
      digest: "abc123",
    });

    render(<GlobalError error={error} />);

    expect(screen.getByText("Algo deu errado")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Recarregar" })
    ).toBeInTheDocument();
  });

  it("chama Sentry.captureException com o erro recebido", () => {
    const error = Object.assign(new Error("falha simulada"), {
      digest: "abc123",
    });

    render(<GlobalError error={error} />);

    expect(captureException).toHaveBeenCalledTimes(1);
    expect(captureException).toHaveBeenCalledWith(error);
  });
});
