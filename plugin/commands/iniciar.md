---
description: Ativa a governança neste workspace (cria .claude/governanca.json, SPEC.md e NOTES.md)
allowed-tools: Bash(node:*)
---
Resultado da ativação:

!`node "${CLAUDE_PLUGIN_ROOT}/scripts/iniciar.js"`

Reporte o resultado acima ao usuário em até 4 linhas, sem criar nem alterar arquivos. Se a governança foi ativada: os gates já valem nesta sessão; o protocolo, a SPEC e o NOTES entram no contexto a partir da próxima sessão (ou após /clear). Próximo passo: /governanca:spec.
