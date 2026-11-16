---
description: Define ou revisa a SPEC.md (brainstorm e plano via Superpowers; a SPEC resume e aponta)
---
Defina ou revise a SPEC do projeto com o usuário, seguindo `${CLAUDE_PLUGIN_ROOT}/protocolo.md`. Contexto adicional: $ARGUMENTS

1. Leia SPEC.md, NOTES.md e os documentos de planejamento que o projeto já tiver (CLAUDE.md indica quais). Não duplique o que já está decidido: referencie.
2. Design: use superpowers:brainstorming. Ao fim, o design aprovado pelo usuário fica salvo em arquivo.
3. Plano: use superpowers:writing-plans a partir do design. O plano fica salvo com tarefas em checkbox (`- [ ]`).
4. Escreva a SPEC.md como resumo curto:
   - linhas `Design:` e `Plano detalhado:` com os caminhos reais;
   - objetivo, critérios de aceite verificáveis, fora de escopo, restrições;
   - tabela de ondas: cada onda = uma fase do plano, com "pronto quando" objetivo.
   Remova a linha `<!-- TEMPLATE -->`.
5. Atualize o NOTES.md: onda atual = 1; próximo passo = primeira tarefa aberta do plano.
6. Restrições decidíveis que surgirem: sugira /governanca:regra para cada uma.

Superpowers indisponível: faça as perguntas diretamente (objetivo, critérios, fora de escopo, restrições) e use `Plano detalhado: nenhum`.

Não implemente nada neste comando.
