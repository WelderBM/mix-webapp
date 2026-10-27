import { describe, it, expect, vi, beforeEach } from "vitest";
import type { User } from "firebase/auth";

// doc() devolve o caminho montado pra os testes conferirem QUAL doc foi lido.
vi.mock("firebase/firestore", () => ({
  doc: vi.fn((_db: unknown, ...segments: string[]) => segments.join("/")),
  getDoc: vi.fn(),
}));

vi.mock("firebase/auth", () => ({
  onAuthStateChanged: vi.fn(),
  signOut: vi.fn(),
  signInWithPopup: vi.fn(),
  GoogleAuthProvider: vi.fn(),
}));

vi.mock("@/lib/firebase", () => ({
  auth: { currentUser: null },
  db: {},
}));

import { getDoc } from "firebase/firestore";
import { useAuthStore } from "@/store/authStore";

const getDocMock = vi.mocked(getDoc);

function snap(data: Record<string, unknown> | undefined) {
  return { exists: () => data !== undefined, data: () => data } as never;
}

function user(email: string | null, emailVerified = true): User {
  return { uid: "u1", email, emailVerified } as User;
}

/** Responde getDoc por caminho: staff/{email} e settings/general. */
function firestoreWith(docs: Record<string, Record<string, unknown>>) {
  getDocMock.mockImplementation(async (ref: unknown) => snap(docs[ref as string]));
}

describe("authStore.checkAdminRole", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ isAdmin: false });
  });

  it("aprova e-mail na whitelist com active: true", async () => {
    firestoreWith({ "whitelisted_staff/dono@mix.com": { active: true } });

    await expect(
      useAuthStore.getState().checkAdminRole(user("dono@mix.com"))
    ).resolves.toBe(true);
    expect(useAuthStore.getState().isAdmin).toBe(true);
  });

  it("procura o doc com o e-mail em minúsculas (IDs são gravados assim)", async () => {
    firestoreWith({ "whitelisted_staff/dono@mix.com": { active: true } });

    await expect(
      useAuthStore.getState().checkAdminRole(user("Dono@Mix.com"))
    ).resolves.toBe(true);
  });

  it("recusa quando o doc existe mas active não é true", async () => {
    firestoreWith({ "whitelisted_staff/ex@mix.com": { active: false } });

    await expect(
      useAuthStore.getState().checkAdminRole(user("ex@mix.com"))
    ).resolves.toBe(false);
    expect(useAuthStore.getState().isAdmin).toBe(false);
  });

  it("aprova pelo domínio corporativo de settings/general", async () => {
    firestoreWith({ "settings/general": { allowedStaffDomain: "mix.com" } });

    await expect(
      useAuthStore.getState().checkAdminRole(user("caixa@mix.com"))
    ).resolves.toBe(true);
  });

  it("recusa quem não está na whitelist nem no domínio", async () => {
    firestoreWith({ "settings/general": { allowedStaffDomain: "mix.com" } });

    await expect(
      useAuthStore.getState().checkAdminRole(user("cliente@gmail.com"))
    ).resolves.toBe(false);
  });

  it("recusa e-mail não verificado sem consultar o Firestore", async () => {
    await expect(
      useAuthStore.getState().checkAdminRole(user("dono@mix.com", false))
    ).resolves.toBe(false);
    expect(getDocMock).not.toHaveBeenCalled();
  });

  it("recusa sem usuário (nem argumento nem auth.currentUser)", async () => {
    await expect(useAuthStore.getState().checkAdminRole()).resolves.toBe(false);
    expect(getDocMock).not.toHaveBeenCalled();
  });

  it("repassa erro do Firestore em vez de tratar como 'não autorizado'", async () => {
    const err = Object.assign(new Error("offline"), { code: "unavailable" });
    getDocMock.mockRejectedValue(err);

    await expect(
      useAuthStore.getState().checkAdminRole(user("dono@mix.com"))
    ).rejects.toBe(err);
    expect(useAuthStore.getState().isAdmin).toBe(false);
  });
});
