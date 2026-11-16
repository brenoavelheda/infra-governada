---
description: Mostra o estado da governança neste workspace (config, regras, pendências, últimos bloqueios)
allowed-tools: Bash(node:*)
---
!`node "${CLAUDE_PLUGIN_ROOT}/scripts/status.js"`

Mostre a saída acima ao usuário, sem alterar arquivos. Se a config estiver inválida, explique o erro e o que o usuário precisa corrigir em `.claude/governanca.json`.
