// Utilidades comuns dos scripts de governança.
// Um workspace é governado quando tem .claude/governanca.json; fora disso, todos os hooks ficam inertes.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MARCADOR = path.join('.claude', 'governanca.json');
const PLUGIN = path.join(__dirname, '..');
const DECISOES = ['deny', 'ask'];

function lerEntrada() {
  try { return JSON.parse(fs.readFileSync(0, 'utf8') || '{}'); } catch { return {}; }
}

// Sobe a partir do projeto até achar o marcador. null = workspace não governado.
function acharRaiz(entrada = {}) {
  let d = path.resolve(process.env.CLAUDE_PROJECT_DIR || entrada.cwd || process.cwd());
  for (;;) {
    if (fs.existsSync(path.join(d, MARCADOR))) return d;
    const pai = path.dirname(d);
    if (pai === d) return null;
    d = pai;
  }
}

// Glob simples (*, **, ?) para regex sobre caminho relativo com "/". Sem distinção de maiúsculas.
function globParaRegex(g) {
  let r = '';
  for (let i = 0; i < g.length; i++) {
    const c = g[i];
    if (c === '*') {
      if (g[i + 1] === '*') {
        i++;
        if (g[i + 1] === '/') { i++; r += '(?:.*/)?'; } else r += '.*';
      } else r += '[^/]*';
    } else if (c === '?') r += '[^/]';
    else r += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp('^' + r + '$', 'i');
}

// Valida e compila a configuração. Lança Error com mensagem legível se algo estiver errado.
function validarConfig(cfg) {
  if (!cfg || typeof cfg !== 'object' || Array.isArray(cfg)) throw new Error('o arquivo deve conter um objeto JSON');
  const regras = cfg.regras === undefined ? [] : cfg.regras;
  if (!Array.isArray(regras)) throw new Error('"regras" deve ser uma lista');
  const ids = new Set();
  const compiladas = regras.map((r, i) => {
    const onde = `regra ${i + 1}${r && r.id ? ` ("${r.id}")` : ''}`;
    if (!r || typeof r !== 'object') throw new Error(`${onde}: deve ser um objeto`);
    if (typeof r.id !== 'string' || !r.id) throw new Error(`${onde}: falta "id"`);
    if (ids.has(r.id)) throw new Error(`${onde}: id repetido`);
    ids.add(r.id);
    if (!DECISOES.includes(r.decisao)) throw new Error(`${onde}: "decisao" deve ser "deny" ou "ask"`);
    if (!r.caminho && !r.conteudo && !r.comando) throw new Error(`${onde}: defina "caminho", "conteudo" ou "comando"`);
    if (r.ferramentas !== undefined && !(Array.isArray(r.ferramentas) && r.ferramentas.every((f) => typeof f === 'string')))
      throw new Error(`${onde}: "ferramentas" deve ser uma lista de nomes`);
    const re = (campo) => {
      if (!r[campo]) return null;
      if (typeof r[campo] !== 'string') throw new Error(`${onde}: "${campo}" deve ser texto`);
      try { return new RegExp(r[campo], 'i'); } catch (e) { throw new Error(`${onde}: "${campo}" não é regex válida (${e.message})`); }
    };
    if (r.caminho && typeof r.caminho !== 'string') throw new Error(`${onde}: "caminho" deve ser texto`);
    return { ...r, _caminho: r.caminho ? globParaRegex(r.caminho) : null, _conteudo: re('conteudo'), _comando: re('comando') };
  });
  const v = cfg.verificacao || {};
  const comando = typeof v.comando === 'string' ? v.comando.trim() : '';
  const timeoutSeg = Math.min(Math.max(Number(v.timeoutSeg) || 120, 5), 280);
  return {
    exigirSpec: cfg.exigirSpec !== false,
    verificacao: comando ? { comando, timeoutSeg } : null,
    regras: compiladas,
  };
}

function lerConfig(raiz) {
  return validarConfig(JSON.parse(fs.readFileSync(path.join(raiz, MARCADOR), 'utf8')));
}

const dirEstado = (raiz) => path.join(raiz, '.governanca');

function lerEstado(raiz) {
  try { return JSON.parse(fs.readFileSync(path.join(dirEstado(raiz), 'estado.json'), 'utf8')); } catch { return {}; }
}
function salvarEstado(raiz, estado) {
  fs.mkdirSync(dirEstado(raiz), { recursive: true });
  fs.writeFileSync(path.join(dirEstado(raiz), 'estado.json'), JSON.stringify(estado, null, 2));
}
function auditar(raiz, registro) {
  fs.mkdirSync(dirEstado(raiz), { recursive: true });
  fs.appendFileSync(path.join(dirEstado(raiz), 'auditoria.jsonl'),
    JSON.stringify({ ts: new Date().toISOString(), ...registro }) + '\n');
}

function responder(obj) {
  process.stdout.write(JSON.stringify(obj));
  process.exit(0);
}

const hash8 = (texto) => crypto.createHash('sha256').update(texto).digest('hex').slice(0, 8);

module.exports = {
  MARCADOR, PLUGIN, lerEntrada, acharRaiz, globParaRegex, validarConfig, lerConfig,
  dirEstado, lerEstado, salvarEstado, auditar, responder, hash8,
};
