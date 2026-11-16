#!/usr/bin/env node
// Mostra o estado da governança no workspace: config, regras, pendências e últimos bloqueios.
const fs = require('fs');
const path = require('path');
const { acharRaiz, lerConfig, lerEstado, dirEstado } = require('./lib');

const raiz = acharRaiz();
if (!raiz) { console.log('Workspace NÃO governado. Para ativar: /governanca:iniciar'); process.exit(0); }

const out = [`Governado: ${raiz}`];
try {
  const cfg = lerConfig(raiz);
  out.push(`Config: válida · exigirSpec=${cfg.exigirSpec} · verificação=${cfg.verificacao ? `\`${cfg.verificacao.comando}\` (${cfg.verificacao.timeoutSeg} s)` : 'nenhuma'}`);
  out.push(cfg.regras.length
    ? 'Regras do projeto:\n' + cfg.regras.map((r) => `  - ${r.id} [${r.decisao}] ${r.motivo || ''}`).join('\n')
    : 'Regras do projeto: nenhuma');
} catch (err) {
  out.push(`Config: INVÁLIDA (${err.message}). Edições e comandos do agente estão bloqueados.`);
}
out.push('Gates embutidos: segredo, envelope, privilegio, destrutivo, force-push, exec-remoto (deny); push, deploy, descarte, banco (ask); notes e verificacao (parada).');

const est = lerEstado(raiz);
out.push(`Pendências: NOTES ${est.sujo ? `desatualizado (${(est.alterados || []).join(', ')})` : 'em dia'} · verificação ${est.pendenteVerificacao ? 'pendente' : 'em dia'}`);
if (fs.existsSync(path.join(raiz, 'governanca-proposta.json'))) out.push('Proposta de regras aguardando revisão: /governanca:aplicar');

try {
  const linhas = fs.readFileSync(path.join(dirEstado(raiz), 'auditoria.jsonl'), 'utf8').trim().split('\n');
  const bloqueios = linhas.map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter((x) => x && x.gate);
  out.push(`Auditoria: ${linhas.length} registro(s), ${bloqueios.length} decisão(ões) de gate.`);
  if (bloqueios.length)
    out.push('Últimas decisões de gate:\n' + bloqueios.slice(-5)
      .map((b) => `  - ${b.ts.slice(0, 16).replace('T', ' ')} ${b.decisao} ${b.gate} ${b.ferramenta}: ${b.alvo}`).join('\n'));
} catch { out.push('Auditoria: vazia.'); }

console.log(out.join('\n'));
