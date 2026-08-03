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
const captureRequestError = vi.fn();

vi.mock("@sentry/nextjs", () => ({
  init: sentryInit,
  captureRequestError,
}));

describe("instrumentation.register", () => {
  beforeEach(() => {
    vi.resetModules();
    sentryInit.mockClear();
    stubRequiredFirebaseVars();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("não chama Sentry.init quando NEXT_PUBLIC_SENTRY_DSN não está setado", async () => {
    vi.stubEnv("NEXT_RUNTIME", "nodejs");

    const { register } = await import("./instrumentation");
    await register();

    expect(sentryInit).not.toHaveBeenCalled();
  });

  it("chama Sentry.init com o dsn quando NEXT_RUNTIME é nodejs", async () => {
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "https://example.ingest.sentry.io/123");
    vi.stubEnv("NEXT_RUNTIME", "nodejs");

    const { register } = await import("./instrumentation");
    await register();

    expect(sentryInit).toHaveBeenCalledTimes(1);
    expect(sentryInit).toHaveBeenCalledWith(
      expect.objectContaining({ dsn: "https://example.ingest.sentry.io/123" })
    );
  });

  it("chama Sentry.init com o dsn quando NEXT_RUNTIME é edge", async () => {
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "https://example.ingest.sentry.io/123");
    vi.stubEnv("NEXT_RUNTIME", "edge");

    const { register } = await import("./instrumentation");
    await register();

    expect(sentryInit).toHaveBeenCalledTimes(1);
    expect(sentryInit).toHaveBeenCalledWith(
      expect.objectContaining({ dsn: "https://example.ingest.sentry.io/123" })
    );
  });

  it("não chama Sentry.init quando NEXT_RUNTIME não é nodejs nem edge, mesmo com DSN setado", async () => {
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "https://example.ingest.sentry.io/123");
    vi.stubEnv("NEXT_RUNTIME", "");

    const { register } = await import("./instrumentation");
    await register();

    expect(sentryInit).not.toHaveBeenCalled();
  });

  it("exporta onRequestError apontando pra Sentry.captureRequestError", async () => {
    const instrumentation = await import("./instrumentation");
    expect(instrumentation.onRequestError).toBe(captureRequestError);
  });
});
