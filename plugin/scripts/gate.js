// PreToolUse: gates determinísticos. Regras decidíveis ficam aqui, fora do modelo.
// Inerte fora de workspace governado. Vale também em modo bypass.
const os = require('os');
const path = require('path');
const { acharRaiz, lerEntrada, lerConfig, auditar, responder } = require('./lib');

const e = lerEntrada();
const raiz = acharRaiz(e);
if (!raiz) process.exit(0);

const tool = e.tool_name || '';
const ti = e.tool_input || {};
const ESCRITA = ['Write', 'Edit', 'MultiEdit', 'NotebookEdit'];
const SHELL = ['Bash', 'PowerShell'];

const achados = [];
const negar = (id, motivo, saida) => achados.push({ decisao: 'deny', id, motivo: `${motivo} Como prosseguir: ${saida}` });
const perguntar = (id, motivo) => achados.push({ decisao: 'ask', id, motivo });

// deny vence ask; sem achado, a ferramenta segue o fluxo normal de permissões.
function decidir() {
  const a = achados.find((x) => x.decisao === 'deny') || achados.find((x) => x.decisao === 'ask');
  if (!a) process.exit(0);
  try {
    auditar(raiz, { sessao: e.session_id, ferramenta: tool, gate: a.id, decisao: a.decisao,
      alvo: String(ti.command || ti.file_path || ti.notebook_path || ti.path || ti.skill || '').slice(0, 200) });
  } catch { /* auditoria não pode impedir a decisão */ }
  responder({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: a.decisao,
    permissionDecisionReason: `[GATE:${a.id}] ${a.motivo}` } });
}

// Falha do gate = bloqueio (fail-closed), nunca liberação silenciosa.
process.on('uncaughtException', (err) => {
  achados.length = 0;
  negar('erro', `Falha interna do gate: ${err.message}.`, 'avise o usuário; o gate precisa ser corrigido.');
  decidir();
});

// --- envelope: a governança não pode ser alterada pelo próprio agente ---
const CONFIG_DIR = path.resolve(process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude'))
  .replace(/\\/g, '/').toLowerCase();
const normalizar = (p) => path.resolve(raiz, String(p)).replace(/\\/g, '/').toLowerCase();
function ehEnvelope(p) {
  const n = normalizar(p);
  return /\/\.claude\/(settings[^/]*\.json|governanca\.json|hooks\/|plugins\/)/.test(n)
    || /\/\.governanca\//.test(n) || /\/\.mcp\.json$/.test(n)
    || n.startsWith(CONFIG_DIR + '/settings') || n.startsWith(CONFIG_DIR + '/plugins/');
}
function ehSegredo(p) {
  const b = path.basename(String(p)).toLowerCase();
  if (/^\.env(\..+)?$/.test(b)) return !/\.(example|sample|template)$/.test(b);
  return /^(id_rsa|id_ed25519)/.test(b) || /\.(pem|key|p12|pfx)$/.test(b)
    || b === 'credentials.json' || /^service-account.*\.json$/.test(b);
}

let cfg;
try {
  cfg = lerConfig(raiz);
} catch (err) {
  if ([...ESCRITA, ...SHELL].includes(tool))
    negar('config', `.claude/governanca.json inválido: ${err.message}.`, 'o usuário corrige o arquivo; /governanca:status mostra o erro.');
  cfg = { regras: [] };
}

const alvo = ti.file_path || ti.notebook_path || ti.path || '';
const rel = alvo ? path.relative(raiz, path.resolve(raiz, String(alvo))).replace(/\\/g, '/') : '';
const comando = String(ti.command || '');
const conteudo = String(ti.content ?? ti.new_string ?? ti.new_source
  ?? (Array.isArray(ti.edits) ? ti.edits.map((x) => x.new_string || '').join('\n') : ''));

// --- gates embutidos ---
if (['Read', 'Grep', 'Glob', ...ESCRITA].includes(tool) && alvo) {
  if (ehSegredo(alvo))
    negar('segredo', `"${path.basename(String(alvo))}" é arquivo de segredo; o agente não lê nem altera.`,
      'peça ao usuário só o valor necessário, ou use .env.example.');
  if (ESCRITA.includes(tool) && ehEnvelope(alvo))
    negar('envelope', 'O agente não altera a governança (governanca.json, settings, hooks, plugins, .governanca/).',
      'proponha a mudança com /governanca:regra; o usuário aplica.');
}

if (SHELL.includes(tool)) {
  const c = comando;
  if (/(^|[\s'"\/\\=])\.env(\.(?!example|sample|template)[\w-]+)?(?=$|[\s'";|&)])/.test(c))
    negar('segredo', 'Comando referencia arquivo .env.', 'peça ao usuário só o valor necessário.');
  if (/\bsudo\b/.test(c))
    negar('privilegio', 'sudo não é permitido ao agente.', 'o usuário executa o comando manualmente.');
  if (/\brm\s+-[a-z]*r[a-z]*\s+["']?(\/|~|\$HOME|[a-z]:[\\\/]?)["']?(\s|$)/i.test(c))
    negar('destrutivo', 'Remoção recursiva da raiz ou da home.', 'restrinja a uma pasta específica do projeto.');
  if (/git\s+push\b.*(--force\b|--force-with-lease\b|\s-f\b)/.test(c))
    negar('force-push', 'Push forçado reescreve histórico remoto.', 'o usuário decide e executa manualmente.');
  if (/(curl|wget|iwr|Invoke-WebRequest|irm)\b[^|]*\|\s*(sh|bash|iex|powershell|pwsh)\b/i.test(c))
    negar('exec-remoto', 'Execução de script baixado da internet.', 'baixe, mostre o conteúdo ao usuário e peça aprovação.');
  const tocaEnvelope = /(\.claude[\\\/](settings|governanca|hooks|plugins)|\.governanca\b|\.mcp\.json|claude-profiles)/i.test(c);
  // Redirecionamentos inofensivos (2>&1, >/dev/null) não contam como escrita.
  const semRedirInocuo = c.replace(/\d*>&\d+/g, '').replace(/\d*>{1,2}\s*(\/dev\/null|nul)\b/gi, '');
  const muta = /(\brm\b|\bmv\b|\bcp\b|\bdel\b|\bren(ame)?\b|Remove-Item|Move-Item|Copy-Item|Rename-Item|Set-Content|Out-File|Add-Content|New-Item|\btee\b|sed\s+-i|>|writeFile|WriteAllText|\btouch\b|\bchmod\b|\bln\b|git\s+(checkout|restore|apply|stash))/i.test(semRedirInocuo);
  if (tocaEnvelope && muta)
    negar('envelope', 'Comando altera a governança.', 'proponha a mudança com /governanca:regra; o usuário aplica.');
  if (/aplicar\.js\b.*\bconfirmar\b/i.test(c))
    negar('envelope', 'Só o usuário confirma a aplicação de regras.', 'o usuário digita /governanca:aplicar confirmar <código>.');
  if (/git\s+push\b/.test(c)) perguntar('push', 'Publicar no repositório remoto.');
  if (/git\s+reset\s+--hard|git\s+clean\s+-[a-z]*f/.test(c)) perguntar('descarte', 'Descarta alterações locais sem volta.');
  if (/\b(firebase\s+deploy|vercel\b.*--prod|wrangler\s+(deploy|publish)|npm\s+publish|netlify\s+deploy|gcloud\b.*\bdeploy)\b/.test(c))
    perguntar('deploy', 'Deploy/publicação com efeito externo.');
  if (/\bdrop\s+(table|database)\b/i.test(c)) perguntar('banco', 'Remoção de tabela ou banco.');
}

// O agente não pode aprovar a própria mudança de regras invocando o comando do usuário.
if ((tool === 'Skill' || tool === 'SlashCommand') && /governanca:aplicar/.test(JSON.stringify(ti)))
  negar('envelope', 'Só o usuário aplica mudanças de regras.', 'peça ao usuário que digite /governanca:aplicar.');

// --- regras do projeto (.claude/governanca.json) ---
const PADRAO_ARQUIVO = ESCRITA;
for (const r of cfg.regras) {
  const ferr = r.ferramentas
    || [...(r.caminho || r.conteudo ? PADRAO_ARQUIVO : []), ...(r.comando ? SHELL : [])];
  if (!ferr.includes(tool)) continue;
  let casa;
  if (SHELL.includes(tool)) casa = !!r._comando && r._comando.test(comando);
  else {
    casa = !!(r._caminho || r._conteudo)
      && (!r._caminho || (!!rel && r._caminho.test(rel)))
      && (!r._conteudo || r._conteudo.test(conteudo));
  }
  if (!casa) continue;
  const motivo = r.motivo || 'Regra do projeto.';
  if (r.decisao === 'deny') negar(r.id, motivo, r.saida || 'fale com o usuário.');
  else perguntar(r.id, motivo);
}

decidir();
