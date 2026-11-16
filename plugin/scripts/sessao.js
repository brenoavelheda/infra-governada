// SessionStart: entra no ciclo governado. Injeta protocolo, regras, SPEC, plano e NOTES.
// Após /compact, faz a recuperação. Inerte fora de workspace governado.
const fs = require('fs');
const path = require('path');
const { PLUGIN, acharRaiz, lerEntrada, lerConfig, lerEstado, responder } = require('./lib');

const e = lerEntrada();
const raiz = acharRaiz(e);
if (!raiz) process.exit(0);

function ler(nome, max = 6000) {
  try {
    const t = fs.readFileSync(path.resolve(raiz, nome), 'utf8');
    return t.length > max ? t.slice(0, max) + '\n[...truncado]' : t;
  } catch { return null; }
}

const partes = [`SISTEMA GOVERNADO ATIVO (plugin governanca). Raiz: ${raiz}`,
  fs.readFileSync(path.join(PLUGIN, 'protocolo.md'), 'utf8')];

let cfg = { exigirSpec: true, verificacao: null, regras: [] };
try {
  cfg = lerConfig(raiz);
  if (cfg.regras.length)
    partes.push('REGRAS DO PROJETO (gates em código):\n' +
      cfg.regras.map((r) => `- ${r.id} [${r.decisao}]: ${r.motivo || r.descricao || ''}`).join('\n'));
  if (cfg.verificacao) partes.push(`VERIFICAÇÃO AO ENCERRAR: \`${cfg.verificacao.comando}\` precisa passar quando houver arquivos alterados.`);
} catch (err) {
  partes.push(`AVISO: .claude/governanca.json inválido (${err.message}). Edições e comandos ficam bloqueados até o usuário corrigir.`);
}

if (e.source === 'compact')
  partes.push('RECUPERAÇÃO pós-compactação: retome do "Próximo passo" do NOTES.md; não refaça o que consta como feito.');

const spec = ler('SPEC.md');
if (!spec || spec.includes('<!-- TEMPLATE -->')) {
  if (cfg.exigirSpec) partes.push('SPEC ausente ou não preenchida: antes de implementar qualquer coisa, conduza o /governanca:spec com o usuário.');
} else {
  partes.push('=== SPEC.md ===\n' + spec);
  // Plano detalhado (Superpowers) apontado na SPEC: injeta o caminho e a próxima tarefa aberta.
  const ref = spec.match(/^Plano detalhado:\s*`?([^`\n]+?)`?\s*$/m);
  if (ref && !/^(nenhum|<)/i.test(ref[1])) {
    const caminho = ref[1].trim();
    const plano = ler(caminho, 500000);
    if (!plano) partes.push(`AVISO: a SPEC aponta o plano "${caminho}", mas o arquivo não existe.`);
    else {
      const prox = plano.split('\n').find((l) => /^\s*- \[ \]/.test(l));
      partes.push(`PLANO DETALHADO: ${caminho}\n` + (prox ? `Próxima tarefa aberta: ${prox.trim()}` : 'Nenhuma tarefa aberta no plano.'));
    }
  }
}

const notes = ler('NOTES.md');
if (notes) partes.push('=== NOTES.md ===\n' + notes);

const est = lerEstado(raiz);
if (est.sujo && est.sessao !== e.session_id)
  partes.push(`AVISO: a sessão anterior alterou arquivos sem atualizar NOTES.md (${(est.alterados || []).join(', ')}). ` +
    'Confira o estado real e atualize NOTES.md antes de seguir.');
if (est.pendenteVerificacao && cfg.verificacao)
  partes.push('AVISO: há alterações ainda não verificadas pelo comando de verificação do projeto.');

responder({ hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: partes.join('\n\n') } });
