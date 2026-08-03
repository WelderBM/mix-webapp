import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const ALL_VARS = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
] as const;

function stubRequiredFirebaseVars() {
  for (const key of ALL_VARS) {
    vi.stubEnv(key, `valid-${key}`);
  }
}

const sentryInit = vi.fn();
const captureRouterTransitionStart = vi.fn();

vi.mock("@sentry/nextjs", () => ({
  init: sentryInit,
  captureRouterTransitionStart,
}));

describe("instrumentation-client (side-effect no import)", () => {
  beforeEach(() => {
    vi.resetModules();
    sentryInit.mockClear();
    stubRequiredFirebaseVars();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("não chama Sentry.init quando NEXT_PUBLIC_SENTRY_DSN não está setado", async () => {
    await import("./instrumentation-client");

    expect(sentryInit).not.toHaveBeenCalled();
  });

  it("chama Sentry.init com o dsn certo quando NEXT_PUBLIC_SENTRY_DSN está setado", async () => {
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "https://example.ingest.sentry.io/456");

    await import("./instrumentation-client");

    expect(sentryInit).toHaveBeenCalledTimes(1);
    expect(sentryInit).toHaveBeenCalledWith(
      expect.objectContaining({ dsn: "https://example.ingest.sentry.io/456" })
    );
  });

  it("exporta onRouterTransitionStart apontando pra Sentry.captureRouterTransitionStart", async () => {
    const mod = await import("./instrumentation-client");
    expect(mod.onRouterTransitionStart).toBe(captureRouterTransitionStart);
  });
});
