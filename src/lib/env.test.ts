import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const ALL_VARS = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
] as const;

function stubAllValid() {
  for (const key of ALL_VARS) {
    vi.stubEnv(key, `valid-${key}`);
  }
}

describe("env", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("parseia com sucesso quando todas as envs estão presentes", async () => {
    stubAllValid();
    const { env } = await import("./env");
    expect(env.NEXT_PUBLIC_FIREBASE_PROJECT_ID).toBe(
      "valid-NEXT_PUBLIC_FIREBASE_PROJECT_ID"
    );
  });

  it("lança erro no boot nomeando a env faltante", async () => {
    stubAllValid();
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_API_KEY", "");

    await expect(import("./env")).rejects.toThrow(
      "NEXT_PUBLIC_FIREBASE_API_KEY"
    );
  });

  it("lança erro citando todas as envs faltantes de uma vez", async () => {
    stubAllValid();
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_API_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_FIREBASE_APP_ID", "");

    await expect(import("./env")).rejects.toThrow(
      /NEXT_PUBLIC_FIREBASE_API_KEY.*NEXT_PUBLIC_FIREBASE_APP_ID/
    );
  });
});
