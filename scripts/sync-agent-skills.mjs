import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const agentsSkills = path.join(rootDir, '.agents', 'skills');
const claudeSkills = path.join(rootDir, '.claude', 'skills');

if (!fs.existsSync(agentsSkills)) {
  console.log('[Sync Skills] Pasta .agents/skills não encontrada. Nada a sincronizar.');
  process.exit(0);
}

try {
  const stat = fs.lstatSync(claudeSkills);
  if (stat.isSymbolicLink() || stat.isDirectory()) {
    // Se for uma junção/symlink ativa, o SO resolve automaticamente
    console.log('[Sync Skills] Link simbólico/junção ativo em .claude/skills. Tudo sincronizado.');
    process.exit(0);
  }
} catch {
  // Pasta .claude/skills não existe, copiar
}

console.log('[Sync Skills] Sincronizando arquivos de .agents/skills para .claude/skills...');
fs.cpSync(agentsSkills, claudeSkills, { recursive: true, force: true });
console.log('[Sync Skills] Sincronização concluída com sucesso!');
