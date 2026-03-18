import { vi } from "vitest";
import "@testing-library/jest-dom";

// Mock do Firebase para todos os testes — evita conexão real com o banco
vi.mock("@/lib/firebase", () => ({
  db: {},
  auth: {},
  storage: {},
}));

// Mock do next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock do sonner (toast)
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
  Toaster: () => null,
}));
