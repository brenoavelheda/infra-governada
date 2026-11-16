# infra-governada

Marketplace do plugin **governanca**: infraestrutura governada para Claude Code. Gates determinísticos em código, ciclo SPEC → ondas → NOTES.md com recuperação automática, parada verificada e auditoria, ativados por workspace.

## Instalar
```
/plugin marketplace add brenoavelheda/infra-governada
/plugin install governanca@infra-governada
```
Depois, em cada projeto: `/governanca:iniciar`.

Documentação completa: [plugin/README.md](plugin/README.md).

## Estrutura
```
.claude-plugin/marketplace.json   catálogo do marketplace
plugin/                           o plugin
  .claude-plugin/plugin.json
  hooks/hooks.json                SessionStart, PreToolUse, PostToolUse, Stop
  scripts/                        gate, registro, parada, sessao, iniciar, aplicar, status
  commands/                       /governanca:iniciar, spec, onda, recovery, status, regra, aplicar
  templates/                      SPEC.md, NOTES.md, governanca.json
  protocolo.md                    protocolo injetado no início da sessão
  tests/                          node --test plugin/tests
```
