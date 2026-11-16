#!/usr/bin/env node
// Aplica uma proposta de regras (governanca-proposta.json) sobre .claude/governanca.json.
// Sem argumentos: mostra a diferença e um código. "confirmar <código>": aplica exatamente o que foi mostrado.
// Só o usuário confirma: o gate bloqueia o agente de rodar a confirmação.
const fs = require('fs');
const path = require('path');
const { MARCADOR, acharRaiz, validarConfig, dirEstado, hash8 } = require('./lib');

const sair = (msg, codigo = 0) => { console.log(msg); process.exit(codigo); };
const raiz = acharRaiz();
if (!raiz) sair('Workspace não governado. Rode /governanca:iniciar primeiro.', 1);

const arqProposta = path.join(raiz, 'governanca-proposta.json');
const arqConfig = path.join(raiz, MARCADOR);
if (!fs.existsSync(arqProposta)) sair('Não há proposta (governanca-proposta.json). Use /governanca:regra para criar uma.');

const texto = fs.readFileSync(arqProposta, 'utf8');
let proposta;
try { proposta = JSON.parse(texto); validarConfig(proposta); } catch (err) { sair(`Proposta inválida: ${err.message}. Nada foi aplicado.`, 1); }
let atual = {};
try { atual = JSON.parse(fs.readFileSync(arqConfig, 'utf8')); } catch { /* config atual ilegível: a proposta a substitui */ }

const porId = (cfg) => new Map((cfg.regras || []).map((r) => [r.id, JSON.stringify(r)]));
const a = porId(atual);
const p = porId(proposta);
const linhas = [];
for (const [id, r] of p) {
  if (!a.has(id)) linhas.push(`+ regra ${id}: ${r}`);
  else if (a.get(id) !== r) linhas.push(`~ regra ${id}: ${a.get(id)}  →  ${r}`);
}
for (const id of a.keys()) if (!p.has(id)) linhas.push(`- regra ${id} (removida)`);
for (const campo of ['exigirSpec', 'verificacao']) {
  const antes = JSON.stringify(atual[campo]);
  const depois = JSON.stringify(proposta[campo]);
  if (antes !== depois) linhas.push(`~ ${campo}: ${antes}  →  ${depois}`);
}
const codigo = hash8(texto);
const [acao, informado] = process.argv.slice(2);

if (acao !== 'confirmar') {
  sair(linhas.length
    ? `Mudanças propostas:\n${linhas.join('\n')}\n\nPara aplicar: /governanca:aplicar confirmar ${codigo}`
    : 'A proposta é igual à configuração atual. Nada a aplicar.');
}
if (informado !== codigo) sair(`Código não confere (esperado ${codigo}). A proposta mudou desde a revisão? Rode /governanca:aplicar de novo.`, 1);

const hist = path.join(dirEstado(raiz), 'historico');
fs.mkdirSync(hist, { recursive: true });
if (fs.existsSync(arqConfig))
  fs.copyFileSync(arqConfig, path.join(hist, `governanca-${new Date().toISOString().replace(/[:.]/g, '-')}.json`));
fs.writeFileSync(arqConfig, JSON.stringify(proposta, null, 2) + '\n');
fs.unlinkSync(arqProposta);
sair(`Aplicado (${linhas.length} mudança(s)). Versão anterior salva em .governanca/historico/. Vale a partir da próxima ferramenta.`);
