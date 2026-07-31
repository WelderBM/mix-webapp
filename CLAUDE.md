# Mix Novidades — mix-webapp (Claude Code Entrypoint)

> **Nota:** As diretivas completas de suporte a agentes foram centralizadas em **[AGENTS.md](file:///C:/Users/welde/Dev/Projetos/MixNovidades/mix-webapp/AGENTS.md)** para compartilhamento igualitário entre Claude Code, Gemini, Codex, Grok e Kimi.
> As skills do projeto estão centralizadas em `.agents/skills/` e espelhadas em `.claude/skills/`.

---

## Roteiro Rápido para Claude Code

1. **Leitura Obrigatória**: Leia o arquivo **[AGENTS.md](file:///C:/Users/welde/Dev/Projetos/MixNovidades/mix-webapp/AGENTS.md)** no início de cada sessão.
2. **Lições Aprendidas**: Consulte e atualize **[docs/claude-lessons.md](file:///C:/Users/welde/Dev/Projetos/MixNovidades/mix-webapp/docs/claude-lessons.md)**.
3. **Ritual Pré-Commit**:
   - `npx tsc --noEmit`
   - `npx vitest run`
   - `npx next build` (se houver mudanças estruturais)
4. **Skills**: Todas as 13 skills continuam disponíveis em `.claude/skills/` (apontando via link simbólico/junção para `.agents/skills/`).
