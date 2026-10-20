import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "./src"),
    },
  },
  test: {
    // Ambiente padrão: "node" (compatível com forks pool neste ambiente de CI)
    // Arquivos de componentes React usam @vitest-environment happy-dom por anotação
    environment: "node",
    globals: true,
    pool: "forks",
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error — singleFork é uma opção válida em runtime no vitest v4
    singleFork: true,
    setupFiles: ["./src/test/setup.ts"],
    // Evita que worktrees aninhados de sessões de agente (scripts/wt-new.mjs, AGENTS.md §3)
    // sejam escaneados pela suíte do worktree principal (issue #164).
    exclude: [...configDefaults.exclude, "**/.claude/worktrees/**"],
  },
});
