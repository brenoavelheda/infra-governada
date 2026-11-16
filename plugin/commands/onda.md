---
description: Executa a próxima onda da SPEC (fase do plano Superpowers), verifica e registra
---
Execute a próxima onda pendente da SPEC.md seguindo `${CLAUDE_PLUGIN_ROOT}/protocolo.md`. Observação do usuário: $ARGUMENTS

1. Identifique a onda e a fase correspondente no `Plano detalhado:` da SPEC.
2. Execute só as tarefas dessa fase com superpowers:executing-plans (ou subagent-driven-development, se as tarefas forem independentes). Sem plano: explore, mostre um plano curto e implemente.
3. Marque no plano as tarefas concluídas (`- [x]`).
4. Verifique o "pronto quando" da onda com superpowers:verification-before-completion e mostre a saída real.
5. Atualize o NOTES.md (feito, evidência, decisões, próximo passo) e marque a onda na SPEC.
6. Pare ao fim desta onda e reporte.
