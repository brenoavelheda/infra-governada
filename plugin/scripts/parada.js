// Stop: "terminei" não é condição de parada.
// Com arquivos alterados: roda a verificação do projeto (se configurada) e exige NOTES.md atualizado.
const { execSync } = require('child_process');
const { acharRaiz, lerEntrada, lerConfig, lerEstado, salvarEstado, responder } = require('./lib');

const MAX_TENTATIVAS = 3;
const e = lerEntrada();
const raiz = acharRaiz(e);
if (!raiz) process.exit(0);

let cfg = { verificacao: null };
try { cfg = lerConfig(raiz); } catch { /* config inválida já é tratada pelo gate e pelo início de sessão */ }

const est = lerEstado(raiz);
if (!e.stop_hook_active) est.tentativas = 0;
const pendencias = [];

if (cfg.verificacao && est.pendenteVerificacao) {
  const { comando, timeoutSeg } = cfg.verificacao;
  try {
    execSync(comando, { cwd: raiz, timeout: timeoutSeg * 1000, stdio: 'pipe', encoding: 'utf8', windowsHide: true });
    est.pendenteVerificacao = false;
  } catch (err) {
    const saida = `${err.stdout || ''}${err.stderr || ''}`.trim();
    const cauda = err.killed ? `excedeu ${timeoutSeg} s` : (saida.slice(-1500) || err.message);
    pendencias.push(`[GATE:verificacao] \`${comando}\` falhou:\n${cauda}\nCorrija e encerre de novo.`);
  }
}

if (est.sujo && est.sessao === e.session_id) {
  pendencias.push(`[GATE:notes] Arquivos alterados sem registro no NOTES.md: ${(est.alterados || []).join(', ')}. ` +
    'Atualize NOTES.md (feito, verificação com evidência, próximo passo) e então encerre.');
}

if (!pendencias.length) { est.tentativas = 0; salvarEstado(raiz, est); process.exit(0); }

// Evita laço infinito: após 3 bloqueios seguidos, libera e avisa o usuário.
if ((est.tentativas || 0) >= MAX_TENTATIVAS) {
  est.tentativas = 0;
  salvarEstado(raiz, est);
  responder({ systemMessage: `[governança] Encerrado com pendências após ${MAX_TENTATIVAS} tentativas:\n${pendencias.join('\n')}` });
}
est.tentativas = (est.tentativas || 0) + 1;
salvarEstado(raiz, est);
responder({ decision: 'block', reason: pendencias.join('\n\n') });
