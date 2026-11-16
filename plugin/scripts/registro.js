// PostToolUse: trilha de auditoria e controle de pendências (NOTES.md e verificação).
const path = require('path');
const { acharRaiz, lerEntrada, lerEstado, salvarEstado, auditar } = require('./lib');

const e = lerEntrada();
const raiz = acharRaiz(e);
if (!raiz) process.exit(0);

const ti = e.tool_input || {};
const alvo = ti.file_path || ti.notebook_path || ti.command || ti.url || '';
auditar(raiz, { sessao: e.session_id, ferramenta: e.tool_name, alvo: String(alvo).slice(0, 200) });

if (/^(Edit|Write|MultiEdit|NotebookEdit)$/.test(e.tool_name || '')) {
  const arq = String(ti.file_path || ti.notebook_path || '');
  const base = path.basename(arq).toUpperCase();
  const est = lerEstado(raiz);
  if (est.sessao !== e.session_id) Object.assign(est, { sessao: e.session_id, sujo: false, alterados: [] });
  if (base === 'NOTES.MD') Object.assign(est, { sujo: false, alterados: [] });
  else {
    est.sujo = true;
    est.alterados = [...new Set([...(est.alterados || []), path.relative(raiz, arq)])].slice(-50);
    if (base !== 'SPEC.MD') est.pendenteVerificacao = true;
  }
  salvarEstado(raiz, est);
}
process.exit(0);
