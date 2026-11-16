#!/usr/bin/env node
// Ativa a governança num workspace: cria .claude/governanca.json, SPEC.md e NOTES.md.
// Uso: node iniciar.js [pasta]   (padrão: pasta do projeto atual)
const fs = require('fs');
const path = require('path');
const { MARCADOR, PLUGIN } = require('./lib');

const alvo = path.resolve(process.argv[2] || process.env.CLAUDE_PROJECT_DIR || process.cwd());
const modelos = path.join(PLUGIN, 'templates');
const sair = (msg, codigo = 0) => { console.log(msg); process.exit(codigo); };

if (!fs.existsSync(alvo) || !fs.statSync(alvo).isDirectory()) sair(`Pasta inexistente: ${alvo}`, 1);
if (fs.existsSync(path.join(alvo, MARCADOR))) sair(`Workspace já governado: ${alvo}. Nada foi alterado.`);
if (fs.existsSync(path.join(alvo, '.claude', 'hooks', 'gate.js')) && fs.existsSync(path.join(alvo, '.claude', 'governanca.md')))
  sair('Kit antigo (instalar.js) detectado em .claude/hooks/. Remova-o antes (README, seção "Migrar do kit antigo"). Nada foi alterado.', 1);

const criados = [];
fs.mkdirSync(path.join(alvo, '.claude'), { recursive: true });
fs.copyFileSync(path.join(modelos, 'governanca.json'), path.join(alvo, MARCADOR));
criados.push(MARCADOR.replace(/\\/g, '/'));
for (const f of ['SPEC.md', 'NOTES.md']) {
  const d = path.join(alvo, f);
  if (!fs.existsSync(d)) { fs.copyFileSync(path.join(modelos, f), d); criados.push(f); }
}

// Estado e auditoria são locais: fora do git.
const gi = path.join(alvo, '.gitignore');
const giAtual = fs.existsSync(gi) ? fs.readFileSync(gi, 'utf8') : '';
if (!/^\.governanca\/?\s*$/m.test(giAtual)) {
  fs.appendFileSync(gi, (giAtual && !giAtual.endsWith('\n') ? '\n' : '') + '.governanca/\n');
  criados.push('.gitignore (+ .governanca/)');
}

sair(`Governança ativada em ${alvo}.\nCriados: ${criados.join(', ')}.\nVale a partir da próxima sessão (ou /clear). Próximo passo: /governanca:spec.`);
