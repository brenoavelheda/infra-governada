---
description: Revisa e aplica a proposta de regras (governanca-proposta.json). Sem argumento mostra a diferença; "confirmar <código>" aplica
argument-hint: "[confirmar <código>]"
allowed-tools: Bash(node:*)
disable-model-invocation: true
---
!`node "${CLAUDE_PLUGIN_ROOT}/scripts/aplicar.js" $ARGUMENTS`

Mostre a saída acima ao usuário literalmente. Não altere arquivos e não rode a confirmação por conta própria.
